import test from 'ava';
import * as RD from '@cala/remote-data';
import Collection from '../index';
import { Item, items } from './fixtures';

const moreItems = [{ id: 'c', foo: 'test' }, { id: 'd', foo: 'test' }];

test('with non-overlapping two collections', t => {
  const other = new Collection<Item>().withList('id', moreItems);
  const col = new Collection<Item>().withList('id', items).concat('id', other);
  t.deepEqual(
    col.knownIds,
    RD.success<string[], string[]>(['a', 'b', 'c', 'd']),
    'appends the additional ids'
  );
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>(items[0]),
      b: RD.success<string[], Item>(items[1]),
      c: RD.success<string[], Item>(moreItems[0]),
      d: RD.success<string[], Item>(moreItems[1])
    },
    'appends the additional items'
  );
});

test('with the same collection twice', t => {
  const other = new Collection<Item>().withList('id', items);
  const col = new Collection<Item>().withList('id', items).concat('id', other);
  t.deepEqual(col.knownIds, RD.success<string[], string[]>(['a', 'b']), 'does not update ids');
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>(items[0]),
      b: RD.success<string[], Item>(items[1])
    },
    'does not update entities'
  );
});

test('with an empty collection', t => {
  const other = new Collection<Item>();
  const col = new Collection<Item>().withList('id', items).concat('id', other);
  t.deepEqual(col.knownIds, RD.success<string[], string[]>(['a', 'b']), 'does not update ids');
  t.deepEqual(
    col.entities,
    {
      a: RD.success<string[], Item>(items[0]),
      b: RD.success<string[], Item>(items[1])
    },
    'does not update entities'
  );
});