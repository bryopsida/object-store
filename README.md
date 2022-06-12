# Object-Store
This is a simple service that stores objects on the local filesystem. Must be used on combination with [https://github.com/bryopsida/object-store-sync](Object-Store-Router) for sharding across multiple machines, and [https://github.com/bryopsida/object-store-sync](Object-Store-Sync) to automatically push files as modified on a file system to the store.

## TODO
- [ ] Create project + kanban board
- [ ] Implement Auth Plugin (default basic-auth but use fastify/auth shim to allow swapping out easily)
- [ ] Define API routes for object store API
- [ ] Define API routes for storage status API
- [ ] Add publishing to NPM
- [ ] Add Dockerfile and publish to ghcr.io and docker.io
- [ ] Implement service that can inspect defined storage areas and the amount of space available
- [ ] Implement service that can save/delete/fetch/list objects in storage areas
- [ ] Implement service that can phase out older files based on a retention policy and capacity of storage areas
- [ ] Update README.md with usage instructions once implementation is further along.
