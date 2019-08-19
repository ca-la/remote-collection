import test from 'ava';
import { Item, items } from './fixtures';
import Collection, { fromJSON } from '..';

test('de/serialize with RemoteSuccess ', t => {
  const col = new Collection<Item>().withList('id', items);
  t.deepEqual(col, JSON.parse(JSON.stringify(col), fromJSON), 'serializes and deserializes');
});

test('de/serialize with RemoteSuccess', t => {
  const col = new Collection<Item>().withList('id', items).withList('id', items);
  t.deepEqual(col, JSON.parse(JSON.stringify(col), fromJSON), 'serializes and deserializes');
});

test('de/serialize with RemoteFailure to RemoteSuccess', t => {
  const col = new Collection<Item>().withListFailure('Failed').withList('id', items);
  t.deepEqual(col, JSON.parse(JSON.stringify(col), fromJSON), 'serializes and deserializes');
});

test('de/serialize with RemoteInitial', t => {
  const col = new Collection<Item>();
  t.deepEqual(col, JSON.parse(JSON.stringify(col), fromJSON), 'serializes and deserializes');
});

test('de/serialize with RemotePending', t => {
  const col = new Collection<Item>().refresh();
  t.deepEqual(col, JSON.parse(JSON.stringify(col), fromJSON), 'serializes and deserializes');
});

test('de/serialize with RemoteSuccess to Refresh', t => {
  const col = new Collection<Item>().withList('id', items).refresh();
  t.deepEqual(col, JSON.parse(JSON.stringify(col), fromJSON), 'serializes and deserializes');
});

test('de/serialize with RemoteFailure', t => {
  const col = new Collection<Item>().withListFailure('Failed');
  t.deepEqual(col, JSON.parse(JSON.stringify(col), fromJSON), 'serializes and deserializes');
});
