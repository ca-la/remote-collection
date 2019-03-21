import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #refresh', t => {
  const col = new RemoteCollection<Item>();
  t.deepEqual(col.knownIds, RD.initial);
  const refreshed = col.refresh();
  t.deepEqual(refreshed.knownIds, RD.pending, 'transitions knownIds to pending');
  t.deepEqual(refreshed.entities, {}, 'do not update entities');
});

test('with item loading failure, #refresh', t => {
  const col = new RemoteCollection<Item>().withListFailure('There was a problem getting the list');
  const refreshed = col.refresh();
  t.deepEqual(refreshed.knownIds, RD.pending, 'transitions knownIds to pending');
  t.deepEqual(refreshed.entities, {}, 'do not update entities');
});

test('with items loaded, #refresh', t => {
  const col = new RemoteCollection<Item>().withList('id', items).withResourceFailure('b', 'Failed');
  t.deepEqual(col.knownIds, RD.success(['a', 'b']));
  const refreshed = col.refresh();
  t.deepEqual(refreshed.knownIds, RD.refresh(['a', 'b']), 'transitions knownIds to refresh');
  t.deepEqual(
    refreshed.entities,
    {
      a: RD.refresh<string[], Item>(items[0]),
      b: RD.pending
    },
    'updates entities to refresh or pending based on their current state'
  );
});
