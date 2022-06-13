import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import crypto from 'crypto'
import path from 'path'
import fastifyPlugin from 'fastify-plugin'
import { Stream } from 'stream'
import { IStorageAreaService } from './storageAreaService'

export interface IObjectMetaData {
  id: string
  fileName: string
  mimeType: string
  size?: number
  lastModified: Date
}

export interface IObject {
  metaData: IObjectMetaData
  stream: Stream
}
export interface IObjectStorageService {
  doesObjectExist(area: string, id: string): Promise<boolean>
  getObject(area: string, id: string): Promise<IObject>
  getObjectMetaData(area: string, id: string): Promise<IObjectMetaData>
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

  private async getInternalFileName (id: string) : Promise<string> {
    const normalized = id.toLowerCase()
    return crypto.createHash('sha256').update(normalized).digest('hex')
  }

  private async getFilePath (area: string, id: string): Promise<string> {
    const storageAreaMetaData = await this._storageAreaService.getArea(area)
    if (!storageAreaMetaData) {
      throw new Error('Area does not exist')
    }
    return path.join(storageAreaMetaData.path, await this.getInternalFileName(id))
  }

  private getMetaFilePath (filePath: string) : string {
    return `${filePath}.meta.json`
  }

  private parseMetaData (metaData: string): IObjectMetaData {
    // TODO: add validation here
    return JSON.parse(metaData)
  }

  async getObjectMetaData (area: string, id: string): Promise<IObjectMetaData> {
    const filePath = await this.getFilePath(area, id)
    const metaPath = this.getMetaFilePath(filePath)
    const metaData = await fs.readFile(metaPath, 'utf8')
    return this.parseMetaData(metaData)
  }

  async doesObjectExist (area: string, id: string): Promise<boolean> {
    const filePath = await this.getFilePath(area, id)
    return fs.access(filePath).then(() => true).catch(() => false)
  }

  async getObject (area: string, id: string): Promise<IObject> {
    const fileName = await this.getFilePath(area, id)

    // get a stream for the file itself
    const stream = createReadStream(fileName)

    // get the metadata
    const metaData = this.parseMetaData(await fs.readFile(this.getMetaFilePath(fileName), 'utf8'))
    return {
      metaData,
      stream
    }
  }

  async putObject (area: string, id: string, object: IObject): Promise<void> {
    const filePath = await this.getFilePath(area, id)
    const metaFilePath = this.getMetaFilePath(filePath)
    const metaData = {
      id,
      fileName: object.metaData.fileName,
      mimeType: object.metaData.mimeType,
      size: object.metaData.size,
      lastModified: object.metaData.lastModified
    }
    const fileWriteProm = fs.writeFile(filePath, object.stream, {
      flag: 'w'
    })
    await fs.writeFile(metaFilePath, JSON.stringify(metaData), {
      encoding: 'utf8',
      flag: 'w'
    })
    await fileWriteProm
  }

  async deleteObject (area: string, id: string): Promise<void> {
    const filePath = await this.getFilePath(area, id)
    const metaFilePath = this.getMetaFilePath(filePath)
    await fs.unlink(filePath)
    await fs.unlink(metaFilePath)
  }

  // TODO: look at opendir to see if we can skip around the file system more effeciently
  async listObjects (area: string, offset: number, count: number): Promise<IObjectMetaData[]> {
    const areaPath = await this._storageAreaService.getArea(area)
    if (!areaPath) {
      throw new Error('Area does not exist')
    }
    const files = await fs.readdir(await areaPath.path)
    const metaFiles = files.filter(file => file.endsWith('.meta.json'))
    const subsetFiles = metaFiles.splice(offset, count)
    return (await Promise.all(subsetFiles.map(async (file) => fs.readFile(path.join(areaPath.path, file), 'utf8')))).map(this.parseMetaData)
  }
}
/**
 * Use fastify plugin to make these services available to fastify instance, can refactor in the future to scope to specific plugin controller scope
 */
export default fastifyPlugin(function ObjectStorageServicePlugin (fastify: FastifyInstance, opts: FastifyPluginOptions, done: Function) {
  fastify.decorate('objectStorageService', new ObjectStorageService(fastify.storageAreaService, opts))
  done()
}, '4.x')
