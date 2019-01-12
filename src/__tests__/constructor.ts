import test from 'ava';
import { initial, success } from '@cala/remote-data';
import Collection from '../index';
import { Item, items } from './fixtures';

test('with no initial data', t => {
  const col = new Collection<Item>();
  t.truthy(col);
  t.deepEqual(col.knownIds, initial);
  t.deepEqual(col.idMap.value, {});
  t.deepEqual(col.entities, {});
});

test('with initial data', t => {
  const existing = new Collection<Item>().withList('id', items);
  const col = new Collection<Item>(existing);

  t.not(existing, col);
  t.deepEqual(col.knownIds, success(['a', 'b']));
  t.deepEqual(col.idMap.value, {});
  t.deepEqual(col.entities, {
    a: success<string[], Item>({ id: 'a', foo: 'bar' }),
    b: success<string[], Item>({ id: 'b', foo: 'baz' })
  });
});

test('with initial data with parent mapping', t => {
  // TODO where to put the parent id?
  const existing = new Collection<Item>().withListAt('parentId', 'id', items);
  const col = new Collection<Item>(existing);

  t.not(existing, col);
  t.deepEqual(col.knownIds, success(['a', 'b']));
  t.deepEqual(col.idMap.value, { parentId: success<string[], string[]>(['a', 'b']) });
  t.deepEqual(col.entities, {
    a: success<string[], Item>({ id: 'a', foo: 'bar' }),
    b: success<string[], Item>({ id: 'b', foo: 'baz' })
  });
});
