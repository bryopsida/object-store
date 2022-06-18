import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import checkDiskSpace from 'check-disk-space'
import fs from 'fs/promises'

export interface IStorageArea {
  name: string
  description: string
  path: string
}

export interface IStorageMetadata {
  spaceUsedMBytes: number
  spaceAvailableMBytes: number
  totalObjectCount: number
  online: boolean
}

export interface IStorageAreaService {
  doesAreaExist(area: string): Promise<boolean>
  getArea(area: string): Promise<IStorageArea | undefined>
  getAreaMetaData(area: string): Promise<IStorageMetadata>
  listAreas(offset: number, count: number): Promise<IStorageArea[]>
}

export interface IStorageAreaServiceOptions {
  areas: IStorageArea[]
}

export class StorageAreaService implements IStorageAreaService {
  private readonly _areas: IStorageArea[]
  constructor (options: IStorageAreaServiceOptions) {
    if (!options.areas) {
      throw new Error('No areas provided')
    }
    this._areas = options.areas
    this._areas.forEach(async area => {
      try {
        await fs.stat(area.path)
      } catch (err) {
        await fs.mkdir(area.path)
      }
    })
  }

  /**
   * resolves the area object for the given area name
   * @param area The name of the area to get
   * @returns The area object or undefined if the area does not exist
   */
  getArea (area: string): Promise<IStorageArea|undefined> {
    return Promise.resolve(this._areas.find(a => a.name === area))
  }

  /**
   * Resolves true if the area exists, false otherwise
   * @param area The name of the area to check
   */
  doesAreaExist (area: string): Promise<boolean> {
    return Promise.resolve(this._areas.some(a => a.name === area))
  }

  /**
   * Resolves the metadata for the area by inspecting the area's filesystem
   * information
   * @param area The name of the area to get the metadata for
   */
  async getAreaMetaData (area: string): Promise<IStorageMetadata > {
    if (!await this.doesAreaExist(area)) {
      throw new Error(`Area ${area} does not exist`)
    }
    const areaObject : IStorageArea | undefined = this._areas.find(a => a.name === area)
    if (!areaObject) {
      throw new Error(`Unable to retrieve area ${area}`)
    }
    const stat = await fs.stat(areaObject.path)
    if (!stat.isDirectory()) {
      return {
        spaceUsedMBytes: 0,
        spaceAvailableMBytes: 0,
        totalObjectCount: 0,
        online: false
      }
    }
    const objectCountPromise = await this.getAreaObjectCount(areaObject.path)
    const spaceInfoPromise = await checkDiskSpace(areaObject.path)
    return {
      spaceUsedMBytes: spaceInfoPromise.size / 1024 / 1024,
      spaceAvailableMBytes: spaceInfoPromise.free / 1024 / 1024,
      totalObjectCount: objectCountPromise || 0,
      online: true
    }
  }

  private async getAreaObjectCount (areaPath: string): Promise<number | undefined> {
    // TODO: check performance on large folders, this builds a list of files in memory,
    // which is not ideal but will probably be fine for sub 25k files
    // assume unmixed content, otherwise we will need to add more logic
    // actual count is half of the file count due to meta files
    return (await fs.readdir(areaPath)).length / 2
  }

  /**
   * Returns the requested number of areas starting at the offset
   * @param offset The number of areas to skip
   * @param count The number of areas to return
   */
  listAreas (offset: number, count: number): Promise<IStorageArea[]> {
    // currently all in memory, so lets just use array methods
    return Promise.resolve(this._areas.slice(offset, offset + count))
  }
}

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    storageAreaService: IStorageAreaService
  }
}

/**
 * Use fastify plugin to make these services available to fastify instance, can refactor in the future to scope to specific plugin controller scope
 */
export default fastifyPlugin(function StorageAreaServicePlugin (fastify: FastifyInstance, opts: FastifyPluginOptions, done: Function) {
  fastify.decorate('storageAreaService', new StorageAreaService({
    areas: opts.areas
  }))
  done()
}, '4.x')
