import { Option, fromNullable } from 'fp-ts/lib/Option';
import { ById, Remote, RemoteById, NestedRemoteById } from './types';

export const safeGet = <A>(byId: ById<A>, id: string) => fromNullable(byId[id]);
