import anyTest, { FailAssertion, TestInterface } from 'ava';
import Collection from '../index';
import { Item, items, TestContext } from './fixtures';

interface DeleteContext {
  deletePromise: {
    resolve: () => void;
    reject: (error: any) => void;
  };
}

const test = anyTest as TestInterface<TestContext & DeleteContext>;

test.beforeEach(async t => {
  t.context.col = await new Collection<Item>({
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
      return new Promise((resolve, reject) => {
        t.context.deletePromise = {
          resolve,
          reject
        };
      });
    },
    getIdFromResource: (resource: Item) => resource.id,
    idProp: 'id'
  }).refresh();
});

test('delete valid id sets item to refresh', async t => {
  t.plan(3);

  const { col: collection } = t.context;

  t.true(collection.get('a').isSuccess());

  collection.delete('a').then(() => {
    t.true(collection.get('a').isFailure());
  });

  t.true(collection.get('a').isRefresh());

  await t.context.deletePromise.resolve();
});

test('delete invalid id rejects delete promise', async t => {
  t.plan(1);

  const { col: collection } = t.context;

  try {
    await collection.delete('z');
  } catch (err) {
    t.deepEqual(err, new Error('Item not found with ID: z'));
  }
});

test('failed delete to valid id rejects delete promise', async t => {
  t.plan(2);

  const { col: collection } = t.context;
  const deleteError = new Error('There was a problem deleting');

  collection.delete('a').catch((err: Error) => {
    t.deepEqual(err, deleteError);
  });

  t.true(collection.get('a').isRefresh());

  await t.context.deletePromise.reject(deleteError);
});
