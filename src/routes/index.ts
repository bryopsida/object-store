import { FastifyInstance } from 'fastify'
import objectController from './objectController'
import storageStatusController from './storageStatusController'

export default class RouteRegistrator {
  static configureRoutes (fastify: FastifyInstance) {
    fastify.register(objectController, { prefix: '/api/objects/v1' })
    fastify.register(storageStatusController, { prefix: '/api/storage_status/v1' })
  }
}
