import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'
export interface IAreaSearchQuery {
  offset: number
  count: number
}
export default function StorageStatusApiControllerPlugin (fastify : FastifyInstance, opts : FastifyPluginOptions, done: Function) {
  fastify.addHook('preHandler', (fastify as any).auth([
    (fastify as any).verifyCredentials
  ]))

  // list areas
  fastify.get<{
    Querystring: IAreaSearchQuery
  }>('/areas', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({})
  })

  // get metadata information for area
  fastify.get('/areas/:area', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({})
  })

  done()
}
