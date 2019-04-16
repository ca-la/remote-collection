import { omit, without } from 'lodash';
import * as RD from '@cala/remote-data';
import { lookup, insert, StrMap } from 'fp-ts/lib/StrMap';
import { sequence } from 'fp-ts/lib/Traversable';
import { array } from 'fp-ts/lib/Array';

import { ById, Remote, RemoteList, RemoteById } from './types';
import { safeGet } from './utils';

export const URI = '@cala/remote-collection';
export type URI = typeof URI;
export const DEFAULT_KEY = `${URI}_DEFAULT_KEY`;
declare module 'fp-ts/lib/HKT' {
  interface URI2HKT1<A> {
    '@cala/remote-collection': RemoteCollection<A>;
  }
}

const view = <A>(entities: RemoteById<A>, ids: string[]): RemoteList<A> => {
  const s = sequence(RD.remoteData, array);

  return s(
    ids.reduce(
      (resources: Remote<A>[], id: string) =>
        safeGet<Remote<A>>(entities, id).fold<Remote<A>[]>(resources, (a: Remote<A>) =>
          resources.concat(a)
        ),
      []
    )
  );
};

export default class RemoteCollection<Resource extends { [key: string]: any }> {
  readonly _A!: Resource;
  readonly _URI!: URI;

  private idProp: keyof Resource;
  public views: StrMap<RemoteList<string>> = new StrMap({});
  public resources: ById<Remote<Resource>> = {};

  constructor(idProp: keyof Resource) {
    this.idProp = idProp;
  }

  public concat(other: RemoteCollection<Resource>): RemoteCollection<Resource> {
    const col = new RemoteCollection<Resource>(this.idProp);

    // Add ID to existing view keys
    col.views = other.views.reduceWithKey(
      new StrMap<RemoteList<string>>(this.views.value),
      (key, acc, remoteList) => {
        const existingList = lookup(key, acc);
        const concatenated = existingList.fold(remoteList, existing =>
          existing.chain(list => remoteList.map(l => list.concat(l)))
        );

        return insert(key, concatenated, acc);
      }
    );

    // Merge resources from `other` to this entities map
    col.resources = Object.keys(other.resources).reduce(
      (acc, key) => ({ ...acc, [key]: other.resources[key] }),
      this.resources
    );

    return col;
  }

  public fetch(id: string): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);
    const currentValue = safeGet(this.resources, id);
    col.resources = {
      ...this.resources,
      [id]: currentValue.fold<Remote<Resource>>(RD.pending, (value: Remote<Resource>) =>
        value.toOption().fold<Remote<Resource>>(RD.pending, RD.refresh)
      )
    };

    return col;
  }

  public find(id: string): Remote<Resource> {
    return safeGet(this.resources, id).getOrElse(RD.initial);
  }

  public mapResource(
    id: string,
    mapFunction: (resource: Resource) => Resource
  ): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    const existingResource = col.resources[id];
    if (!existingResource) {
      return col;
    }

    col.resources = {
      ...this.resources,
      [id]: existingResource.map(mapFunction)
    };

    return col;
  }

  public omit(id: string, viewKey: string = DEFAULT_KEY): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);
    const existingIds = lookup(viewKey, col.views).map(remoteList =>
      remoteList.map(idList => without(idList, id))
    );

    if (existingIds.isSome()) {
      col.views = insert(viewKey, existingIds.getOrElse(RD.initial), col.views);
    }

    return col;
  }

  public refresh(viewKey: string = DEFAULT_KEY): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);
    const existingList = lookup(viewKey, col.views)
      .getOrElse(RD.pending)
      .toOption()
      .fold<RD.RemoteData<string[], string[]>>(RD.pending, RD.refresh);
    col.views = insert(viewKey, existingList, col.views);

    return col;
  }

  public remove(id: string): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    col.resources = omit(this.resources, id);

    return col;
  }

  public withList(list: Resource[], viewKey: string = DEFAULT_KEY): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    const resourceIds: string[] = list.map((resource: Resource): string => resource[this.idProp]);
    const newIds = RD.success<string[], string[]>(resourceIds);

    col.views = insert(viewKey, newIds, col.views);
    col.resources = list.reduce(
      (acc, resource) => ({ ...acc, [resource[this.idProp]]: RD.success(resource) }),
      col.resources
    );

    return col;
  }

  public withListFailure(error: string, viewKey: string = DEFAULT_KEY): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    col.views = insert(viewKey, RD.failure([error]), col.views);

    return col;
  }

  public withResource(resource: Resource): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);
    col.resources = {
      ...this.resources,
      [resource[this.idProp]]: RD.success(resource)
    };

    return col;
  }

  public withResourceFailure(id: string, error: string): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);
    col.resources = {
      ...this.resources,
      [id]: RD.failure([error])
    };

    return col;
  }

  public view(viewKey: string = DEFAULT_KEY): RemoteList<Resource> {
    return lookup(viewKey, this.views)
      .getOrElse(RD.initial)
      .caseOf<RemoteList<Resource>>({
        failure: RD.failure,
        initial: RD.initial,
        pending: RD.pending,
        refresh: knownIds =>
          view(this.resources, knownIds)
            .toOption()
            .fold<RemoteList<Resource>>(RD.pending, RD.refresh),
        success: knownIds => view(this.resources, knownIds)
      });
  }
}
