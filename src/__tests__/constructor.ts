import test from 'ava';
import { initial } from '@cala/remote-data';
import Collection from '../index';
import { Item } from './fixtures';

test('with no initial data', t => {
  const col = new Collection<Item>();
  t.truthy(col);
  t.deepEqual(col.knownIds, initial);
  t.deepEqual(col.entities, {});
});

test('with initial data', t => {
  const existing = new Collection<Item>();
  const col = new Collection<Item>(existing);

  t.not(existing, col);
  t.is(col.knownIds, existing.knownIds);
  t.is(col.entities, existing.entities);
});
