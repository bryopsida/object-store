# Object-Store

[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=bryopsida_object-store&metric=coverage)](https://sonarcloud.io/summary/new_code?id=bryopsida_object-store) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=bryopsida_object-store&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=bryopsida_object-store) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=bryopsida_object-store&metric=bugs)](https://sonarcloud.io/summary/new_code?id=bryopsida_object-store) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=bryopsida_object-store&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=bryopsida_object-store)

This is a simple service that stores objects on the local filesystem. Must be used on combination with [Object-Store-Router](https://github.com/bryopsida/object-store-router) for sharding across multiple machines, and [Object-Store-Sync](https://github.com/bryopsida/object-store-sync) to automatically push files as modified on a file system to the store.

## How to get started

You can run this application either directly with node or using a container. The default storage area uses the temp folder for your operating system, you should customize this to an area more appropriate for your system.

### NPM

This application is compatible with node versions 16-18, you can install the application with `npm install -g @bryopsida/object-store`, and run it with `object-store`. The default credentials are `admin:admin` and you can find more information about the API at the swagger ui at http://localhost:8080/documentation.

### Docker

A docker image is provided if you prefer to use a container. You can run the application using `docker run bryopsida/object-store:main -p 8080:8080`, the default credentials are `admin:admin` and you can find more information about the API at http://localhost:8080/documentation/.

## Work in progress

This is currently a work in progress, for more information on what's done and what's coming up checkout the [project](https://github.com/users/bryopsida/projects/2/views/2)
