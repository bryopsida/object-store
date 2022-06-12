import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { IStorageAreaService } from './storageAreaService'

export interface IObjectStorageService {
}

// markup the fastify instance so when the above interface is imported it shows
// as being on the fastify instance
declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    objectStorageService: IObjectStorageService
  }
}

export class ObjectStorageService implements IObjectStorageService {
  private readonly _storageAreaService: IStorageAreaService

  constructor (storageAreaService: IStorageAreaService, opts: Record<string, any>) {
    this._storageAreaService = storageAreaService
  }
}

export default function ObjectStorageServicePlugin (fastify: FastifyInstance, opts: FastifyPluginOptions, done: Function) {
  fastify.decorate('objectStorageService', new ObjectStorageService(fastify.storageAreaService, opts))
  done()
}
