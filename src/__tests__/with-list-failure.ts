import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #withListFailure', t => {
  const col = new RemoteCollection<Item>('id')
    .withListFailure('Fail!')
    .withListFailure('Failed', 'someViewKey')
    .withListFailure('Failure!', 'someOtherViewKey');

  t.deepEqual(
    col.view(),
    RD.failure<string[], Item[]>(['Fail!']),
    'sets the view to failure'
  );
  t.deepEqual(
    col.view('someViewKey'),
    RD.failure<string[], Item[]>(['Failed']),
    'sets the view to failure'
  );
  t.deepEqual(
    col.view('someOtherKey'),
    RD.failure<string[], Item[]>(['Failure!']),
    'sets the view to failure'
  );
});

test('with items loaded, #withList', t => {
  const col = new RemoteCollection<Item>('id')
    .withList(items)
    .withListFailure('Failed');

  t.deepEqual(col.view(), RD.failure<string[], Item[]>(['Failed']));
});
