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

test("#get after #fetch returns RemoteSuccess for valid id", async t => {
  const fetched = await t.context.col.fetch("a");
  fetched
    .get("a")
    .toOption()
    .foldL<FailAssertion | void>(
      () => t.fail,
      value => {
        t.deepEqual(value, items[0]);
      }
    );
});

test("#get after #fetch returns RemoteFailure for invalid id", async t => {
  const fetched = await t.context.col.fetch("a");
  t.true(fetched.get("z").isFailure());
});
