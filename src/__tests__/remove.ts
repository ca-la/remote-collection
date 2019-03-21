import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #remove', t => {
  const col = new RemoteCollection<Item>().remove('a');
  t.deepEqual(col.knownIds, RD.initial, 'does not update knownIds');
  t.deepEqual(col.entities, {}, 'removes entity from entity map');
});

test('with items loaded, #remove on an existing ID', t => {
  const col = new RemoteCollection<Item>().withList('id', items).remove('a');
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['b']),
    'removes id from list of knownIds'
  );
  t.deepEqual(
    col.entities,
    { b: RD.success<string[], Item>(items[1]) },
    'removes entity from entity map'
  );
});

test('with items loaded, #remove on an unknown ID', t => {
  const col = new RemoteCollection<Item>().withList('id', items).remove('z');
  const removed = col.remove('z');
  t.not(col, removed, 'returns a copy');
  t.deepEqual(removed.knownIds, RD.success<string[], string[]>(['a', 'b']), 'is a no-op');
  t.deepEqual(
    removed.entities,
    {
      a: RD.success<string[], Item>(items[0]),
      b: RD.success<string[], Item>(items[1])
    },
    'is a no-op'
  );
});

test('with item loading failure, #remove', t => {
  const col = new RemoteCollection<Item>().withListFailure('Failed');
  const removed = col.remove('a');
  t.not(col, removed, 'returns a copy');
  t.deepEqual(col.knownIds, RD.failure(['Failed']), 'is a no-op');
  t.deepEqual(col.entities, {}, 'is a no-op');
});
