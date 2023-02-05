import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import argon2 from 'argon2'

export interface IUserService {
  validate(username: string, password: string): Promise<boolean>
}

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    userService: IUserService
  }
}

interface User {
  password: string
}

class UserService implements IUserService {
  private readonly _users: Record<string, User>

  constructor(userStorePath: string) {
    this._users = require(userStorePath)
  }

  validate(username: string, password: string): Promise<boolean> {
    if (!this._users[username]) {
      return Promise.resolve(false)
    }
    return argon2.verify(this._users[username].password, password)
  }
}

/**
 * Use fastify plugin to make these services available to fastify instance, can refactor in the future to scope to specific plugin controller scope
 */
export default fastifyPlugin(function UserServicePlugin(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
  done: Function
) {
  fastify.decorate('userService', new UserService(opts.userStorePath))
  done()
},
'4.x')
