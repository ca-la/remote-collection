import test from 'ava';
import * as RD from '@cala/remote-data';
import Collection from '../index';
import { Item, items } from './fixtures';

const moreItems = [{ id: 'c', foo: 'test' }, { id: 'd', foo: 'test' }];

test('#withListAt', t => {
  const col = new Collection<Item>().withListAt('parentId', 'id', items);
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b']),
    'Sets the known IDs property to new IDs'
  );
  t.deepEqual(
    col.idMap.value,
    { parentId: RD.success<string[], string[]>(['a', 'b']) },
    'Sets the key in ID Map to new IDs'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>(items[0]),
      b: RD.success<string[], Item>(items[1])
    },
    'Inserts resources into the entity map'
  );
});

test('#withListAt, twice', t => {
  const col = new Collection<Item>()
    .withListAt('parentId', 'id', items)
    .withListAt('parentId', 'id', moreItems);
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['c', 'd']),
    'Replaces the known IDs property to new IDs'
  );
  t.deepEqual(
    col.idMap.value,
    { parentId: RD.success<string[], string[]>(['c', 'd']) },
    'Replaces the values at the given key in ID Map to new IDs'
  );
  t.deepEqual(
    col.entities,
    {
      c: RD.success<string[], Item>(moreItems[0]),
      d: RD.success<string[], Item>(moreItems[1])
    },
    'Replaces resources into the entity map'
  );
});

test('#withListFailureAt', t => {
  const col = new Collection<Item>().withListFailureAt('parentId', 'Something went wrong!');
  t.deepEqual(
    col.knownIds,
    RD.failure<string[], string[]>(['Something went wrong!']),
    'Saves the failure message to the list'
  );
  t.deepEqual(
    col.idMap.value,
    { parentId: RD.failure<string[], string[]>(['Something went wrong!']) },
    'Saves the failure message at the given key'
  );
  t.deepEqual(col.entities, {}, 'Does not insert any new entities');
});

test('#withResourceAt, with no existing items', t => {
  const col = new Collection<Item>().withResourceAt('parentId', items[0].id, items[0]);
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a']),
    'Appends the known IDs property to new ID'
  );
  t.deepEqual(
    col.idMap.value,
    { parentId: RD.success<string[], string[]>(['a']) },
    'Appends the key in ID Map to new ID'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>(items[0])
    },
    'Inserts resource into the entity map'
  );
});

test('#withResourceAt, with existing items', t => {
  const col = new Collection<Item>()
    .withResourceAt('parentId', items[0].id, items[0])
    .withResourceAt('parentId', items[1].id, items[1]);
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b']),
    'Appends the known IDs property to new ID'
  );
  t.deepEqual(
    col.idMap.value,
    { parentId: RD.success<string[], string[]>(['a', 'b']) },
    'Appends the key in ID Map to new IDs'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>(items[0]),
      b: RD.success<string[], Item>(items[1])
    },
    'Inserts resource into the entity map'
  );
});

test('#withResourceFailureAt, with existing succesful items', t => {
  const col = new Collection<Item>()
    .withResourceAt('parentId', items[0].id, items[0])
    .withResourceFailureAt('parentId', items[1].id, 'Something went wrong!');
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b']),
    'Adds the ID to the known IDs'
  );
  t.deepEqual(
    col.idMap.value,
    { parentId: RD.success<string[], string[]>(['a', 'b']) },
    'Sets the ID list to a failure state at the given key'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>(items[0]),
      b: RD.failure<string[], Item>(['Something went wrong!'])
    },
    'Inserts failed resource into the entity map'
  );
});

test('#removeAt, with no items loaded', t => {
  const col = new Collection<Item>().removeAt('parentId', 'a');
  t.deepEqual(col.knownIds, RD.initial, 'Does not add to list of known IDs');
  t.deepEqual(col.idMap.value, {}, 'Does not add to ID map');
  t.deepEqual(col.entities, {}, 'Does not add to entity map');
});

test('#removeAt, with items loaded', t => {
  const col = new Collection<Item>()
    .withListAt('parentId', 'id', items)
    .removeAt('parentId', 'a')
    .removeAt('parentId', 'notFound');
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b']),
    'Does not remove ID from list of known IDs'
  );
  t.deepEqual(
    col.idMap.value,
    {
      parentId: RD.success<string[], string[]>(['b'])
    },
    'Removes the ID from the given key map'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>(items[0]),
      b: RD.success<string[], Item>(items[1])
    },
    'Does not remove from the entity map'
  );
});

test('#refreshAt, with items loaded', t => {
  const col = new Collection<Item>().withListAt('parentId', 'id', items).refreshAt('parentId');
  t.deepEqual(
    col.idMap.value,
    { parentId: RD.refresh<string[], string[]>(['a', 'b']) },
    'sets ID list at the key to refreshing'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>(items[0]),
      b: RD.success<string[], Item>(items[1])
    },
    'sets entities to { [id: string]: RemoteSuccess(Item) }'
  );
});

test('#refreshAt, with no items loaded', t => {
  const col = new Collection<Item>().refreshAt('parentId');
  t.deepEqual(col.idMap.value, { parentId: RD.pending }, 'sets ID list at the key to pending');
  t.deepEqual(col.entities, {}, 'sets entities to { [id: string]: RemoteSuccess(Item) }');
});

test('#viewAt, with items loaded', t => {
  const col = new Collection<Item>().withListAt('parentId', 'id', items);
  t.deepEqual(
    col.viewAt('parentId'),
    RD.success([items[0], items[1]]),
    'Returns the successful items'
  );
});

test('#viewAt, with no items loaded', t => {
  const col = new Collection<Item>();
  t.deepEqual(col.viewAt('parentId'), RD.initial, 'Returns initial');
});

test('#viewAt, with a some successes and a failure', t => {
  const col = new Collection<Item>()
    .withListAt('parentId', 'id', items)
    .withResourceFailureAt('parentId', 'c', 'Something went wrong!');
  t.deepEqual(
    col.viewAt('parentId'),
    RD.failure(['Something went wrong!']),
    'Returns the successful items'
  );
});
