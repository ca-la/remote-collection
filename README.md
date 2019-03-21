# Remote-Collection
A TypeScript `RemoteData` Collection class

<hr />

There have been a number of articles written about using Algebraic Data Types to
describe the states that data fetching entails. Replacing all of the
`isFetching` and other ergonomics patterns with a clean pseudo-pattern-matching
pattern is nice, but there is still a lot of room to improve on the ergonomics
of dealing with remote data. `remote-collection` aims to provide a user-friendly
experience to the user while keeping 100% type-safety.

A typical REST API lets you interface with remote `Resource`s through well-known
HTTP patterns. A `User` resource, for instance, might be accessible by making a
`GET https://api.myawesomeapp.com/user/some-id`. You can update parts of that
resource by making a `PUT` or `PATCH` request to that same URL, or creating a
new resource at that URL by making a `POST` request.

A `Collection` is typically some ordered list of a `Resource`. You might have a
`Users` collection, for instance. You can imagine that your API would support
making a request to `POST https://api.myawesomeapp.com/user` with a well-formed
`User` resource, and it would add that `User` resource to the `Users`
collection. `DELETE https://api.myawesomeapp.com/user/some-id` would remove that
`User`, etc.

One challenge with dealing with remote resources is identity of a resource
within a collection. Typically, a resource would have an `id` field, or some
other unique identifier that you use to tie a given resource to a collection.
But, fetching a collection and then deleting one of the resources is a nested
affair: The request to get the collection (`GET /user`), and the request to
delete a resource (`DELETE /user/some-id`) both have states, data, failure cases
to account for, etc.

`remote-collection` is here to help with that!

## RemoteCollection

Creates a new `RemoteCollection` of a generic `Resource` type. If you pass in
another `RemoteCollection<Resource>` to the constructor, it will merge the
resources.

### Signature
```ts
export default class Collection<Resource extends { [key: string]: any }> {
  constructor(fromCollection?: RemoteCollection<Resource>) {
```

## fetch

Sets the resource at the given ID to `RemotePending`, or if it is already a
`RemoteSuccess` or `RemoteRefresh`, sets it to `RemoteRefresh`. Useful when
making the initial call to the server to indicate that we're currently fetching
this resource

### Signature
```ts
fetch(id: string): RemoteCollection<Resource>
```

### Examples
```ts
const users: User[] = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }];
const collection = new RemoteCollection<User>()
  .withList('id', users)
  .fetch('a')
  .fetch('c');
  
assert.deepStrictEqual(
  collection.find('a'),
  RemoteData.refresh({ id: 'a', name: 'Alice' })
);

assert.deepStrictEqual(
  collection.find('c'),
  RemoteData.pending
);
```

## refresh

Like `fetch` but for the whole list.

### Signature
```ts
refresh(): RemoteCollection<Resource>
```

### Examples
```ts
const users: User[] = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }];
const collection = new RemoteCollection<User>();

assert.deepStrictEqual(
  collection.refresh().view(),
  RemoteData.pending
);
  
assert.deepStrictEqual(
  collection.withList('id', users).refresh().view(),
  RemoteData.refresh(users)
);
```

## refreshAt

Like `refresh` but for refreshing the collection at a given key. See
`withListAt` for more details about `At`.

### Signature
```ts
refreshAt(at: string): RemoteCollection<Resource>
```

## withList

This method adds a list of resources to the `RemoteCollection` representing the
normal success-case for fetching the collection.

### Signature
```ts
withList(idProp: keyof Resource, list: Resource[]): RemoteCollection<Resource>
```

## withListAt

Like `withList` but adds the resources to the underlying resource map, but
stores the list of IDs at a specific key so you can retrieve this set of
resources by that key. Useful for sub-resources (Post by User), pagination,
filtered views, etc. Resources themselves are normalized by the `idProp`, so if
two `At` views share some resources in common, they both point to the same
underlying resource.

### Signature
```ts
withListAt(at: string, idProp: keyof Resource, list: Resource[]): RemoteCollection<Resource>
```

## withResource

This method adds a single resource to the `RemoteCollection` representing the
normal success-case for fetching the collection. It appends the item to the end
of the list of known IDs that is retrieved when you call `view`.

### Signature
```ts
withResource(id: string, resource: Resource): RemoteCollection<Resource>
```

## withResourceAt

Like `withResource` but adds the resource to the underlying resource map, but
stores the new ID at a specific key so you can retrieve this set of resources by
that key. Useful for sub-resources (Post by User), pagination, filtered views,
etc. Resources themselves are normalized by the `idProp`, so if two `At` views
share some resources in common, they both point to the same underlying resource.

### Signature
```ts
withResourceAt(at: string, id: string, resource: Resource): RemoteCollection<Resource>
```

## withListFailure

If requesting the list fails, calling this method will store a `RemoteFailure`
with the passed `string`.

### Signature
```ts
withResourceAt(at: string, id: string, resource: Resource): RemoteCollection<Resource>
```

## withListFailureAt

Like `withListFailure` but adds the failure only to the stored list of resources
at the specified key, but doesn't interfer with other keys or the resource map
itself.

### Signature
```ts
withResourceAt(at: string, id: string, resource: Resource): RemoteCollection<Resource>
```

## withResourceFailure

If requesting a single resource fails, calling this method will store a
`RemoteFailure` with the passed `string` in the resource map for just this
resource.

### Signature
```ts
withResourceFailure(id: string, error: string): RemoteCollection<Resource>
```

## withResourceFailureAt

The `At` version differs only in that requesting the view at the specified key
will now see the newly errored resource.

### Signature
```ts
withResourceFailureAt(at: string, id: string, error: string): RemoteCollection<Resource>
```

## find

Lookup a resource by its `idProp`. **NOTE**: If the resource has never been
requested, or has been removed, we return `RemoteInitial` indicating that is has
not been retrieved.

### Signature
```ts
find(id: string): Remote<Resource>
```

### Example
```ts
const collection = new RemoteCollection<User>();

assert.deepStrictEqual(
  collection.find('a'),
  RemoteData.initial
);

assert.deepStrictEqual(
  collection.withResource('id', { id: 'a', name: 'Alice' }).find('a'),
  RemoteData.success({ id: 'a', name: 'Alice' })
);

assert.deepStrictEqual(
  collection.withResourceFailure('b', 'Not authorized').find('b'),
  RemoteData.failure(['Not authorized'])
);
```

## view

Without any arguments will return the list known resources. If `view` is given a
list of `id` strings, it will attempt to lookup the resources by those IDs and
return them in the same order. Missing IDs will be omitted entirely.

### Signature
```ts
public view(ids?: string[]): RemoteData<string[], Resource[]>
```

### Examples

Here is a break down of what to expect:

- If the list was successfully retrieved, and all resources corresponding to the
  IDs in that list are successful (meaning they haven't later been updated to
  other `RemoteData` states), you will receive a `RemoteSuccess` containing a
  list of all of the resources.
  
  ```ts
  const users: User[] = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }];
  const collection = new RemoteCollection<User>().withList('id', users);
  assert.deepStrictEqual(collection.view(), RemoteData.success(users));
  ```
- If there was a failure when retrieving the list, you will receive the
  `RemoteFailure` with the failure string.
  ```ts
  const collection = new RemoteCollection<User>()
    .withListFailure('Not authorized');
  assert.deepStrictEqual(
    collection.view(),
    RemoteData.failure(['Not authorized'])
  );
  ```
- If retrieving the list succeeded, but later some subset of the resources had a failure, you will receive all of the failure strings in the `RemoteFailure`.
  ```ts
  const users: User[] = [
    { id: 'a', name: 'Alice' },
    { id: 'b', name: 'Bob' },
    { id: 'c', name: 'Charlie' }
  ];
  const collection = new RemoteCollection<User>()
    .withList('id', users)
    .withResourceFailure('a', 'Bad request')
    .withResourceFailure('c', 'Conflict');

  assert.deepStrictEqual(
    collection.view(),
    RemoteData.failure(['Bad request', 'Conflict'])
  );
  ```
- If the list, or any resource, is `RemoteInitial` or `RemotePending`, you will
  receive that value, even if some of them are `RemoteFailure`, `RemoteSuccess`,
  or `RemoteRefresh`.
  ```ts
  const users: User[] = [
    { id: 'a', name: 'Alice' },
    { id: 'b', name: 'Bob' },
    { id: 'c', name: 'Charlie' }
  ];
  const collection = new RemoteCollection<User>()
    .withList('id', users)
    .fetch('d');

  assert.deepStrictEqual(
    collection.view(),
    RemoteData.pending
  );
  ```

## viewAt

Like `view` but gets the list that was stored at the given key via `withListAt`,
`withResourceAt`, `withFailureAt`.

### Signature
```ts
public viewAt(at: string): RemoteData<string[], Resource[]>
```

## remove

Removes the resource indicated by the `id`.

### Signature
```ts
remove(id: string): RemoteCollection<Resource>
```

### Examples

```ts
const users: User[] = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }];
const collection = new RemoteCollection<User>()
  .withList('id', users);
  
assert.deepStrictEqual(
  collection.view(),
  RemoteData.success(users)
);

assert.deepStrictEqual(
  collection.remove('a').view(),
  RemoteData.success([users[1]])
);
```

## removeAt

Like `remove` but _only_ removes the resource from the list at the indicated
key. If the resource is also available at other keys, it will still be there.

### Signature
```ts
removeAt(at: string, id: string): RemoteCollection<Resource>
```

## concatResources

If you need to append to the list, instead of replacing them, use this method.
It is very similar to `withList`.

### Signature
```ts
concatResources(idProp: keyof Resource, resources: Resource[]): RemoteCollection<Resource>
```
