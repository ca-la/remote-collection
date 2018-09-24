import test from 'ava';
import * as RD from '@cala/remote-data';
import Collection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #refresh', t => {
  const col = new Collection<Item>();
  t.deepEqual(col.knownIds, RD.initial);
  const refreshed = col.refresh();
  t.deepEqual(refreshed.knownIds, RD.pending, 'transitions knownIds to pending');
});

test('with item loading failure, #refresh', t => {
  const col = new Collection<Item>().withListFailure('There was a problem getting the list');
  t.deepEqual(
    col.knownIds,
    RD.failure(['There was a problem getting the list']),
    'transitions knownIds to pending'
  );
});

test('with items loaded, #refresh', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(col.knownIds, RD.success(['a', 'b']));
  const refreshed = col.refresh();
  t.deepEqual(refreshed.knownIds, RD.refresh(['a', 'b']), 'transitions knownIds to refresh');
});
