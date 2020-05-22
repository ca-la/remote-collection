import test from "ava";
import * as RD from "@cala/remote-data";
import RemoteCollection from "../index";
import { Item, items } from "./fixtures";

test("with no items loaded, #withList", (t) => {
  const col = new RemoteCollection<Item>("id")
    .withList(items)
    .withList(items, "someViewKey");

  t.deepEqual(
    col.view(),
    RD.success<string[], Item[]>(items),
    "adds the items as a success"
  );
  t.deepEqual(
    col.view("someViewKey"),
    RD.success<string[], Item[]>(items),
    "adds the items as a success"
  );
  t.deepEqual(
    col.view("someOtherViewKey"),
    RD.initial,
    "does not update other keys"
  );
});

test("with item loading failure, #withList", (t) => {
  const col = new RemoteCollection<Item>("id")
    .withListFailure("Failed")
    .withList(items);

  t.deepEqual(col.view(), RD.success<string[], Item[]>(items));
});
