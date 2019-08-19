import test from 'ava';
import { Item, items } from './fixtures';
import RemoteCollection, { fromJSON } from '..';

test('de/serialize with RemoteSuccess ', t => {
  const col = new RemoteCollection<Item>('id').withList(items);
  t.deepEqual(
    col,
    JSON.parse(JSON.stringify(col), fromJSON),
    'serializes and deserializes'
  );
});

test('de/serialize with RemoteSuccess', t => {
  const col = new RemoteCollection<Item>('id').withList(items).withList(items);
  t.deepEqual(
    col,
    JSON.parse(JSON.stringify(col), fromJSON),
    'serializes and deserializes'
  );
});

test('de/serialize with RemoteFailure to RemoteSuccess', t => {
  const col = new RemoteCollection<Item>('id')
    .withListFailure('Failed')
    .withList(items);
  t.deepEqual(
    col,
    JSON.parse(JSON.stringify(col), fromJSON),
    'serializes and deserializes'
  );
});

test('de/serialize with RemoteInitial', t => {
  const col = new RemoteCollection<Item>('id');
  t.deepEqual(
    col,
    JSON.parse(JSON.stringify(col), fromJSON),
    'serializes and deserializes'
  );
});

test('de/serialize with RemotePending', t => {
  const col = new RemoteCollection<Item>('id').refresh();
  t.deepEqual(
    col,
    JSON.parse(JSON.stringify(col), fromJSON),
    'serializes and deserializes'
  );
});

test('de/serialize with RemoteSuccess to Refresh', t => {
  const col = new RemoteCollection<Item>('id').withList(items).refresh();
  t.deepEqual(
    col,
    JSON.parse(JSON.stringify(col), fromJSON),
    'serializes and deserializes'
  );
});

test('de/serialize with RemoteFailure', t => {
  const col = new RemoteCollection<Item>('id').withListFailure('Failed');
  t.deepEqual(
    col,
    JSON.parse(JSON.stringify(col), fromJSON),
    'serializes and deserializes'
  );
});
