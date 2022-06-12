import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export interface IStorageArea {

}

export interface IStorageAreaService {
  doesAreaExist(area: string): Promise<boolean>
  getAreaMetaData(area: string): Promise<any>
  listAreas(offset: number, count: number): Promise<IStorageArea[]>
}

export interface IStorageAreaServiceOptions {
  areas: IStorageArea[]
}

export class StorageAreaService implements IStorageAreaService {
  private readonly _areas: IStorageArea[]
  constructor (options: IStorageAreaServiceOptions) {
    this._areas = options.areas
  }

  doesAreaExist (area: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  getAreaMetaData (area: string): Promise<any> {
    throw new Error('Method not implemented.')
  }

  listAreas (offset: number, count: number): Promise<IStorageArea[]> {
    throw new Error('Method not implemented.')
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
