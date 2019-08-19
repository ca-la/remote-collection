import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #refresh', t => {
  const col = new RemoteCollection<Item>('id');

  t.deepEqual(col.refresh().view(), RD.pending, 'sets list to pending state');
  t.deepEqual(
    col.refresh('someViewKey').view('someViewKey'),
    RD.pending,
    'sets list to pending state'
  );
  t.deepEqual(
    col.refresh('someViewKey').view('someOtherViewKey'),
    RD.initial,
    'does not affect other view keys'
  );
});

test('with view loading failure, #refresh', t => {
  const col = new RemoteCollection<Item>('id')
    .withListFailure('There was a problem getting the list')
    .refresh();

  t.deepEqual(col.view(), RD.pending, 'Resets the view to pending');
});

test('with items loaded, #refresh', t => {
  const col = new RemoteCollection<Item>('id').withList(items).refresh();

  t.deepEqual(
    col.view(),
    RD.refresh<string[], Item[]>(items),
    'Sets the view to refresh'
  );
});
