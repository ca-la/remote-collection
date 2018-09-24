import test from 'ava';
import * as RD from '@cala/remote-data';
import Collection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #view with no passed IDs', t => {
  const col = new Collection<Item>();
  t.deepEqual(col.view(), RD.initial, 'returns initial');
});

test('with no items loaded, #view with invalid IDs', t => {
  const col = new Collection<Item>();
  t.deepEqual(col.view(['x', 'y', 'z']), RD.initial, 'returns initial');
});

test('with item loading errors, #view with no passed IDs', t => {
  const col = new Collection<Item>().withListFailure('There was a problem loading the list');
  t.deepEqual(
    col.view(),
    RD.failure(['There was a problem loading the list']),
    'returns the item loading error'
  );
});

test('with item loading errors, #view with IDs', t => {
  const col = new Collection<Item>().withListFailure('There was a problem loading the list');
  t.deepEqual(
    col.view(['a']),
    RD.failure(['There was a problem loading the list']),
    'returns the item loading error'
  );
});

test('with items loaded, #view with no passed IDs', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(col.view(), RD.success(items), 'returns all known items');
});

test('with items loaded, #view with valid IDs', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(col.view(['a', 'b']), RD.success(items), 'returns subset');
  t.deepEqual(
    col.view(['b', 'a']),
    RD.success([items[1], items[0]]),
    'returns subset in order requested'
  );
  t.deepEqual(col.view(['b']), RD.success([items[1]]), 'returns a single item array');
});

test('with items loaded, #view with invalid IDs', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(col.view(['x', 'y']), RD.success([]), 'returns an empty success');
  t.deepEqual(col.view(['z']), RD.success([]), 'returns an empty success');
});
