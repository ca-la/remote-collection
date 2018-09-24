import test from 'ava';
import * as RD from '@cala/remote-data';
import Collection from '../index';
import { Item, items } from './fixtures';

test('with no items loaded, #withListFailure', t => {
  const col = new Collection<Item>().withListFailure('Failed');
  t.deepEqual(col.knownIds, RD.failure(['Failed']), 'sets knownIds to failure');
  t.deepEqual(col.entities, {}, 'does not update entities');
});

test('with items loaded, #withList', t => {
  const col = new Collection<Item>().withListFailure('Failed');
  t.deepEqual(col.knownIds, RD.failure(['Failed']), 'sets knownIds to failure');
  t.deepEqual(col.entities, {}, 'does not update entities');
});

test('with item loading failure, #withList', t => {
  const col = new Collection<Item>().withList('id', items).withListFailure('Failed');
  t.deepEqual(col.knownIds, RD.failure(['Failed']), 'sets knownIds to failure');
  t.deepEqual(col.entities, {}, 'does not update entities');
});