import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export interface IStorageAreaService {
}

export interface IStorageArea {

}

export interface IStorageAreaServiceOptions {
  areas: IStorageArea[]
}

export class StorageAreaService implements IStorageAreaService {
  private readonly _areas: IStorageArea[]
  constructor (options: IStorageAreaServiceOptions) {
    this._areas = options.areas
  }
}

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    storageAreaService: IStorageAreaService
  }
}

export default function StorageAreaServicePlugin (fastify: FastifyInstance, opts: FastifyPluginOptions, done: Function) {
  fastify.decorate('storageAreaService', new StorageAreaService(opts.areas))
  done()
}
