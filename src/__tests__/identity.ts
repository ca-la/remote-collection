import test from 'ava';
import * as RD from '@cala/remote-data';
import Collection from '../index';
import { Item } from './fixtures';

test('internal data is not linked', t => {
  const col = new Collection<Item>();
  const copy = new Collection<Item>(col);

  col.entities['z'] = RD.success({ id: 'z', foo: 'zed' });
  t.deepEqual(copy.find('z'), RD.initial);
});
