# Remote-Collection
A TypeScript `RemoteData` Collection class

<hr />

There have been a number of articles written about using Algebraic Data Types to
describe the states that data fetching entails. Replacing `isFetching` and other
patterns with explicit expressions of each state is helpful, but there is still
room to improve on the developer experience of dealing with remote data in the
real world. `remote-collection` aims to provide a user-friendly experience while
keeping 100% type-safety.

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

## Views vs. Resources

The same set of resources might have different ordering, be a filtered set, or
some other smaller subset of the overall set. We call these subsets "views". One
of the requirements of a resource is that it is identifiable by some property.
Typically an `id`, `uri`, `href`, or similar property. The set of those
identified resources are normalized such that updates to that resource should be
visible to other views that might include it.

The state of fetching the whole collection, and the state of each individual
resource are possiblity divergent, so `RemoteCollection` stores those states
separately. You may have a failure state in one of your resources, but are
refetching the whole list, and `RemoteCollection` tracks both states.

## Transitioning the RemoteData state

A helpful cheatsheet for how to transition to the different
[`RemoteData`](https://github.com/ca-la/remote-data) states for collections vs
individual resources:

| Remote State | View | Resource |
|---|---|---|
|`RemoteInitial`|[`reset`](#reset) |[`remove`](#remove)|
|`RemotePending`|[`refresh`](#refresh) |[`fetch`](#fetch)|
|`RemoteFailure`|[`withListFailure`](#withlistfailure)|[`withResourceFailure`](#withresourcefailure) |
|`RemoteRefresh`|[`refresh`](#refresh)|[`fetch`](#fetch)|
|`RemoteSuccess`|[`withList`](#withlist)|[`withResource`](#withresource)|

# Usage

## RemoteCollection (Constructor)

Creates a new `RemoteCollection` of a generic `Resource` type. It takes two
arguments, the first being the key of the identifier on the resource.

### Signature
```ts
RemoteCollection<Resource extends { [key: string]: any }>(
  idProp: keyof Resource
)
```

### Examples
```ts
// Initialize a new empty RemoteCollection where the wrapped resource is a `User`
const collection = new RemoteCollection<User>('id');
// Initialize a new RemoteCollection as a copy of an existing collection
const copy = new RemoteCollection<User>('id', collection);
```

# Resource Methods

## fetch

Sets the resource at the given ID to `RemotePending`, or if it is already a
`RemoteSuccess` or `RemoteRefresh`, sets it to `RemoteRefresh`. Useful when
making the initial call to the server to indicate that we're currently fetching
this resource, or when updating or re-fetching a resource.

### Signature
```ts
fetch(id: string): RemoteCollection<Resource>
```

### Examples
```ts
const users: User[] = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }];
const collection = new RemoteCollection<User>('id')
  .withList(users)
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

## withResource

Add or update a single Resource.

This method adds a single resource to the `RemoteCollection` representing the
normal success-case for fetching the collection. If the resource is not
currently in the set of resources, it is appened to the _end_ of the list at the
key specified in the third argument. If you do not specify a key, the new
resource will be appended to the list at `RemoteCollection.DEFAULT_KEY`. If the
item _does_ exist already, that resource is replaced with the new value
specified

### Signature
```ts
withResource(
  resource: Resource,
  viewKey?: string = RemoteCollection.DEFAULT_KEY
): RemoteCollection<Resource>
```

### Example
```ts
const collection = new RemoteCollection<User>('id');

assert.deepStrictEqual(
  collection.withResource(users.id).find(users[0].id),
  RemoteData.success(users[0])
);

assert.deepStrictEqual(
  collection.withResource(users.id).view(),
  RemoteData.success([users[0]])
);

assert.deepStrictEqual(
  collection.withResource(users.id, 'team1').view('team1'),
  RemoteData.success([users[0]])
);
```

## withResourceFailure

If requesting a single resource fails, calling this method will store a
`RemoteFailure` with the passed `string` in the resource map for just this
resource.

### Signature
```ts
withResourceFailure(id: string, error: string): RemoteCollection<Resource>
```

## find

Lookup a resource by its `idProp`. **NOTE**: If the resource has never been
requested, or has been removed, we return `RemoteInitial` indicating that is has
not been retrieved.

### Signature
```ts
find(id: string): RemoteData<string[], Resource>
```

### Example
```ts
const collection = new RemoteCollection<User>('id');

assert.deepStrictEqual(
  collection.find('a'),
  RemoteData.initial
);

assert.deepStrictEqual(
  collection.withResource({ id: 'a', name: 'Alice' }).find('a'),
  RemoteData.success({ id: 'a', name: 'Alice' })
);

assert.deepStrictEqual(
  collection.withResourceFailure('b', 'Not authorized').find('b'),
  RemoteData.failure(['Not authorized'])
);
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
const collection = new RemoteCollection<User>('id').withList(users);
  
assert.deepStrictEqual(
  collection.view(),
  RemoteData.success(users)
);

assert.deepStrictEqual(
  collection.remove('a').view(),
  RemoteData.success([users[1]])
);
```

# Collection Methods

## refresh

Like `fetch` but for the whole list. The optional `at` arguments allows you to specify
the view key to refresh.

### Signature
```ts
refresh(viewKey?: string = RemoteCollection.DEFAULT_KEY): RemoteCollection<Resource>
```

### Examples
```ts
const users: User[] = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }];
const collection = new RemoteCollection<User>('id');

assert.deepStrictEqual(
  collection.refresh().view(),
  RemoteData.pending
);
  
assert.deepStrictEqual(
  collection.withList(users).refresh().view(),
  RemoteData.refresh(users)
);
  
assert.deepStrictEqual(
  collection.withList(users, 'team1').refresh('team1').view(),
  RemoteData.refresh(users)
);
```

## withList

Set or replace the list of resources.

This method adds a list of resources to the `RemoteCollection` representing the
normal success-case for fetching the collection at the view key specified by the
second argument, or `RemoteCollection.DEFAULT_KEY` if not provided.

### Signature
```ts
withList(
  list: Resource[],
  viewKey?: string = RemoteCollection.DEFAULT_KEY
): RemoteCollection<Resource>
```


### Example
```ts
const collection = new RemoteCollection<User>('id');

assert.deepStrictEqual(
  collection.withList(users).view(),
  RemoteData.success(users)
);

assert.deepStrictEqual(
  collection.withList(users).view(),
  collection.withList(users).view(RemoteCollection.DEFAULT_KEY)
);

assert.deepStrictEqual(
  collection.withList(users, 'team1').view('team1'),
  RemoteData.success(users)
);
```

## withListFailure

If requesting the list fails, calling this method will store a `RemoteFailure`
with the passed `string` at the view key specified by the second argument, or
`RemoteCollection.DEFAULT_KEY` if not provided.

### Signature
```ts
withListFailure(
  error: string,
  viewKey?: string = RemoteCollection.DEFAULT_KEY
): Collection<Resource>
```

## view

Return the list of resources at a view key, or default to
`RemoteCollection.DEFAULT_KEY` if none is provided.

### Signature
```ts
public view(viewKey?: string = RemoteCollection.DEFAULT_KEY): RemoteData<string[], Resource[]>
```

### Examples

Here is a break down of what to expect:

- If the list was successfully retrieved, and all resources corresponding to the
  IDs in that list are successful (meaning they haven't later been updated to
  other `RemoteData` states), you will receive a `RemoteSuccess` containing a
  list of all of the resources.
  
  ```ts
  const users: User[] = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }];
  const collection = new RemoteCollection<User>('id').withList(users);
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
  const collection = new RemoteCollection<User>('id')
    .withList(users)
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
  const collection = new RemoteCollection<User>('id')
    .withList(users)
    .fetch('d');

  assert.deepStrictEqual(
    collection.view(),
    RemoteData.pending
  );
  ```
  
Using a view key:

```ts
const collection = new RemoteCollection<User>('id')
  .withList(users, 'team1');
  
assert.deepStrictEqual(
  collection.view(),
  RemoteData.initial
);

assert.deepStrictEqual(
  collection.view('team1'),
  RemoteData.success(users);
);
```

## concat

Appends a `RemoteCollection` to another. The `source` collection's views are
added to the *end* of the instance's existing views. The resources in the
`source` are overwrite any matching sources in the instance, and new resources
are added.


### Signature
```ts
concat(
  source: RemoteCollection<Resource>
): RemoteCollection<Resource>
```

### Example

Adding resources to the beginning of a viewKey

```ts
const users: User[] = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' }
];
const otherUsers: User[] =[
  { id: 'c', name: 'Charlie' }
];
const existing = new RemoteCollection<User>('id').withList(otherUsers, 'team1');
const collection = new RemoteCollection<User>('id').withList(users, 'team1');

assert.deepStrictEqual(
  collection.concat(existing).view('team1'),
  RemoteData.success([
    { id: 'a', name: 'Alice' },
    { id: 'b', name: 'Bob' },
    { id: 'c', name: 'Charlie' }
  ])
);
```

## map

Apply a function to every resource at a view key. **Note:** Be careful if your
function updates the property at the `idProp`, since that could invalidate the
key that is storing the resource.

### Signature
```ts
map(
  fn: (resource: Resource, index: string) => Resource,
  viewKey?: string = RemoteCollection.DEFAULT_KEY
): RemoteCollection<Resource>
```

### Example
```ts
const users: User[] = [
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' }
];
const collection = new RemoteCollection<User>('id').withList(users, 'team1');

assert.deepStrictEqual(
  collection.map(u => ({ ...u, name: u.name.toUpperCase() }), 'team1'),
  RemoteData.success([
    { id: 'a', name: 'ALICE' },
    { id: 'b', name: 'BOB' }
  ])
);
```

## reset

Removes the view at the given view key, or at the
`RemoteCollection.DEFAULT_KEY`.

### Signature
```ts
reset(viewKey?: string = RemoteCollection.DEFAULT_KEY): RemoteCollection<Resource>
```

### Example
```ts
const collection = new RemoteCollection<User>('id').withList(users, 'team1');

assert.deepStrictEqual(
  collection.view('team1'),
  RemoteData.success(users)
);

assert.deepStrictEqual(
  collection.reset('team1').view('team1'),
  RemoteData.initial
);
```
