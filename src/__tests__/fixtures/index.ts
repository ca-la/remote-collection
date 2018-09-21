import Collection from "../../index";

export interface Item {
  id: string;
  foo: string;
}

export const items: Item[] = [{ id: "a", foo: "bar" }, { id: "b", foo: "baz" }];

export interface TestContext {
  col: Collection<Item>;
}
