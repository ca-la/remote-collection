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
  public idMap: StrMap<RemoteList<string>> = new StrMap({});
  public entities: ById<Remote<Resource>> = {};

  constructor(idProp: keyof Resource) {
    this.idProp = idProp;
  }

  public refresh(viewKey: string = DEFAULT_KEY): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);
    const existingList = lookup(viewKey, col.idMap)
      .getOrElse(RD.pending)
      .toOption()
      .fold<RD.RemoteData<string[], string[]>>(RD.pending, RD.refresh);
    col.idMap = insert(viewKey, existingList, col.idMap);

    return col;
  }

  public withList(list: Resource[], viewKey: string = DEFAULT_KEY): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    const resourceIds: string[] = list.map((resource: Resource): string => resource[this.idProp]);
    const newIds = RD.success<string[], string[]>(resourceIds);

    col.idMap = insert(viewKey, newIds, col.idMap);
    col.entities = list.reduce(
      (acc, resource) => ({ ...acc, [resource[this.idProp]]: resource }),
      col.entities
    );

    return col;
  }

  public withListFailure(error: string, viewKey: string = DEFAULT_KEY): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    col.idMap = insert(viewKey, RD.failure([error]), col.idMap);

    return col;
  }

  public fetch(id: string): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);
    const currentValue = safeGet(this.entities, id);
    col.entities = {
      ...this.entities,
      [id]: currentValue.fold<Remote<Resource>>(RD.pending, (value: Remote<Resource>) =>
        value.toOption().fold<Remote<Resource>>(RD.pending, RD.refresh)
      )
    };

    return col;
  }

  public withResource(resource: Resource): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);
    col.entities = {
      ...this.entities,
      [resource[this.idProp]]: RD.success(resource)
    };

    return col;
  }

  public mapResource(
    id: string,
    mapFunction: (resource: Resource) => Resource
  ): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    const existingResource = col.entities[id];
    if (!existingResource) {
      return col;
    }

    col.entities = {
      ...this.entities,
      [id]: existingResource.map(mapFunction)
    };

    return col;
  }

  public withResourceFailure(id: string, error: string): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);
    col.entities = {
      ...this.entities,
      [id]: RD.failure([error])
    };

    return col;
  }

  public omit(id: string, viewKey: string = DEFAULT_KEY): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);
    const existingIds = lookup(viewKey, col.idMap).map(remoteList =>
      remoteList.map(idList => without(idList, id))
    );

    if (existingIds.isSome()) {
      col.idMap = insert(viewKey, existingIds.getOrElse(RD.initial), col.idMap);
    }

    return col;
  }

  public remove(id: string): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    col.entities = omit(this.entities, id);

    return col;
  }

  public view(viewKey: string = DEFAULT_KEY): RemoteList<Resource> {
    return lookup(viewKey, this.idMap)
      .getOrElse(RD.initial)
      .caseOf<RemoteList<Resource>>({
        failure: RD.failure,
        initial: RD.initial,
        pending: RD.pending,
        refresh: knownIds =>
          view(this.entities, knownIds)
            .toOption()
            .fold<RemoteList<Resource>>(RD.pending, RD.refresh),
        success: knownIds => view(this.entities, knownIds)
      });
  }

  public find(id: string): Remote<Resource> {
    return safeGet(this.entities, id).getOrElse(RD.initial);
  }

  public concat(other: RemoteCollection<Resource>): RemoteCollection<Resource> {
    // Add to existing view keys
    let col = this.idMap.reduceWithKey(
      new RemoteCollection<Resource>(this.idProp),
      (key: string, acc: RemoteCollection<Resource>) => {
        const currentViewOrEmpty = this.view(key).getOrElse([]);

        return other.view(key).caseOf<RemoteCollection<Resource>>({
          initial: acc,
          failure: (errors: string[]) => acc.withListFailure(key, errors[0] || ''),
          pending: acc,
          refresh: (resources: Resource[]) =>
            acc.withList(currentViewOrEmpty.concat(resources), key).refresh(key),
          success: (resources: Resource[]) =>
            acc.withList(currentViewOrEmpty.concat(resources), key)
        });
      }
    );

    // Add to new view keys
    col = other.idMap.reduceWithKey(col, (key: string, acc: RemoteCollection<Resource>) => {
      return other.view(key).caseOf<RemoteCollection<Resource>>({
        initial: acc,
        failure: (errors: string[]) => acc.withListFailure(key, errors[0] || ''),
        pending: acc,
        refresh: (resources: Resource[]) => acc.withList(resources, key).refresh(key),
        success: (resources: Resource[]) => acc.withList(resources, key)
      });
    });

    // Merge resources from `other` to this idMap
    col.entities = Object.keys(col.entities).reduce(
      (acc, key) => ({ ...acc, [key]: other.entities[key] }),
      col.entities
    );

    return col;
  }
}
