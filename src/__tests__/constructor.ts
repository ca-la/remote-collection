import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

test('with no initial data', t => {
  const col = new RemoteCollection<Item>('id');
  t.deepEqual(col.view(), RD.initial, 'sets up an empty collection');
});

test('with initial data', t => {
  const existing = new RemoteCollection<Item>('id').withList(items);
  const col = new RemoteCollection<Item>('id', existing);

  t.not(existing, col);
  t.deepEqual(existing.view(), col.view(), 'has the same items');
});

test('with initial data with parent mapping', t => {
  const existing = new RemoteCollection<Item>('id').withList(items, 'someViewKey');
  const col = new RemoteCollection<Item>('id', existing);

  t.not(existing, col);
  t.deepEqual(
    existing.view('someViewKey'),
    col.view('someViewKey'),
    'has the same items at the view key'
  );
});
