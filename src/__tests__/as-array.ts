import test from 'ava';
import Collection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #viewAsArray with no passed IDs', t => {
  const col = new Collection<Item>();
  t.deepEqual(col.viewAsArray(), [], 'returns an empty array');
});

test('with no items loaded, #view with invalid IDs', t => {
  const col = new Collection<Item>();
  t.deepEqual(col.viewAsArray(['x', 'y', 'z']), [], 'returns an empty array');
});

test('with item loading errors, #view with no passed IDs', t => {
  const col = new Collection<Item>().withListFailure('There was a problem loading the list');
  t.deepEqual(col.viewAsArray(), [], 'returns an empty array');
});

test('with item loading errors, #view with IDs', t => {
  const col = new Collection<Item>().withListFailure('There was a problem loading the list');
  t.deepEqual(col.viewAsArray(['a']), [], 'returns an empty array');
});

test('with items loaded, #view with no passed IDs', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(col.viewAsArray(), items, 'returns all known items');
});

test('with items loaded, #view with valid IDs', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(col.viewAsArray(['a', 'b']), items, 'returns subset');
  t.deepEqual(
    col.viewAsArray(['b', 'a']),
    [items[1], items[0]],
    'returns subset in order requested'
  );
  t.deepEqual(col.viewAsArray(['b']), [items[1]], 'returns a single item array');
});

test('with items loaded, #view with invalid IDs', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(col.viewAsArray(['x', 'y']), [], 'returns an empty array');
  t.deepEqual(col.viewAsArray(['z']), [], 'returns an empty array');
});
