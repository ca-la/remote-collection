import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

const moreItems = [{ id: 'c', foo: 'test' }, { id: 'd', foo: 'test' }];

test('with both collections empty, #concat', t => {
  const col1 = new RemoteCollection<Item>('id');
  const col2 = new RemoteCollection<Item>('id');

  t.deepEqual(col1.concat(col2), col1, 'both collections remain empty');
  t.deepEqual(col2.concat(col1), col1, 'both collections remain empty');
  t.not(col1.concat(col2), col1, 'returns a copy');
  t.not(col2.concat(col1), col2, 'returns a copy');
});

test('with one empty collection, #concat', t => {
  const col1 = new RemoteCollection<Item>('id').withList(items);
  const col2 = new RemoteCollection<Item>('id');

  t.deepEqual(
    col1.concat(col2).view(),
    RD.success<string[], Item[]>(items),
    'adds items to the end of the view'
  );
  t.deepEqual(
    col2.concat(col1).view(),
    RD.success<string[], Item[]>(items),
    'adds items to the end of the view'
  );
});

test('with non-empty, non-overlapping collections, #concat', t => {
  const col1 = new RemoteCollection<Item>('id').withList(items);
  const col2 = new RemoteCollection<Item>('id').withList(moreItems);

  t.deepEqual(
    col1.concat(col2).view(),
    RD.success<string[], Item[]>(items.concat(moreItems)),
    'adds items to the end of the view'
  );
  t.deepEqual(
    col2.concat(col1).view(),
    RD.success<string[], Item[]>(moreItems.concat(items)),
    'adds items to the end of the view'
  );
});

test('with non-empty, overlapping collections, #concat', t => {
  const overlappingItems = [{ id: 'a', foo: 'BAR' }, { id: 'c', foo: 'RAB' }];
  const col1 = new RemoteCollection<Item>('id').withList(items);
  const col2 = new RemoteCollection<Item>('id').withList(overlappingItems);

  t.deepEqual(
    col1.concat(col2).view(),
    RD.success<string[], Item[]>([
      { id: 'a', foo: 'BAR' },
      { id: 'b', foo: 'baz' },
      { id: 'a', foo: 'BAR' },
      { id: 'c', foo: 'RAB' }
    ]),
    'appends items to the view and updates overlapping items'
  );
  t.deepEqual(
    col2.concat(col1).view(),
    RD.success<string[], Item[]>([
      { id: 'a', foo: 'bar' },
      { id: 'c', foo: 'RAB' },
      { id: 'a', foo: 'bar' },
      { id: 'b', foo: 'baz' }
    ]),
    'appends items to the view and updates overlapping items'
  );
  t.deepEqual(
    col1.concat(col1).view(),
    RD.success<string[], Item[]>(items.concat(items)),
    'appends items to the view'
  );
});

test('with non-empty, overlapping collections at different view keys, #concat', t => {
  const overlappingItems = [{ id: 'a', foo: 'BAR' }, { id: 'c', foo: 'RAB' }];
  const col1 = new RemoteCollection<Item>('id').withList(items, 'someViewKey');
  const col2 = new RemoteCollection<Item>('id').withList(overlappingItems, 'someOtherViewKey');

  t.deepEqual(
    col1.concat(col2).view('someViewKey'),
    RD.success<string[], Item[]>([{ id: 'a', foo: 'BAR' }, { id: 'b', foo: 'baz' }]),
    'updates instance resources at the overlapping item'
  );
  t.deepEqual(
    col1.concat(col2).view('someOtherViewKey'),
    RD.success<string[], Item[]>([{ id: 'a', foo: 'BAR' }, { id: 'c', foo: 'RAB' }]),
    'adds the view at the specified key'
  );
  t.deepEqual(
    col2.concat(col1).view('someViewKey'),
    RD.success<string[], Item[]>([{ id: 'a', foo: 'bar' }, { id: 'b', foo: 'baz' }]),
    'adds the view at the specified key'
  );
  t.deepEqual(
    col2.concat(col1).view('someOtherViewKey'),
    RD.success<string[], Item[]>([{ id: 'a', foo: 'bar' }, { id: 'c', foo: 'RAB' }]),
    'updates instance resources at the overlapping item'
  );
});
