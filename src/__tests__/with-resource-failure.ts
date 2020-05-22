import test from "ava";
import * as RD from "@cala/remote-data";
import RemoteCollection from "../index";
import { Item, items } from "./fixtures";

test("with no items loaded, #withResourceFailure", (t) => {
  const col = new RemoteCollection<Item>("id").withResourceFailure(
    "a",
    "Failed"
  );

  t.deepEqual(
    col.find("a"),
    RD.failure<string[], Item>(["Failed"]),
    "set key to failure"
  );
});

test("with view loaded, #withResourceFailure on an existing ID", (t) => {
  const col = new RemoteCollection<Item>("id")
    .withList(items)
    .withResourceFailure("a", "Failed");

  t.deepEqual(
    col.find("a"),
    RD.failure<string[], Item>(["Failed"]),
    "set key to failure"
  );
  t.deepEqual(
    col.view(),
    RD.failure<string[], Item[]>(["Failed"]),
    "set the list to failure"
  );
});

test("with view loaded, #withResourceFailure on an unknown ID", (t) => {
  const col = new RemoteCollection<Item>("id")
    .withList(items)
    .withResourceFailure("z", "Failed");

  t.deepEqual(
    col.find("z"),
    RD.failure<string[], Item>(["Failed"]),
    "set key to failure"
  );
  t.deepEqual(
    col.view(),
    RD.success<string[], Item[]>(items),
    "does not affect views without that resource"
  );
});

test("with view loading failure, #withResourceFailure", (t) => {
  const col = new RemoteCollection<Item>("id")
    .withListFailure("Failed")
    .withResourceFailure("a", "Failure!");

  t.deepEqual(
    col.view(),
    RD.failure<string[], Item[]>(["Failed"])
  );
  t.deepEqual(
    col.find("a"),
    RD.failure<string[], Item>(["Failure!"])
  );
});
