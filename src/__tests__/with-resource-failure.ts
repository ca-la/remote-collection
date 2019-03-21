import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #withResourceFailure', t => {
  const col = new RemoteCollection<Item>().withResourceFailure('a', 'Failed');
  t.deepEqual(col.knownIds, RD.success<string[], string[]>(['a']), 'sets knownIds to returned id');
  t.deepEqual(
    col.entities,
    { a: RD.failure<string[], Item>(['Failed']) },
    'sets entities to { [id: string]: RemoteFailure(Item) }'
  );
});

test('with items loaded, #withResourceFailure on an existing ID', t => {
  const col = new RemoteCollection<Item>().withList('id', items).withResourceFailure('a', 'Failed');
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b']),
    'sets knownIds to returned ids'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.failure<string[], Item>(['Failed']),
      b: RD.success<string[], Item>(items[1])
    },
    'sets entities to { [id: string]: RemoteFailure(Item) }'
  );
});

test('with items loaded, #withResourceFailure on an unknown ID', t => {
  const col = new RemoteCollection<Item>().withList('id', items).withResourceFailure('z', 'Failed');
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
      z: RD.failure<string[], Item>(['Failed'])
    },
    'sets entities to { [id: string]: RemoteFailure(Item) }'
  );
});

test('with item loading failure, #withResourceFailure', t => {
  const col = new RemoteCollection<Item>()
    .withListFailure('Failed')
    .withResourceFailure('a', 'Failed');
  t.deepEqual(col.knownIds, RD.success<string[], string[]>(['a']), 'sets knownIds to returned id');
  t.deepEqual(
    col.entities,
    { a: RD.failure<string[], Item>(['Failed']) },
    'sets entities to { [id: string]: RemoteFailure(Item) }'
  );
});
