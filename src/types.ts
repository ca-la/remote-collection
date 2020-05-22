import * as RD from "@cala/remote-data";

export type ById<A> = { [key: string]: A | undefined };
export type Remote<A> = RD.RemoteData<string[], A>;
export type RemoteList<A> = Remote<A[]>;
export type ListRemote<A> = Remote<A>[];
export type RemoteById<A> = ById<Remote<A>>;
export type NestedRemoteById<A> = RD.RemoteData<string[], RemoteById<A>>;
