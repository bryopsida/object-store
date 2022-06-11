import { FastifyOAuth2Options } from '@fastify/oauth2'
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify'

export default (fastify: FastifyInstance, opts: FastifyPluginOptions) => {
  if (opts.authType === 'oauth2') {
    fastify.log.info('Using oauth2 authentication')
    const oauthOpts : FastifyOAuth2Options = {
      ...opts.oauth2Options,
      ...{
        name: 'customOauth2'
      }
    }
    fastify.register(require('@fastify/oauth2'), oauthOpts)
    fastify.after(() => {
      fastify.log.info('Aliasing verifyCredentials to customOauth2')
      fastify.decorate('verifyCredentials', (fastify as any).customOauth2)
    })
  } else {
    fastify.log.info('Using embedded http basic authentication')
    fastify.register(require('@fastify/basic-auth'), {
      validate: (username: string, password: string, req: FastifyRequest, reply: FastifyReply, done: Function) => {
        if (username === 'admin' && password === 'admin') {
          done()
        } else {
          done(new Error('Invalid credentials'))
        }
      },
      authenticate: true
    })
    fastify.after(() => {
      fastify.log.info('Aliasing verifyCredentials to basicAuth')
      fastify.decorate('verifyCredentials', (fastify as any).basicAuth)
    })
  }
  fastify.register(require('@fastify/auth'))
}
