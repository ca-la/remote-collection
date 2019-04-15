import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

const uppercaseFoo = (a: Item): Item => ({ ...a, foo: a.foo.toUpperCase() });

test('with no items in the view, #map', t => {
  const collection = new RemoteCollection<Item>('id').map(uppercaseFoo);

  t.deepEqual(collection.view(), RD.initial, 'is a no-op');
});

test('with view in the success state, #map', t => {
  const collection = new RemoteCollection<Item>('id').withList(items).map(uppercaseFoo);

  t.deepEqual(
    collection.view(),
    RD.success<string[], Item[]>([{ id: 'a', foo: 'BAR' }, { id: 'b', foo: 'BAZ' }]),
    'applies the function to the resources at the key'
  );
});

test('with view in the pending state, #map', t => {
  const collection = new RemoteCollection<Item>('id').refresh().map(uppercaseFoo);

  t.deepEqual(collection.view(), RD.pending, 'is a no-op');
});

test('with view in the failure state, #map', t => {
  const collection = new RemoteCollection<Item>('id').withListFailure('Oh no').map(uppercaseFoo);

  t.deepEqual(collection.view(), RD.failure<string[], Item[]>(['Oh no']), 'is a no-op');
});

test('with view in the refreshing state, #map', t => {
  const collection = new RemoteCollection<Item>('id')
    .withList(items)
    .refresh()
    .map(uppercaseFoo);

  t.deepEqual(
    collection.view(),
    RD.refresh<string[], Item[]>([{ id: 'a', foo: 'BAR' }, { id: 'b', foo: 'BAZ' }]),
    'applies the function to the resources at the key'
  );
});

test('with resources not in the view being mapped, #map', t => {
  const collection = new RemoteCollection<Item>('id')
    .withList(items, 'someViewKey')
    .map(uppercaseFoo, 'someOtherViewKey');

  t.deepEqual(
    collection.view('someViewKey'),
    RD.success<string[], Item[]>(items),
    'applies the function to the resources at the key'
  );
});

test('with overlapping resources in separate views, #map', t => {
  const overlappingItems = [{ id: 'a', foo: 'rab' }, { id: 'c', foo: 'rba' }];
  const collection = new RemoteCollection<Item>('id')
    .withList(items, 'someViewKey')
    .withList(overlappingItems, 'someOtherViewKey')
    .map(uppercaseFoo, 'someOtherViewKey');

  t.deepEqual(
    collection.view('someViewKey'),
    RD.success<string[], Item[]>([{ id: 'a', foo: 'RAB' }, { id: 'b', foo: 'baz' }]),
    'applies the function to the resources at the key updating the overlap'
  );

  t.deepEqual(
    collection.view('someOtherViewKey'),
    RD.success<string[], Item[]>([{ id: 'a', foo: 'RAB' }, { id: 'c', foo: 'RBA' }]),
    'applies the function to the resources at the key'
  );
});
