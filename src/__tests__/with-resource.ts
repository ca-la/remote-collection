import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #withResource', t => {
  const col = new RemoteCollection<Item>('id').withResource(items[0]);

  t.deepEqual(col.find('a'), RD.success<string[], Item>(items[0]), 'adds the resource');
  t.deepEqual(col.view(), RD.initial, 'does not add to the view');
});

test('with items loaded, #withResource on an existing ID', t => {
  const update: Item = { id: 'a', foo: 'quux' };
  const col = new RemoteCollection<Item>('id').withList(items).withResource(update);

  t.deepEqual(col.find('a'), RD.success<string[], Item>(update), 'updates at the correct key');
  t.deepEqual(
    col.view(),
    RD.success<string[], Item[]>([update, items[1]]),
    'returns the updated key in the view'
  );
});

test('with items loaded, #withResource on an unknown ID', t => {
  const newResource: Item = { id: 'z', foo: 'zed' };
  const col = new RemoteCollection<Item>('id').withList(items).withResource(newResource);

  t.deepEqual(col.find('z'), RD.success<string[], Item>(newResource), 'adds the new resource');
  t.deepEqual(
    col.view(),
    RD.success<string[], Item[]>(items),
    'does not add the new resource to any views'
  );
});

test('with item loading failure, #withResource', t => {
  const col = new RemoteCollection<Item>('id')
    .withResourceFailure('a', 'Failed')
    .withResource(items[0]);

  t.deepEqual(col.find('a'), RD.success<string[], Item>(items[0]), 'adds the resource');
});
