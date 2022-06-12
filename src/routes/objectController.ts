import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'
import { Stream } from 'stream'
import { IObject, IObjectMetaData } from '../services/objectStorageService'

export interface IObjectSearchQuery {
  area: string
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
export interface IObjectUploadHeaders {
  'content-type': string
  'content-length': number
  'x-filename': string
  'last-modified': string
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
    this._size = objectMetaDTO.size
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

  static fromObjectMetaData (objectMetaData: IObjectMetaData): IObjectMetaDTO {
    return new ObjectMetaDTO(objectMetaData)
  }
}

export default function ObjectApiControllerPlugin (fastify : FastifyInstance, opts : FastifyPluginOptions, done: Function) {
  fastify.addHook('preHandler', (fastify as any).auth([
    (fastify as any).verifyCredentials
  ]))

  fastify.addHook('preHandler', async function (request: FastifyRequest, reply: FastifyReply) {
    const params : IAreaRequest = request.params as IAreaRequest
    if (!await this.storageAreaService.doesAreaExist(params.area)) {
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
    const areaMetaData = await fastify.storageAreaService.getAreaMetaData(query.area)
    if (areaMetaData.totalObjectCount <= query.offset) {
      reply.code(400).send({
        error: 'Offset is greater than total object count'
      })
    }
    const listResult = await fastify.objectStorageService.listObjects(query.area, query.offset, query.count)
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
      .header('Last-Modified', object.metaData.lastModified.toUTCString())
      .send(object.stream)
    reply.send()
  })

  // upload object
  fastify.put<{
    Headers: IObjectUploadHeaders,
    Params: IAreaAndObjectRequest,
    Body: Stream,
    Reply: ErrorResponse | IObjectMetaData
  }>('/:area/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params : IAreaAndObjectRequest = request.params as IAreaAndObjectRequest
    const headers : IObjectUploadHeaders = request.headers as unknown as IObjectUploadHeaders
    await fastify.objectStorageService.putObject(params.area, params.id, {
      metaData: {
        fileName: headers['x-filename'],
        mimeType: headers['content-type'],
        size: headers['content-length'],
        id: params.id
      },
      stream: request.body
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
