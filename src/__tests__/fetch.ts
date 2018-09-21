import anyTest, { FailAssertion, TestInterface } from 'ava';
import * as RD from '@cala/remote-data';
import Collection from '../index';
import { Item, items, TestContext } from './fixtures';

const test = anyTest as TestInterface<TestContext>;

test.beforeEach(t => {
  t.context.col = new Collection<Item>({
    getCollection: () => Promise.resolve(items),
    getResource: (id: string) => {
      const item = items.find(i => i.id === id);
      return item ? Promise.resolve(item) : Promise.reject(new Error('Item not found'));
    },
    updateResource: (id: string, update: Partial<Item>) => {
      const item = items.find(i => i.id === id);
      return item
        ? Promise.resolve({ ...item, ...update })
        : Promise.reject(new Error('Item not found'));
    },
    deleteResource: (id: string) => {
      return Promise.resolve();
    },
    getIdFromResource: (resource: Item) => resource.id,
    idProp: 'id'
  });
});

test('#get after #fetch returns Some(RemoteSuccess) for valid id', async t => {
  const fetched = await t.context.col.fetch('a');
  fetched.get('a').foldL<FailAssertion | void>(
    () => t.fail,
    (value: RD.RemoteData<string[], Item>) => {
      t.deepEqual(value, RD.success(items[0]));
    }
  );
});

test('#get after #fetch returns None for invalid id', async t => {
  const fetched = await t.context.col.fetch('a');
  t.true(fetched.get('z').isNone());
});
