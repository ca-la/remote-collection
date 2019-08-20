import * as RD from '@cala/remote-data';
import { StrMap } from 'fp-ts/lib/StrMap';
import RemoteCollection, { DEFAULT_KEY, URI } from './';
import { RemoteList, ById, Remote } from './types';

interface LegacyJSON<Resource> {
  _URI: URI;
  knownIds: RD.RemoteJSON<string[], string[]>;
  idMap: ById<RD.RemoteJSON<string[], string[]>>;
  entities: ById<RD.RemoteJSON<string[], Resource>>;
}

export function isLegacyJSON<A>(candidate: any): candidate is LegacyJSON<A> {
  return (
    candidate &&
    candidate._URI === URI &&
    'knownIds' in candidate &&
    'idMap' in candidate &&
    'entities' in candidate
  );
}

export function fromJSON<A>(
  idProp: keyof A,
  legacy: unknown
): RemoteCollection<A> | unknown {
  if (isLegacyJSON<A>(legacy)) {
    const remoteCollection = new RemoteCollection<A>(idProp);

    const views = Object.keys(legacy.idMap).reduce(
      (acc: { [id: string]: RemoteList<string> }, id: string) => ({
        ...acc,
        [id]: RD.fromJSON(legacy.idMap[id] as RD.RemoteJSON<string[], string[]>)
      }),
      {
        [DEFAULT_KEY]: RD.fromJSON(legacy.knownIds)
      }
    );

    remoteCollection.views = new StrMap<RemoteList<string>>(views);

    const resources = Object.keys(legacy.entities).reduce(
      (acc: { [id: string]: Remote<A> }, id) => ({
        ...acc,
        [id]: RD.fromJSON(legacy.entities[id] as RD.RemoteJSON<string[], A>)
      }),
      {}
    );

    remoteCollection.resources = new StrMap<Remote<A>>(resources);

    return remoteCollection;
  }

  return legacy;
}
