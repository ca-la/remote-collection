import { Type, ValidationError } from "io-ts";
import { identity } from "fp-ts/lib/function";
import { PathReporter } from "io-ts/lib/PathReporter";
import { at, fromPairs, omit } from "lodash";
import * as RD from "@scotttrinh/remote-data-ts";
import { Option, option, none, some, fromNullable } from "fp-ts/lib/Option";
import { Either, either, left } from "fp-ts/lib/Either";
import { sequence, traverse } from "fp-ts/lib/Traversable";
import { array } from "fp-ts/lib/Array";

import {
  ById,
  Remote,
  RemoteList,
  RemoteById,
  ListRemote,
  NestedRemoteById
} from "./types";
import { safeGet } from "./utils";

const view = <A>(entities: RemoteById<A>, ids: string[]): RemoteList<A> => {
  const s = sequence(RD.remoteData, array);

  return s(
    ids.reduce(
      (resources: Remote<A>[], id: string) =>
        safeGet<Remote<A>>(entities, id).fold<Remote<A>[]>(
          resources,
          (a: Remote<A>) => resources.concat(a)
        ),
      []
    )
  );
};

export interface CollectionOptions<Resource> {
  getCollection: () => Promise<Resource[]>;
  getResource: (id: string) => Promise<Resource>;
  updateResource: (id: string, update: Partial<Resource>) => Promise<Resource>;
  deleteResource: (id: string) => Promise<void>;
  getIdFromResource: (resource: Resource) => string;
  idProp: string;
}

export default class Collection<Resource> {
  private idList: RemoteList<string> = RD.initial;
  private entities: ById<Remote<Resource>> = {};

  constructor(private options: CollectionOptions<Resource>) {}

  public refresh(): Promise<Collection<Resource>> {
    this.idList = this.idList
      .toOption()
      .fold<RemoteList<string>>(RD.pending, RD.refresh);

    return this.options
      .getCollection()
      .then(resources => {
        this.idList = RD.success(resources.map(this.options.getIdFromResource));
        this.entities = fromPairs(
          resources.map(resource => [
            this.options.getIdFromResource(resource),
            RD.success<string[], Resource>(resource)
          ])
        );
        return this;
      })
      .catch((error: Error) => {
        this.idList = RD.failure([error.message]);
        return this;
      });
  }

  public list(): RemoteList<Resource> {
    return this.idList.map((ids: string[]) => view(this.entities, ids)).caseOf({
      failure: (err: string[]) => RD.failure(err),
      initial: RD.initial,
      pending: RD.pending,
      refresh: identity,
      success: identity
    });
  }

  public view(ids: string[]): RemoteList<Resource> {
    return view(this.entities, ids);
  }

  public fetch(id: string): Promise<Collection<Resource>> {
    this.entities = {
      ...this.entities,
      [id]: safeGet(this.entities, id).fold<Remote<Resource>>(
        RD.pending,
        (value: Remote<Resource>) =>
          value
            .toOption()
            .fold<Remote<Resource>>(RD.pending, (value: Resource) =>
              RD.refresh(value)
            )
      )
    };

    return this.options.getResource(id).then(resource => {
      this.entities = {
        ...this.entities,
        [id]: RD.success(resource)
      };
      return this;
    });
  }

  public get(id: string): Remote<Resource> {
    return safeGet(this.entities, id).fold<Remote<Resource>>(
      RD.failure([`No resource found with ID: ${id}`]),
      identity
    );
  }

  public update(
    id: string,
    update: Partial<Resource>
  ): Promise<Collection<Resource>> {
    const currentValue = safeGet(this.entities, id);

    this.entities = {
      ...this.entities,
      [id]: currentValue.foldL<Remote<Resource>>(
        () => {
          throw new Error(`Item not found with ID: ${id}`);
        },
        (value: Remote<Resource>) =>
          value
            .toOption()
            .fold<Remote<Resource>>(RD.pending, (value: Resource) =>
              RD.refresh(value)
            )
      )
    };

    return this.options.updateResource(id, update).then(resource => {
      this.entities = {
        ...this.entities,
        [id]: RD.success(resource)
      };
      return this;
    });
  }

  public delete(id: string): Promise<Collection<Resource>> {
    const currentValue = safeGet(this.entities, id);

    this.entities = {
      ...this.entities,
      [id]: currentValue.foldL<Remote<Resource>>(
        () => {
          throw new Error(`Item not found with ID: ${id}`);
        },
        (value: Remote<Resource>) =>
          value
            .toOption()
            .fold<Remote<Resource>>(RD.pending, (value: Resource) =>
              RD.refresh(value)
            )
      )
    };

    return this.options.deleteResource(id).then(() => {
      this.entities = omit(this.entities, id);
      return this;
    });
  }
}
