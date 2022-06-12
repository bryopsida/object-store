import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'

export interface IObjectSearchQuery {
  area: string
  offset: number
  count: number
}

export default function ObjectApiControllerPlugin (fastify : FastifyInstance, opts : FastifyPluginOptions, done: Function) {
  fastify.addHook('preHandler', (fastify as any).auth([
    (fastify as any).verifyCredentials
  ]))

  // list objects
  fastify.get<{
    Querystring: IObjectSearchQuery
  }>('/', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({})
  })

  // get object
  fastify.get('/:area/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({})
  })

  // upload object
  fastify.put('/:area/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({})
  })

  // delete object
  fastify.delete('/:area/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send({})
  })

  done()
}
