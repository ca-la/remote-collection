import test from "ava";
import * as RD from "@cala/remote-data";
import RemoteCollection from "../index";
import { Item, items } from "./fixtures";

test("with no items loaded, #reset", (t) => {
  const col = new RemoteCollection<Item>("id").reset();

  t.deepEqual(col.view(), RD.initial, "view is set to initial");
});

test("with some items loaded, #reset", (t) => {
  const col = new RemoteCollection<Item>("id").withList(items).reset();

  t.deepEqual(col.view(), RD.initial, "view is reset to initial");
});

test("with view failure, #reset", (t) => {
  const col = new RemoteCollection<Item>("id").withListFailure("Oh no").reset();

  t.deepEqual(col.view(), RD.initial, "view is reset to initial");
});

test("with no items loaded at the view key, #reset", (t) => {
  const col = new RemoteCollection<Item>("id")
    .withList(items, "someOtherViewKey")
    .reset("someViewKey");

  t.deepEqual(col.view("someViewKey"), RD.initial, "view is set to initial");
  t.deepEqual(
    col.view("someOtherViewKey"),
    RD.success<string[], Item[]>(items)
  );
});

test("with some items loaded at two view keys, #reset", (t) => {
  const col = new RemoteCollection<Item>("id")
    .withList(items, "someViewKey")
    .withList(items, "someOtherViewKey")
    .reset("someViewKey");

  t.deepEqual(col.view("someViewKey"), RD.initial, "view is set to initial");
  t.deepEqual(
    col.view("someOtherViewKey"),
    RD.success<string[], Item[]>(items)
  );
});

test("with view failure at two view keys, #reset", (t) => {
  const col = new RemoteCollection<Item>("id")
    .withListFailure("Oh no", "someViewKey")
    .withList(items, "someOtherViewKey")
    .reset("someViewKey");

  t.deepEqual(col.view("someViewKey"), RD.initial, "view is set to initial");
  t.deepEqual(
    col.view("someOtherViewKey"),
    RD.success<string[], Item[]>(items)
  );
});
