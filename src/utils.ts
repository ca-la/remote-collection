import { fromNullable } from "fp-ts/lib/Option";
import { ById } from "./types";

export const safeGet = <A>(byId: ById<A>, id: string) => fromNullable(byId[id]);
