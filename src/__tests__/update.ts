import anyTest, { TestInterface } from 'ava';
import Collection from '../index';
import { Item, items, TestContext } from './fixtures';

interface UpdateContext {
  updatePromise: {
    updated: Partial<Item> | undefined;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  };
}

const test = anyTest as TestInterface<TestContext & UpdateContext>;

test.beforeEach(async t => {
  t.context.col = await new Collection<Item>({
    getCollection: () => Promise.resolve(items),
    getResource: (id: string) => {
      const item = items.find(i => i.id === id);
      return item ? Promise.resolve(item) : Promise.reject(new Error('Item not found'));
    },
    updateResource: (id: string, update: Partial<Item>) => {
      const item = items.find(i => i.id === id);
      return new Promise((resolve, reject) => {
        t.context.updatePromise = {
          updated: { ...item, ...update },
          resolve,
          reject
        };
      });
    },
    deleteResource: (id: string) => {
      return Promise.resolve();
    },
    getIdFromResource: (resource: Item) => resource.id,
    idProp: 'id'
  }).refresh();
});

test('update valid id sets item to refresh', async t => {
  t.plan(4);

  const update = { id: 'a', foo: 'quux' };
  t.true(t.context.col.get('a').isSuccess());

  t.context.col.update('a', update).then(updatedCollection => {
    t.true(updatedCollection.get('a').isSuccess());
    updatedCollection
      .get('a')
      .toOption()
      .foldL(t.fail, (value: Item) => t.deepEqual(value, update));
  });

  t.true(t.context.col.get('a').isRefresh());

  const { updated, resolve } = t.context.updatePromise;

  await resolve(updated);
});

test('update invalid id rejects update promise', async t => {
  t.plan(1);

  const update = { id: 'z', foo: 'quux' };

  try {
    await t.context.col.update('z', update);
  } catch (err) {
    t.deepEqual(err, new Error('Item not found with ID: z'));
  }
});

test('failed update to valid id rejects update promise', async t => {
  t.plan(2);

  const update = { id: 'a', foo: 'quux' };
  const updateError = new Error('There was a problem updating');

  t.context.col.update('a', update).catch((err: Error) => {
    t.deepEqual(err, updateError);
  });

  t.true(t.context.col.get('a').isRefresh());

  await t.context.updatePromise.reject(updateError);
});
