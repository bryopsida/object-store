import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'
import { Stream } from 'stream'
import { IObject, IObjectMetaData } from '../services/objectStorageService'

export interface IObjectSearchQuery {
  offset: number
  count: number
}
export interface IObjectMetaDTO {
  id: string
  fileName: string
  mimeType: string
  size: number
  lastModified: Date
}

export interface IPaginatedObjectMetaDataResponse {
  total: number
  offset: number
  count: number
  objects: IObjectMetaDTO[]
}

export interface ErrorResponse {
  error: string
}

export interface IAreaRequest {
  area: string
}

export interface IAreaAndObjectRequest extends IAreaRequest {
  id: string
}

export class ObjectMetaDTO implements IObjectMetaDTO {
  private readonly _id: string
  private readonly _fileName: string
  private readonly _mimeType: string
  private readonly _size: number
  private readonly _lastModified: Date

  constructor (objectMetaDTO: IObjectMetaData) {
    this._id = objectMetaDTO.id
    this._fileName = objectMetaDTO.fileName
    this._lastModified = objectMetaDTO.lastModified
    this._mimeType = objectMetaDTO.mimeType
    this._size = objectMetaDTO.size || -1
  }

  get id (): string {
    return this.id
  }

  get fileName (): string {
    return this._fileName
  }

  get mimeType (): string {
    return this._mimeType
  }

  get size (): number {
    return this._size
  }

  get lastModified (): Date {
    return this._lastModified
  }

  public toJSON (): any {
    return {
      id: this._id,
      fileName: this._fileName,
      mimeType: this._mimeType,
      size: this._size,
      lastModified: this._lastModified == null ? null : (typeof this._lastModified === 'string' ? this._lastModified : this._lastModified.toISOString())
    }
  }

  static fromObjectMetaData (objectMetaData: IObjectMetaData): IObjectMetaDTO {
    return new ObjectMetaDTO(objectMetaData)
  }
}

export default function ObjectApiControllerPlugin (fastify : FastifyInstance, opts : FastifyPluginOptions, done: Function) {
  fastify.addHook('preHandler', (fastify as any).auth([
    (fastify as any).verifyCredentials
  ]))

  fastify.addHook('preHandler', async (req, reply) => {
    if (!await fastify.storageAreaService.doesAreaExist((req.params as any).area)) {
      reply.code(404).send({
        error: `Area ${(req.params as any).area} does not exist`
      })
    } else {
      done()
    }
  })

  // list objects
  fastify.get<{
    Querystring: IObjectSearchQuery,
    Reply: IPaginatedObjectMetaDataResponse | ErrorResponse
    Params: IAreaRequest
  }>('/:area', {
    schema: {
      description: 'Fetch a paginated list of objects stored in an area',
      params: {
        area: {
          type: 'string',
          description: 'Area to fetch the list of objects from'
        }
      },
      querystring: {
        type: 'object',
        properties: {
          count: {
            type: 'number',
            description: 'The maximum number of objects to fetch'
          },
          offset: {
            type: 'number',
            description: 'The offset to start fetching objects from within the area'
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query: IObjectSearchQuery = request.query as IObjectSearchQuery
    const params = request.params as IAreaRequest
    fastify.log.info(`Fetching object meta data from area ${params.area}`)
    const areaMetaData = await fastify.storageAreaService.getAreaMetaData(params.area)
    if (areaMetaData.totalObjectCount <= query.offset) {
      return reply.code(400).send({
        error: 'Offset is greater than total object count'
      })
    }
    const listResult = await fastify.objectStorageService.listObjects(params.area, query.offset, query.count)
    reply.send({
      total: areaMetaData.totalObjectCount,
      offset: parseInt(query.offset as any),
      count: listResult.length,
      objects: listResult.map(ObjectMetaDTO.fromObjectMetaData)
    } as IPaginatedObjectMetaDataResponse)
  })

  // get object
  fastify.get<{
    Params: IAreaAndObjectRequest
    Reply: ErrorResponse | Stream
  }>('/:area/:id', {
    schema: {
      description: 'Download an object from an area',
      params: {
        area: {
          type: 'string',
          description: 'The area that holds the object you want to download'
        },
        id: {
          type: 'string',
          description: 'The id of the object you want to download'
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const params : IAreaAndObjectRequest = request.params as IAreaAndObjectRequest
    if (!await fastify.objectStorageService.doesObjectExist(params.area, params.id)) {
      return reply.code(404).send({
        error: `The object ${params.id} or area ${params.area} does not exist!`
      })
    }
    fastify.log.info(`Fetching object ${params.id} for req ${request.id}`)
    const object = await fastify.objectStorageService.getObject(params.area, params.id)
    await reply.code(200)
      .type(object.metaData.mimeType)
      .header('Content-Disposition', `attachment; filename="${object.metaData.fileName}"`)
      .header('Content-Length', object.metaData.size)
      .header('Last-Modified', object.metaData.lastModified != null ? typeof object.metaData.lastModified === 'string' ? object.metaData.lastModified : object.metaData.lastModified.toUTCString() : undefined)
      .send(object.stream)
  })

  // upload object
  fastify.put<{
    Params: IAreaAndObjectRequest,
    Reply: ErrorResponse | IObjectMetaData
  }>('/:area/:id', {
    schema: {
      description: 'Upload an object to an area',
      params: {
        area: {
          type: 'string',
          description: 'The area you wish to upload the object to'
        },
        id: {
          type: 'string',
          description: 'The unique identifier of the object you wish to upload'
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const params : IAreaAndObjectRequest = request.params as IAreaAndObjectRequest
    const file = await request.file()
    await fastify.objectStorageService.putObject(params.area, params.id, {
      metaData: {
        fileName: file?.filename,
        mimeType: file?.mimetype,
        lastModified: new Date(),
        id: params.id
      },
      stream: file?.file
    } as IObject)
    const metaData: IObjectMetaDTO = ObjectMetaDTO.fromObjectMetaData(await fastify.objectStorageService.getObjectMetaData(params.area, params.id))
    reply.code(200).send(metaData)
  })

  // delete object
  fastify.delete<{
    Params: IAreaAndObjectRequest
  }>('/:area/:id', {
    schema: {
      description: 'Delete a object from an area',
      params: {
        area: {
          type: 'string',
          description: 'The area holding the object you wish to delete'
        },
        id: {
          type: 'string',
          description: 'The id of the object you wish to delete'
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const params : IAreaAndObjectRequest = request.params as IAreaAndObjectRequest
    if (!await fastify.objectStorageService.doesObjectExist(params.area, params.id)) {
      return reply.code(404).send({
        error: `Object ${params.id} does not exist in area ${params.area}`
      })
    }
    reply.send({
      success: true,
      messages: `Successfully deleted object ${params.id} from area ${params.area}`
    })
  })

  done()
}
