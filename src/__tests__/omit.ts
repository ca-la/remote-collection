import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #omit', t => {
  const col = new RemoteCollection<Item>('id').omit('a');

  t.deepEqual(col.view(), RD.initial, 'view is set to initial');
});

test('with some items loaded, #omit', t => {
  const col = new RemoteCollection<Item>('id').withList(items).omit('a');

  t.deepEqual(
    col.view(),
    RD.success([items[1]]),
    'omits by ID in the correct view'
  );
});

test('with view failure, #omit', t => {
  const col = new RemoteCollection<Item>('id')
    .withListFailure('Oh no')
    .omit('a');

  t.deepEqual(col.view(), RD.failure(['Oh no']), 'view returns the failure');
});

test('with no items loaded at the view key, #omit', t => {
  const col = new RemoteCollection<Item>('id')
    .withList(items, 'someOtherViewKey')
    .omit('a', 'someViewKey');

  t.deepEqual(col.view('someViewKey'), RD.initial, 'view is set to initial');
  t.deepEqual(col.view('someOtherViewKey'), RD.success(items));
});

test('with some items loaded at two view keys, #omit', t => {
  const col = new RemoteCollection<Item>('id')
    .withList(items, 'someViewKey')
    .withList(items, 'someOtherViewKey')
    .omit('a', 'someViewKey');

  t.deepEqual(
    col.view('someViewKey'),
    RD.success([items[1]]),
    'omits by ID in the correct view'
  );
  t.deepEqual(col.view('someOtherViewKey'), RD.success(items));
});

test('with view failure at two view keys, #omit', t => {
  const col = new RemoteCollection<Item>('id')
    .withListFailure('Oh no', 'someViewKey')
    .withList(items, 'someOtherViewKey')
    .omit('a', 'someViewKey');

  t.deepEqual(
    col.view('someViewKey'),
    RD.failure(['Oh no']),
    'view is set to initial'
  );
  t.deepEqual(
    col.view('someOtherViewKey'),
    RD.success<string[], Item[]>(items)
  );
});
