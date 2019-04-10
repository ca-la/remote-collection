import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #fetch', t => {
  const col = new RemoteCollection<Item>('id').fetch('a');

  t.deepEqual(col.find('a'), RD.pending, 'sets missing resource to pending');
});

test('with item loading failure, #fetch', t => {
  const col = new RemoteCollection<Item>('id')
    .withResourceFailure('a', 'There was a problem getting the list')
    .fetch('a');

  t.deepEqual(col.find('a'), RD.pending, 'sets failed resource to pending');
});

test('with items loaded, #fetch', t => {
  const col = new RemoteCollection<Item>('id').withList(items).fetch('a');
  t.deepEqual(
    col.find('a'),
    RD.refresh<string[], Item>(items[0]),
    'changes an existing success into a refresh'
  );
});
