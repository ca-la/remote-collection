import test from "ava";
import * as RD from "@cala/remote-data";
import RemoteCollection from "../index";
import { Item, items } from "./fixtures";

test("with no items loaded, #find", (t) => {
  const col = new RemoteCollection<Item>("id");
  t.deepEqual(col.find("a"), RD.initial, "returns RemoteInitial");
});

test("with items loaded, #find with existing ID", (t) => {
  const col = new RemoteCollection<Item>("id").withList(items);
  t.deepEqual(col.find("a"), RD.success(items[0]), "returns Success(Item)");
});

test("with items loaded, #find with missing ID", (t) => {
  const col = new RemoteCollection<Item>("id").withList(items);
  t.deepEqual(col.find("z"), RD.initial, "returns RemoteInitial");
});
