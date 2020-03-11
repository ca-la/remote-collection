import { without } from 'lodash';
import * as RD from '@cala/remote-data';
import { lookup, insert, StrMap, remove } from 'fp-ts/lib/StrMap';
import { sequence } from 'fp-ts/lib/Traversable';
import { array } from 'fp-ts/lib/Array';

import { Remote, RemoteList } from './types';
import * as compat from './compat';

export const URI = '@cala/remote-collection';
export type URI = typeof URI;
export const DEFAULT_KEY = `${URI}_DEFAULT_KEY`;
declare module 'fp-ts/lib/HKT' {
  interface URI2HKT1<A> {
    '@cala/remote-collection': RemoteCollection<A>;
  }
}

export interface RemoteCollectionJSON<A> {
  _URI: URI;
  idProp: keyof A;
  resources: StrMap<Remote<A>>;
  views: StrMap<RemoteList<string>>;
}

const view = <A>(entities: StrMap<Remote<A>>, ids: string[]): RemoteList<A> => {
  const s = sequence(RD.remoteData, array);

  return s(
    ids.reduce(
      (resources: Remote<A>[], id: string) =>
        lookup(id, entities).fold<Remote<A>[]>(resources, (a: Remote<A>) =>
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
  public resources: StrMap<Remote<Resource>> = new StrMap({});

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
          existing.fold(
            remoteList,
            remoteList,
            () => remoteList,
            list => remoteList.map(l => list.concat(l)),
            list => remoteList.map(l => list.concat(l))
          )
        );

        return insert(key, concatenated, acc);
      }
    );

    // Merge resources from `other` to this entities map
    col.resources = other.resources.reduceWithKey(
      this.resources,
      (key, acc, resource) => insert(key, resource, acc)
    );

    return col;
  }

  public fetch(id: string): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);
    const resourceSetToFetching = this.find(id).caseOf<
      | RD.RemotePending<string[], Resource>
      | RD.RemoteRefresh<string[], Resource>
    >({
      initial: RD.pending,
      failure: () => RD.pending,
      pending: RD.pending,
      refresh: RD.refresh,
      success: RD.refresh
    });

    col.resources = insert(id, resourceSetToFetching, col.resources);

    return col;
  }

  public find(id: string): Remote<Resource> {
    return lookup(id, this.resources).getOrElse(RD.initial);
  }

  public map(
    mapFunction: (resource: Resource) => Resource,
    viewKey: string = DEFAULT_KEY
  ): RemoteCollection<Resource> {
    const mapped = new RemoteCollection(this.idProp);

    mapped.resources = lookup(viewKey, this.views)
      .getOrElse(RD.initial)
      .reduce(
        (acc, idList) =>
          idList.reduce(
            (ac, id) => insert(id, this.find(id).map(mapFunction), ac),
            acc
          ),
        mapped.resources
      );

    return this.concat(mapped);
  }

  public mapResource(
    id: string,
    mapFunction: (resource: Resource) => Resource
  ): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    col.resources = insert(id, this.find(id).map(mapFunction), this.resources);

    return col;
  }

  public omit(
    id: string,
    viewKey: string = DEFAULT_KEY
  ): RemoteCollection<Resource> {
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

    col.resources = remove(id, this.resources);

    return col;
  }

  public reset(viewKey: string = DEFAULT_KEY): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    col.views = remove(viewKey, col.views);

    return col;
  }

  public withList(
    list: Resource[],
    viewKey: string = DEFAULT_KEY
  ): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    const resourceIds: string[] = list.map(
      (resource: Resource): string => resource[this.idProp]
    );
    const newIds = RD.success<string[], string[]>(resourceIds);

    col.views = insert(viewKey, newIds, col.views);

    return list.reduce((acc, resource) => acc.withResource(resource), col);
  }

  public withListFailure(
    error: string,
    viewKey: string = DEFAULT_KEY
  ): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    col.views = insert(viewKey, RD.failure([error]), col.views);

    return col;
  }

  public withResource(resource: Resource): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    col.resources = insert(
      resource[this.idProp],
      RD.success(resource),
      col.resources
    );

    return col;
  }

  public withResourceFailure(
    id: string,
    error: string
  ): RemoteCollection<Resource> {
    const col = new RemoteCollection(this.idProp).concat(this);

    col.resources = insert(id, RD.failure([error]), col.resources);

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

  public toJSON(): RemoteCollectionJSON<Resource> {
    return {
      _URI: URI,
      idProp: this.idProp,
      resources: this.resources,
      views: this.views
    };
  }
}

function isRemoteCollectionJSON<A>(
  candidate: any
): candidate is RemoteCollectionJSON<A> {
  return (
    candidate &&
    candidate._URI === URI &&
    'views' in candidate &&
    'resources' in candidate &&
    'idProp' in candidate
  );
}

export function fromJSON<A>(
  _: string,
  value: unknown
): RemoteCollection<A> | unknown {
  if (isRemoteCollectionJSON<A>(value)) {
    const remoteCollection: RemoteCollection<A> = new RemoteCollection<A>(
      value.idProp
    );

    remoteCollection.views = new StrMap<RemoteList<string>>(
      value.views.value
    ).map(RD.fromJSON);
    remoteCollection.resources = new StrMap<Remote<A>>(
      value.resources.value
    ).map(RD.fromJSON);

    return remoteCollection;
  } else if (compat.isLegacyJSON(value)) {
    // TODO: Figure out a better way to set the `idProp`
    return compat.fromJSON('id', value);
  }

  return value;
}
