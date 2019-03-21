import test from 'ava';
import * as RD from '@cala/remote-data';
import RemoteCollection from '../index';
import { Item } from './fixtures';

test('internal data is not linked', t => {
  const col = new RemoteCollection<Item>();
  const copy = new RemoteCollection<Item>(col);

  col.entities['z'] = RD.success({ id: 'z', foo: 'zed' });
  t.deepEqual(copy.find('z'), RD.initial);
});
