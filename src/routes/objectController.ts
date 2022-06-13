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
      lastModified: this._lastModified?.toISOString()
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

  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const params : IAreaRequest = request.params as IAreaRequest
    if (!await fastify.storageAreaService.doesAreaExist(params.area)) {
      reply.code(404)
      done(new Error(`Area ${params.area} does not exist`))
    }
    done()
  })

  // list objects
  fastify.get<{
    Querystring: IObjectSearchQuery,
    Reply: IPaginatedObjectMetaDataResponse | ErrorResponse
    Params: IAreaRequest
  }>('/:area', async (request: FastifyRequest, reply: FastifyReply) => {
    const query: IObjectSearchQuery = request.query as IObjectSearchQuery
    const params = request.params as IAreaRequest
    const areaMetaData = await fastify.storageAreaService.getAreaMetaData(params.area)
    if (areaMetaData.totalObjectCount <= query.offset) {
      return reply.code(400).send({
        error: 'Offset is greater than total object count'
      })
    }
    const listResult = await fastify.objectStorageService.listObjects(params.area, query.offset, query.count)
    reply.send({
      total: areaMetaData.totalObjectCount,
      offset: query.offset,
      count: listResult.length,
      objects: listResult.map(ObjectMetaDTO.fromObjectMetaData)
    } as IPaginatedObjectMetaDataResponse)
  })

  // get object
  fastify.get<{
    Params: IAreaAndObjectRequest
    Reply: ErrorResponse | Stream
  }>('/:area/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params : IAreaAndObjectRequest = request.params as IAreaAndObjectRequest
    const object = await fastify.objectStorageService.getObject(params.area, params.id)
    reply.type(object.metaData.mimeType)
      .header('Content-Disposition', `attachment; filename="${object.metaData.fileName}"`)
      .header('Content-Length', object.metaData.size)
      .header('Last-Modified', object.metaData.lastModified?.toUTCString())
      .send(object.stream)
    reply.send()
  })

  // upload object
  fastify.put<{
    Params: IAreaAndObjectRequest,
    Reply: ErrorResponse | IObjectMetaData
  }>('/:area/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params : IAreaAndObjectRequest = request.params as IAreaAndObjectRequest
    const file = await request.file()
    await fastify.objectStorageService.putObject(params.area, params.id, {
      metaData: {
        fileName: file.filename,
        mimeType: file.mimetype,
        lastModified: new Date(),
        id: params.id
      },
      stream: file.file
    } as IObject)
    const metaData: IObjectMetaDTO = ObjectMetaDTO.fromObjectMetaData(await fastify.objectStorageService.getObjectMetaData(params.area, params.id))
    reply.send(metaData)
  })

  // delete object
  fastify.delete<{
    Params: IAreaAndObjectRequest
  }>('/:area/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params : IAreaAndObjectRequest = request.params as IAreaAndObjectRequest
    if (await fastify.objectStorageService.doesObjectExist(params.area, params.id)) {
      reply.code(404).send({
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
