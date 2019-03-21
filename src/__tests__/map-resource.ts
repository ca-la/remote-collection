import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

const identityMap = (a: any): any => a;

test('with no items loaded, #mapResource', t => {
  const col = new RemoteCollection<Item>().mapResource('a', identityMap);
  t.deepEqual(col.knownIds, RD.initial, 'sets knownIds to returned id');
  t.deepEqual(col.entities, {}, 'sets entities to { [id: string]: RemoteSuccess(Item) }');
});

test('with items loaded, #mapResource on an existing ID', t => {
  const col = new RemoteCollection<Item>().withList('id', items).mapResource('a', identityMap);
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b']),
    'sets knownIds to returned ids'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>(items[0]),
      b: RD.success<string[], Item>(items[1])
    },
    'sets entities to { [id: string]: RemoteSuccess(Item) }'
  );
});

test('with items loaded, #mapResource on an unknown ID', t => {
  const col = new RemoteCollection<Item>().withList('id', items).mapResource('z', identityMap);
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b']),
    'sets knownIds to returned ids'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>(items[0]),
      b: RD.success<string[], Item>(items[1])
    },
    'sets entities to { [id: string]: RemoteSuccess(Item) } with no changes'
  );
});

test('with item loading failure, #mapResource', t => {
  const col = new RemoteCollection<Item>().withListFailure('Failed').mapResource('a', identityMap);
  t.deepEqual(col.knownIds, RD.failure<string[], string[]>(['Failed']), 'sets knownIds to failure');
  t.deepEqual(
    col.entities,
    {},
    'sets entities to { [id: string]: RemoteSuccess(Item) } no changes'
  );
});
