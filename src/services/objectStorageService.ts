import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { Stream } from 'stream'
import { IStorageAreaService } from './storageAreaService'

export interface IObjectMetaData {
  id: string
  fileName: string
  mimeType: string
  size: number
  lastModified: Date
}

export interface IObject {
  metaData: IObjectMetaData
  stream: Stream
}

export interface IStorageMetadata {
  spaceUsedMBytes: number
  spaceAvailableMBytes: number
  totalObjectCount: number
}
export interface IObjectStorageService {
  doesObjectExist(area: string, id: string): Promise<boolean>
  getObject(area: string, id: string): Promise<IObject>
  putObject(area: string, id: string, object: IObject): Promise<void>
  deleteObject(area: string, id: string): Promise<void>
  listObjects(area: string, offset: number, count: number): Promise<IObjectMetaData[]>
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

  doesObjectExist (area: string, id: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  getObject (area: string, id: string): Promise<IObject> {
    throw new Error('Method not implemented.')
  }

  putObject (area: string, id: string, object: IObject): Promise<void> {
    throw new Error('Method not implemented.')
  }

  deleteObject (area: string, id: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  listObjects (area: string, offset: number, count: number): Promise<IObjectMetaData[]> {
    throw new Error('Method not implemented.')
  }
}

export default function ObjectStorageServicePlugin (fastify: FastifyInstance, opts: FastifyPluginOptions, done: Function) {
  fastify.decorate('objectStorageService', new ObjectStorageService(fastify.storageAreaService, opts))
  done()
}
