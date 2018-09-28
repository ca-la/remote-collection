import test from 'ava';
import * as RD from '@cala/remote-data';
import Collection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #withResource', t => {
  const col = new Collection<Item>().withResource('a', items[0]);
  t.deepEqual(col.knownIds, RD.success<string[], string[]>(['a']), 'sets knownIds to returned id');
  t.deepEqual(
    col.entities,
    { a: RD.success<string[], Item>(items[0]) },
    'sets entities to { [id: string]: RemoteSuccess(Item) }'
  );
});

test('with items loaded, #withResource on an existing ID', t => {
  const col = new Collection<Item>()
    .withList('id', items)
    .withResource('a', { id: 'a', foo: 'quux' });
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b']),
    'sets knownIds to returned ids'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>({ id: 'a', foo: 'quux' }),
      b: RD.success<string[], Item>(items[1])
    },
    'sets entities to { [id: string]: RemoteSuccess(Item) }'
  );
});

test('with items loaded, #withResource on an unknown ID', t => {
  const col = new Collection<Item>()
    .withList('id', items)
    .withResource('z', { id: 'z', foo: 'zed' });
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b', 'z']),
    'sets knownIds to returned ids'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>(items[0]),
      b: RD.success<string[], Item>(items[1]),
      z: RD.success<string[], Item>({ id: 'z', foo: 'zed' })
    },
    'sets entities to { [id: string]: RemoteSuccess(Item) }'
  );
});

test('with item loading failure, #withResource', t => {
  const col = new Collection<Item>().withListFailure('Failed').withResource('a', items[0]);
  t.deepEqual(col.knownIds, RD.success<string[], string[]>(['a']), 'sets knownIds to returned id');
  t.deepEqual(
    col.entities,
    { a: RD.success<string[], Item>(items[0]) },
    'sets entities to { [id: string]: RemoteSuccess(Item) }'
  );
});
