import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item } from './fixtures';

test('with no initial data', t => {
  const col = new RemoteCollection<Item>('id');
  t.deepEqual(col.view(), RD.initial, 'sets up an empty collection');
});
