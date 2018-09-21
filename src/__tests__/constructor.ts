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

test("constructor returns a truthy value", async t => {
  t.truthy(t.context.col);
  t.deepEqual(t.context.col.list().getOrElse([]), []);
});
