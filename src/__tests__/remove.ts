import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #remove', t => {
  const col = new RemoteCollection<Item>('id').remove('a');
  t.deepEqual(col.find('a'), RD.initial, 'finds return initial still');
});

test('with items loaded, #remove on an existing ID', t => {
  const col = new RemoteCollection<Item>('id').withList(items).remove('a');
  t.deepEqual(col.find('a'), RD.initial, 'removes the resource at the given ID');
  t.deepEqual(
    col.find('b'),
    RD.success<string[], Item>(items[1]),
    'does not remove any other resources'
  );
});

test('with items loaded, #remove on an unknown ID', t => {
  const col = new RemoteCollection<Item>('id').withList(items);
  const removed = col.remove('z');

  t.not(col.remove('z'), removed, 'returns a copy');
  t.deepEqual(removed.view(), col.view(), 'does not update the view');
});

test('with item loading failure, #remove', t => {
  const col = new RemoteCollection<Item>('id').withListFailure('Failed');
  const removed = col.remove('a');

  t.not(col.remove('a'), removed, 'returns a copy');
  t.deepEqual(col.view(), removed.view(), 'does not update the view');
});
