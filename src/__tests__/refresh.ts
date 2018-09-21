import anyTest, { FailAssertion, TestInterface } from "ava";
import Collection from "../index";
import { Item, items, TestContext } from "./fixtures";

const test = anyTest as TestInterface<TestContext>;

test.beforeEach(t => {
  t.context.col = new Collection<Item>({
    getCollection: () => Promise.resolve(items),
    getResource: (id: string) => {
      const item = items.find(i => i.id === id);
      return item
        ? Promise.resolve(item)
        : Promise.reject(new Error("Item not found"));
    },
    updateResource: (id: string, update: Partial<Item>) => {
      const item = items.find(i => i.id === id);
      return item
        ? Promise.resolve({ ...item, ...update })
        : Promise.reject(new Error("Item not found"));
    },
    deleteResource: (id: string) => {
      return Promise.resolve();
    },
    getIdFromResource: (resource: Item) => resource.id,
    idProp: "id"
  });
});

test("#list on newly constructed collection returns initial", t => {
  t.true(t.context.col.list().isInitial());
});

test("#list on refreshed collection is not identical", async t => {
  const refreshed = await t.context.col.refresh();
  t.not(t.context.col.list(), t.context.col.list());
});

test("#list on refreshed collection returns collection", async t => {
  const refreshed = await t.context.col.refresh();
  refreshed
    .list()
    .toOption()
    .foldL<FailAssertion | void>(
      () => t.fail,
      value => {
        t.deepEqual(value, items);
      }
    );
});

test("#view on refreshed collection returns collection in order requested", async t => {
  const refreshed = await t.context.col.refresh();
  refreshed
    .view(["b", "a"])
    .toOption()
    .foldL<FailAssertion | void>(
      () => t.fail,
      value => {
        t.deepEqual(value, [{ id: "b", foo: "baz" }, { id: "a", foo: "bar" }]);
      }
    );
});

test("#view with invalid ids returns list with invalid ids missing", async t => {
  const refreshed = await t.context.col.refresh();
  refreshed
    .view(["b", "z"])
    .toOption()
    .foldL<FailAssertion | void>(
      () => t.fail,
      value => {
        t.deepEqual(value, [{ id: "b", foo: "baz" }]);
      }
    );
});

test("#get on refreshed collection returns RemoteSuccess for valid id", async t => {
  const refreshed = await t.context.col.refresh();
  refreshed
    .get("a")
    .toOption()
    .foldL<FailAssertion | void>(
      () => t.fail,
      value => {
        t.deepEqual(value, items[0]);
      }
    );
});

test("#get on refreshed collection returns RemoteFailure for invalid id", async t => {
  const refreshed = await t.context.col.refresh();
  t.true(refreshed.get("z").isFailure());
});
