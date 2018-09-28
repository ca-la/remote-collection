import test from 'ava';
import * as RD from '@cala/remote-data';
import { some, none } from 'fp-ts/lib/Option';
import Collection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #find', t => {
  const col = new Collection<Item>();
  t.deepEqual(col.find('a'), none, 'returns None');
});

test('with items loaded, #find with valid ID', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(col.find('a'), some(RD.success(items[0])), 'returns Some(Success(Item))');
});

test('with items loaded, #find with invalid ID', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(col.find('z'), none, 'returns None');
});
