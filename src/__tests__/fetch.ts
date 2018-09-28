import test from 'ava';
import * as RD from '@cala/remote-data';
import Collection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #fetch', t => {
  const col = new Collection<Item>().fetch('a');
  t.deepEqual(col.entities, { a: RD.pending }, 'transitions id to pending');
});

test('with item loading failure, #fetch', t => {
  const col = new Collection<Item>()
    .withListFailure('There was a problem getting the list')
    .fetch('a');
  t.deepEqual(col.entities, { a: RD.pending }, 'transitions id to pending');
});

test('with items loaded, #fetch', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(col.entities, {
    a: RD.success<string[], Item>(items[0]),
    b: RD.success<string[], Item>(items[1])
  });
  const fetched = col.fetch('a');
  t.deepEqual(fetched.entities, {
    a: RD.refresh<string[], Item>(items[0]),
    b: RD.success<string[], Item>(items[1])
  });
});
