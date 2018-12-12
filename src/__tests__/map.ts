import test from 'ava';
import * as RD from '@cala/remote-data';
import Collection from '../index';
import { Item, items } from './fixtures';

const loudFoo = (item: Item) => ({ id: item.id, foo: item.foo.toUpperCase() });

test('with no items loaded, #map', t => {
  const col = new Collection<Item>().map(loudFoo);
  t.deepEqual(col.knownIds, RD.initial, 'sets knownIds to returned id');
  t.deepEqual(col.entities, {}, 'sets entities to { [id: string]: RemoteSuccess(Item) }');
});

test('with items loaded, #map', t => {
  const col = new Collection<Item>().withList('id', items).map(loudFoo);
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b']),
    'sets knownIds to returned ids'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>({ id: 'a', foo: 'BAR' }),
      b: RD.success<string[], Item>({ id: 'b', foo: 'BAZ' })
    },
    'applies map function to each item'
  );
});

test('with item loading failure, #map', t => {
  const col = new Collection<Item>().withListFailure('Failed').map(loudFoo);
  t.deepEqual(col.knownIds, RD.failure<string[], string[]>(['Failed']), 'sets knownIds to failure');
  t.deepEqual(
    col.entities,
    {},
    'sets entities to { [id: string]: RemoteSuccess(Item) } no changes'
  );
});
