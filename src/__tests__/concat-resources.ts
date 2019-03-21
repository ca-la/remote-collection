import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

const moreItems = [{ id: 'c', foo: 'test' }, { id: 'd', foo: 'test' }];

test('with no items loaded, #withList', t => {
  const col = new RemoteCollection<Item>().withList('id', items).concatResources('id', moreItems);
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b', 'c', 'd']),
    'sets knownIds to returned ids'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>(items[0]),
      b: RD.success<string[], Item>(items[1]),
      c: RD.success<string[], Item>(moreItems[0]),
      d: RD.success<string[], Item>(moreItems[1])
    },
    'sets entities to { [id: string]: RemoteSuccess(Item) }'
  );
});

test('with item loading failure, #withList', t => {
  const col = new RemoteCollection<Item>().withListFailure('Failed').concatResources('id', items);
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
