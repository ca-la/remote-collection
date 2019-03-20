import { fromPairs, mapValues, omit, union, without } from 'lodash';
import * as RD from '@cala/remote-data';
import { lookup, insert, StrMap, toArray } from 'fp-ts/lib/StrMap';
import { sequence } from 'fp-ts/lib/Traversable';
import { array } from 'fp-ts/lib/Array';

import { ById, Remote, RemoteList, RemoteById } from './types';
import { safeGet } from './utils';

export const URI = '@cala/remote-collection';
export type URI = typeof URI;
declare module 'fp-ts/lib/HKT' {
  interface URI2HKT1<A> {
    '@cala/remote-collection': Collection<A>;
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

const mergeIdMap = (
  target: StrMap<RemoteList<string>>,
  source: StrMap<RemoteList<string>>
): StrMap<RemoteList<string>> => {
  return toArray(source).reduce((acc, [sourceKey, remoteList]) => {
    const existingList = lookup(sourceKey, acc);
    const concatenated = existingList.fold(remoteList, existing =>
      existing.chain(list => remoteList.map(l => list.concat(l)))
    );
    return insert(sourceKey, concatenated, acc);
  }, new StrMap<RemoteList<string>>(target.value));
};

export default class Collection<Resource extends { [key: string]: any }> {
  readonly _A!: Resource;
  readonly _URI!: URI;

  public knownIds: RemoteList<string> = RD.initial;
  public idMap: StrMap<RemoteList<string>> = new StrMap({});
  public entities: ById<Remote<Resource>> = {};

  constructor(fromCollection?: Collection<Resource>) {
    if (fromCollection) {
      this.knownIds = fromCollection.knownIds.map(ids => ids.slice());
      this.idMap = new StrMap(fromCollection.idMap.value);
      this.entities = { ...fromCollection.entities };
    }
  }

  public refreshAt(at: string): Collection<Resource> {
    const col = new Collection(this);
    const existingList = lookup(at, col.idMap)
      .getOrElse(RD.pending)
      .toOption()
      .fold<RD.RemoteData<string[], string[]>>(RD.pending, RD.refresh);
    col.idMap = insert(at, existingList, col.idMap);

    return col;
  }

  public refresh(): Collection<Resource> {
    const col = new Collection(this);
    col.knownIds = col.knownIds.toOption().fold<RemoteList<string>>(RD.pending, RD.refresh);
    col.entities = mapValues<RemoteById<Resource>, Remote<Resource>>(
      col.entities,
      (entity: Remote<Resource> | undefined) =>
        entity ? entity.toOption().fold<Remote<Resource>>(RD.pending, RD.refresh) : RD.pending
    );

    return col;
  }

  public withListAt(at: string, idProp: keyof Resource, list: Resource[]): Collection<Resource> {
    const col = this.withList(idProp, list);
    const ids = RD.success<string[], string[]>(list.map(resource => resource[idProp]));
    col.idMap = insert(at, ids, col.idMap);
    return col;
  }

  public withList(idProp: keyof Resource, list: Resource[]): Collection<Resource> {
    const col = new Collection(this);
    const idsAndSuccesses: [string, Remote<Resource>][] = list.map(
      (resource: Resource): [string, Remote<Resource>] => [
        resource[idProp],
        RD.success<string[], Resource>(resource)
      ]
    );
    col.knownIds = RD.success(idsAndSuccesses.map(([id]) => id));
    col.entities = fromPairs(idsAndSuccesses);

    return col;
  }

  public withListFailureAt(at: string, error: string): Collection<Resource> {
    const col = this.withListFailure(error);
    col.idMap = insert(at, RD.failure([error]), col.idMap);
    return col;
  }

  public withListFailure(error: string): Collection<Resource> {
    const col = new Collection(this);
    col.knownIds = RD.failure([error]);
    col.entities = {};

    return col;
  }

  public fetch(id: string): Collection<Resource> {
    const col = new Collection(this);
    const currentValue = safeGet(this.entities, id);
    col.entities = {
      ...this.entities,
      [id]: currentValue.fold<Remote<Resource>>(RD.pending, (value: Remote<Resource>) =>
        value.toOption().fold<Remote<Resource>>(RD.pending, RD.refresh)
      )
    };

    return col;
  }

  public withResourceAt(at: string, id: string, resource: Resource): Collection<Resource> {
    const col = this.withResource(id, resource);
    const existingIds = lookup(at, col.idMap)
      .getOrElse(RD.success([]))
      .map(idList => idList.concat(id));
    col.idMap = insert(at, existingIds, col.idMap);
    return col;
  }

  public withResource(id: string, resource: Resource): Collection<Resource> {
    const col = new Collection(this);
    col.knownIds = this.concatKnownId(id);
    col.entities = {
      ...this.entities,
      [id]: RD.success(resource)
    };

    return col;
  }

  public mapResource(
    id: string,
    mapFunction: (resource: Resource) => Resource
  ): Collection<Resource> {
    const col = new Collection(this);

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

  public withResourceFailureAt(at: string, id: string, error: string): Collection<Resource> {
    const col = this.withResourceFailure(id, error);
    const existingIds = lookup(at, col.idMap)
      .getOrElse(RD.success([]))
      .map(idList => idList.concat(id));
    col.idMap = insert(at, existingIds, col.idMap);
    return col;
  }

  public withResourceFailure(id: string, error: string): Collection<Resource> {
    const col = new Collection(this);
    col.knownIds = this.concatKnownId(id);
    col.entities = {
      ...this.entities,
      [id]: RD.failure([error])
    };

    return col;
  }

  public removeAt(at: string, id: string): Collection<Resource> {
    const col = new Collection(this);
    const existingIds = lookup(at, col.idMap).map(remoteList =>
      remoteList.map(idList => without(idList, id))
    );

    if (existingIds.isSome()) {
      col.idMap = insert(at, existingIds.getOrElse(RD.initial), col.idMap);
    }

    return col;
  }

  public remove(id: string): Collection<Resource> {
    const col = new Collection(this);
    col.knownIds = this.knownIds.map(ids => without(ids, id));
    col.entities = omit(this.entities, id);

    return col;
  }

  public viewAt(at: string): RemoteList<Resource> {
    return lookup(at, this.idMap)
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

  public view(ids?: string[]): RemoteList<Resource> {
    const viewIds: RemoteList<string> = ids
      ? this.knownIds.caseOf<RemoteList<string>>({
          failure: RD.failure,
          initial: RD.initial,
          pending: RD.pending,
          refresh: () => RD.refresh(ids),
          success: () => RD.success(ids)
        })
      : this.knownIds;
    return viewIds.caseOf<RemoteList<Resource>>({
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

  public concatResources(idProp: keyof Resource, resources: Resource[]): Collection<Resource> {
    return resources.reduce(
      (acc, resource) => acc.withResource(resource[idProp], resource),
      new Collection(this)
    );
  }

  public concat(idProp: keyof Resource, other: Collection<Resource>): Collection<Resource> {
    const col = new Collection<Resource>(this);

    const concatenated = other
      .view()
      .toOption()
      .fold(col, (bResources: Resource[]) => col.concatResources(idProp, bResources));
    concatenated.idMap = mergeIdMap(concatenated.idMap, other.idMap);

    return concatenated;
  }

  private concatKnownId(id: string): RemoteList<string> {
    const loneId = RD.success<string[], string[]>([id]);
    return this.knownIds.caseOf<RemoteList<string>>({
      failure: () => loneId,
      initial: loneId,
      pending: loneId,
      refresh: stale => RD.refresh(union(stale, [id])),
      success: value => RD.success(union(value, [id]))
    });
  }
}
