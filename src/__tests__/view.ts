import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #view', t => {
  const col = new RemoteCollection<Item>('id');

  t.deepEqual(col.view(), RD.initial, 'returns initial');
  t.deepEqual(col.view('someViewKey'), RD.initial, 'returns initial');
});

test('with item loading errors, #view with no passed IDs', t => {
  const col = new RemoteCollection<Item>('id').withListFailure(
    'There was a problem loading the list'
  );

  t.deepEqual(
    col.view(),
    RD.failure(['There was a problem loading the list']),
    'returns the item loading error'
  );
  t.deepEqual(
    col.view('someViewKey'),
    RD.initial,
    'returns initial for missing keys'
  );
});

test('with items loaded, #view', t => {
  const col = new RemoteCollection<Item>('id')
    .withList(items)
    .withList(items, 'someViewKey');

  t.deepEqual(col.view(), RD.success(items), 'returns items');
  t.deepEqual(col.view('someViewKey'), RD.success(items), 'returns items');
  t.deepEqual(
    col.view('someOtherViewKey'),
    RD.initial,
    'returns initial for view keys not set'
  );
});
