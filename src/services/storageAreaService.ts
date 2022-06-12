import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export interface IStorageArea {
  name: string
  description: string
  path: string
}

export interface IStorageMetadata {
  spaceUsedMBytes: number
  spaceAvailableMBytes: number
  totalObjectCount: number
}

export interface IStorageAreaService {
  doesAreaExist(area: string): Promise<boolean>
  getAreaMetaData(area: string): Promise<IStorageMetadata>
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
