import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'
export interface IAreaSearchQuery {
  offset: number
  count: number
}
export interface IAreaRequestParams {
  area: string
}

export default function StorageStatusApiControllerPlugin (fastify : FastifyInstance, opts : FastifyPluginOptions, done: Function) {
  fastify.addHook('preHandler', (fastify as any).auth([
    (fastify as any).verifyCredentials
  ]))

  // list areas
  fastify.get<{
    Querystring: IAreaSearchQuery
  }>('/areas', async (request: FastifyRequest, reply: FastifyReply) => {
    const listQuery : IAreaSearchQuery = request.query as IAreaSearchQuery
    reply.send(await fastify.storageAreaService.listAreas(listQuery.offset, listQuery.count))
  })

  // get metadata information for area
  fastify.get<{
    Params: IAreaRequestParams
  }>('/areas/:area', async (request: FastifyRequest, reply: FastifyReply) => {
    const pathParams :IAreaRequestParams = request.params as IAreaRequestParams
    if (!fastify.storageAreaService.doesAreaExist(pathParams.area)) {
      return reply.code(404).send({
        error: 'Area not found'
      })
    }
    reply.send(await fastify.storageAreaService.getAreaMetaData(pathParams.area))
  })
  done()
}
