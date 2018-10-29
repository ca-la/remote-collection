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

Updated usage documentation coming soon. For now, please see the very
comprehensive tests for examples of normal usage.
