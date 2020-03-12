import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

const moreItems = [{ id: 'c', foo: 'test' }, { id: 'd', foo: 'test' }];

test('with both collections empty, #union', t => {
  const col1 = new RemoteCollection<Item>('id');
  const col2 = new RemoteCollection<Item>('id');

  t.deepEqual(col1.union(col2), col1, 'both collections remain empty');
  t.deepEqual(col2.union(col1), col1, 'both collections remain empty');
  t.not(col1.union(col2), col1, 'returns a copy');
  t.not(col2.union(col1), col2, 'returns a copy');
});

test('with one empty collection, #union', t => {
  const col1 = new RemoteCollection<Item>('id').withList(items);
  const col2 = new RemoteCollection<Item>('id');

  t.deepEqual(
    col1.union(col2).view(),
    RD.success<string[], Item[]>(items),
    'adds items to the end of the view'
  );
  t.deepEqual(
    col2.union(col1).view(),
    RD.success<string[], Item[]>(items),
    'adds items to the end of the view'
  );
});

test('with non-empty, non-overlapping collections, #union', t => {
  const col1 = new RemoteCollection<Item>('id').withList(items);
  const col2 = new RemoteCollection<Item>('id').withList(moreItems);

  t.deepEqual(
    col1.union(col2).view(),
    RD.success<string[], Item[]>(items.concat(moreItems)),
    'adds items to the end of the view'
  );
  t.deepEqual(
    col2.union(col1).view(),
    RD.success<string[], Item[]>(moreItems.concat(items)),
    'adds items to the end of the view'
  );
});

test('with non-empty, overlapping collections, #union', t => {
  const overlappingItems = [{ id: 'a', foo: 'BAR' }, { id: 'c', foo: 'RAB' }];
  const col1 = new RemoteCollection<Item>('id').withList(items);
  const col2 = new RemoteCollection<Item>('id').withList(overlappingItems);

  t.deepEqual(
    col1.union(col2).view(),
    RD.success<string[], Item[]>([
      { id: 'a', foo: 'BAR' },
      { id: 'b', foo: 'baz' },
      { id: 'c', foo: 'RAB' }
    ]),
    'unites items to the view and updates overlapping items'
  );
  t.deepEqual(
    col2.union(col1).view(),
    RD.success<string[], Item[]>([
      { id: 'a', foo: 'bar' },
      { id: 'c', foo: 'RAB' },
      { id: 'b', foo: 'baz' }
    ]),
    'unites items to the view and updates overlapping items'
  );
  t.deepEqual(
    col1.union(col1).view(),
    RD.success<string[], Item[]>(items),
    'unites items to the view'
  );
});

test('with non-empty, overlapping collections at different view keys, #union', t => {
  const overlappingItems = [{ id: 'a', foo: 'BAR' }, { id: 'c', foo: 'RAB' }];
  const col1 = new RemoteCollection<Item>('id').withList(items, 'someViewKey');
  const col2 = new RemoteCollection<Item>('id').withList(
    overlappingItems,
    'someOtherViewKey'
  );

  t.deepEqual(
    col1.union(col2).view('someViewKey'),
    RD.success<string[], Item[]>([
      { id: 'a', foo: 'BAR' },
      { id: 'b', foo: 'baz' }
    ]),
    'updates instance resources at the overlapping item'
  );
  t.deepEqual(
    col1.union(col2).view('someOtherViewKey'),
    RD.success<string[], Item[]>([
      { id: 'a', foo: 'BAR' },
      { id: 'c', foo: 'RAB' }
    ]),
    'adds the view at the specified key'
  );
  t.deepEqual(
    col2.union(col1).view('someViewKey'),
    RD.success<string[], Item[]>([
      { id: 'a', foo: 'bar' },
      { id: 'b', foo: 'baz' }
    ]),
    'adds the view at the specified key'
  );
  t.deepEqual(
    col2.union(col1).view('someOtherViewKey'),
    RD.success<string[], Item[]>([
      { id: 'a', foo: 'bar' },
      { id: 'c', foo: 'RAB' }
    ]),
    'updates instance resources at the overlapping item'
  );
});

test('with a mixture of different states at the same key, #union', t => {
  const initial = new RemoteCollection<Item>('id');
  const pending = new RemoteCollection<Item>('id').refresh('someViewKey');
  const success = new RemoteCollection<Item>('id').withList(
    items,
    'someViewKey'
  );
  const refresh = new RemoteCollection<Item>('id')
    .withList(items, 'someViewKey')
    .refresh('someViewKey');
  const failure = new RemoteCollection<Item>('id').withListFailure(
    'Somebody set up us the bomb',
    'someViewKey'
  );

  t.deepEqual(initial.union(success).view('someViewKey'), RD.success(items));
  t.deepEqual(pending.union(success).view('someViewKey'), RD.success(items));
  t.deepEqual(success.union(pending).view('someViewKey'), RD.pending);
  t.deepEqual(pending.union(refresh).view('someViewKey'), RD.refresh(items));
  t.deepEqual(refresh.union(pending).view('someViewKey'), RD.pending);
  t.deepEqual(
    success.union(failure).view('someViewKey'),
    RD.failure(['Somebody set up us the bomb'])
  );
  t.deepEqual(failure.union(success).view('someViewKey'), RD.success(items));
});
