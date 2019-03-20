import test from 'ava';
import Collection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #findAsNullable', t => {
  const col = new Collection<Item>();
  t.deepEqual(col.findAsNullable('a'), null, 'returns null');
});

test('with items loaded, #findAsNullable with valid ID', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(col.findAsNullable('a'), items[0], 'returns item');
});

test('with items loaded, #findAsNullable with invalid ID', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(col.findAsNullable('z'), null, 'returns null');
});
