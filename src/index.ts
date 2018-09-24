import { fromPairs, mapValues, omit, union, without } from 'lodash';
import * as RD from '@cala/remote-data';
import { Option } from 'fp-ts/lib/Option';
import { sequence } from 'fp-ts/lib/Traversable';
import { array } from 'fp-ts/lib/Array';

import { ById, Remote, RemoteList, RemoteById } from './types';
import { safeGet } from './utils';

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

export default class Collection<Resource extends { [key: string]: any }> {
  public knownIds: RemoteList<string> = RD.initial;
  public entities: ById<Remote<Resource>> = {};

  constructor(fromCollection?: Collection<Resource>) {
    if (fromCollection) {
      this.knownIds = fromCollection.knownIds.map(ids => ids.slice());
      this.entities = { ...fromCollection.entities };
    }
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

  public withList(idProp: string, list: Resource[]): Collection<Resource> {
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

  public withResource(id: string, resource: Resource): Collection<Resource> {
    const col = new Collection(this);
    col.knownIds = this.concatKnownId(id);
    col.entities = {
      ...this.entities,
      [id]: RD.success(resource)
    };

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

  public remove(id: string): Collection<Resource> {
    const col = new Collection(this);
    col.knownIds = this.knownIds.map(ids => without(ids, id));
    col.entities = omit(this.entities, id);

    return col;
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

  public find(id: string): Option<Remote<Resource>> {
    return safeGet(this.entities, id);
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
