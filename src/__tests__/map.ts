import test from 'ava';
import * as RD from '@cala/remote-data';
import Collection from '../index';
import { Item, items } from './fixtures';

interface FooCount {
  id: string;
  count: number;
}

const countFoo = (a: Item): FooCount => ({
  id: a.id,
  count: a.foo.length
});

test('with no items loaded, #map', t => {
  const col = new Collection<Item>().map(countFoo);
  t.deepEqual(col.knownIds, RD.initial);
  t.deepEqual(col.entities, {});
});

test('with items loaded, #map on an existing ID', t => {
  const col = new Collection<Item>().withList('id', items).map(countFoo);
  t.deepEqual(col.knownIds, RD.success<string[], string[]>(['a', 'b']));
  t.deepEqual(col.entities, {
    a: RD.success<string[], FooCount>({ id: 'a', count: 3 }),
    b: RD.success<string[], FooCount>({ id: 'b', count: 3 })
  });
});

test('with item loading failure, #map', t => {
  const col = new Collection<Item>().withListFailure('Failed').map(countFoo);
  t.deepEqual(col.knownIds, RD.failure<string[], string[]>(['Failed']));
  t.deepEqual(col.entities, {});
});
