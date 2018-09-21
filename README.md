# Remote-Collection
## A TypeScript `RemoteData` Collection class

### Rationale

There have been a number of articles written about using Algebraic Data Types to
describe the states that data fetching entails. Replacing all of the
`isFetching` and other ergonomics patterns with a clean pseudo-pattern-matching
pattern is nice, but there is still a lot of room to improve on the ergonomics
of dealing with remote data. `remote-collection` aims to provide a user-friendly
experience to the user while keeping 100% type-safety.

### Resources

A typical REST API lets you interface with remote `Resource`s through well-known
HTTP patterns. A `User` resource, for instance, might be accessible by making a
`GET https://api.myawesomeapp.com/user/some-id`. You can update parts of that
resource by making a `PUT` or `PATCH` request to that same URL, or creating a
new resource at that URL by making a `POST` request.

### Collections

A `Collection` is typically some ordered list of a `Resource`. You might have a
`Users` collection, for instance. You can imagine that your API would support
making a request to `POST https://api.myawesomeapp.com/user` with a well-formed
`User` resource, and it would add that `User` resource to the `Users`
collection. `DELETE https://api.myawesomeapp.com/user/some-id` would remove that
`User`, etc.

### `RemoteData` Ergonomics

One challenge with dealing with remote resources is identity of a resource
within a collection. Typically, a resource would have an `id` field, or some
other unique identifier that you use to tie a given resource to a collection.
But, fetching a collection and then deleting one of the resources is a nested
affair: The request to get the collection (`GET /user`), and the request to
delete a resource (`DELETE /user/some-id`) both have states, data, failure cases
to account for, etc.

`remote-collection` is here to help with that!

### Usage

#### `Collection` Constructor

```ts
import { Collection } from '@cala/remote-collection';
import {
  getCollection,
  getById,
  updateById,
  deleteById
} from './api/user';

interface User {
  id: number;
  name: string;
}

const usersCollection: RemoteInitial = new Collection<Error, User>({
  getCollection: getCollection,
  getResource: getById,
  updateResource: updateById,
  deleteResource: deleteById,
  getIdFromResource: (user: User) => user.id,
  idProp: 'id'
});
```

#### Working with the whole collection

If you need to list a collection, you will first need to call `#refresh` on it
to fetch the list, which returns a promise of the refreshed `Collection`. After
that, you can either get the whole list with `#list`, a partial view into the
list with `#view(idList: string[])` or get a single resource by id with
`#get(id: string)`.

```ts
// [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
const refreshed = await usersCollection.refresh();

refreshed.list(); // RemoteSuccess([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
refreshed.view(['c', 'a', 'b']); // RemoteSuccess([{ id: 'c' }, { id: 'a' }, { id: 'b' }])
refreshed.get('a'); // Some(RemoteSuccess({ id: a }))
refreshed.get('z'); // None
refreshed.view(['c', 'z']); // RemoteSuccess([{ id: 'c' }])
```

#### Working with a single resource

If you only need to fetch a single resource, you can use `#fetch(id: string)`
which returns a promise of the `Collection` with that id fetched. After that,
you can use `#get(id: string)` or even `#view(idList: string[])` to retrieve
that resource.

```ts
// [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
const fetched = await usersCollection.fetch('a');

fetched.get('a'); // Some(RemoteSuccess({ id: a }))
fetched.list(); // RemoteSuccess([{ id: 'a' }])
fetched.view(['c', 'a', 'b']); // RemoteSuccess([{ id: 'a' }])
fetched.get('z'); // None
fetched.view(['c', 'z']); // RemoteSuccess([])
```
