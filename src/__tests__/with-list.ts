import test from 'ava';
import * as RD from '@cala/remote-data';
import Collection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #withList', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b']),
    'sets knownIds to returned ids'
  );
  t.deepEqual(
    col.entities,
    { a: RD.success<string[], Item>(items[0]), b: RD.success<string[], Item>(items[1]) },
    'sets entities to { [id: string]: RemoteSuccess(Item) }'
  );
});

test('with items loaded, #withList', t => {
  const col = new Collection<Item>().withList('id', items).withList('id', items);
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b']),
    'sets knownIds to returned ids'
  );
  t.deepEqual(
    col.entities,
    { a: RD.success<string[], Item>(items[0]), b: RD.success<string[], Item>(items[1]) },
    'sets entities to { [id: string]: RemoteSuccess(Item) }'
  );
});

test('with item loading failure, #withList', t => {
  const col = new Collection<Item>().withListFailure('Failed').withList('id', items);
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b']),
    'sets knownIds to returned ids'
  );
  t.deepEqual(
    col.entities,
    { a: RD.success<string[], Item>(items[0]), b: RD.success<string[], Item>(items[1]) },
    'sets entities to { [id: string]: RemoteSuccess(Item) }'
  );
});
