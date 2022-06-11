import Fastify, { FastifyInstance } from 'fastify'
import fastifyHelmet from '@fastify/helmet'
import config from 'config'

const server: FastifyInstance = Fastify({
  logger: config.get<boolean>('fastify.logger')
})

server.log.info('Loading helmet')
server.register(fastifyHelmet, {})

server.log.info('Loading auth')
server.register(require('./auth/auth'))

server.log.info('Registering storage status API Controller')
server.register(require('./controllers/storageStatusController'), { 
  prefix: '/api/storage/v1/' 
})

server.log.info('Registering object storage API Controller')
server.register(require('./controllers/objectController'), {
  prefix: '/api/objects/v1/'
})

const start = async () => {
  try {
    const opts = {
      port: config.get<number>('fastify.port'),
      host: config.has('fastify.host') ? config.get<string>('fastify.host') : undefined,
    }
    await server.listen(opts)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}
start()