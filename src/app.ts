import { FastifyInstance, fastify, FastifyServerOptions } from 'fastify'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import authPlugin from './auth/authPlugin'
import routes from './routes'
import config from 'config'
import storageAreaService from './services/storageAreaService'
import objectStorageService from './services/objectStorageService'

export interface AppOptions {
  serverOptions: FastifyServerOptions;
  port: number;
  host: string;
}

export default class App {
  private readonly _server: FastifyInstance
  private readonly _port: number
  private readonly _host: string
  private _isRunning: boolean

  constructor (opts?: AppOptions) {
    this._port = opts?.port || 3000
    this._host = opts?.host || 'localhost'
    this._server = fastify(opts?.serverOptions || {
      logger: true
    })
    this.configureSecurityPolicy()
    this.configureAuth()
    this.configureMiddleware()
    this.configureServices()
    this.configureRoutes()
    this._server.log.info('Finished configuration, ready to start listening')
    this._isRunning = false
  }

  /**
   * Register micsallaneous middleware here
   */
  private configureMiddleware () {
    this._server.log.info('Registering middleware')
    this._server.register(multipart)
  }

  /**
   * Configure the security policy headers for the server
   */
  private configureSecurityPolicy () {
    this._server.log.info('Registering security policy')
    this._server.register(helmet)
  }

  private configureServices () {
    this._server.log.info('Registering services')
    this._server.register(storageAreaService, {
      areas: config.get('storage.areas')
    }).after(() => {
      this._server.register(objectStorageService)
    })
  }

  /**
   * Adds the authentication and authorization polices to the server
   */
  private configureAuth () {
    this._server.log.info('Registering authentication and authorization policies')
    authPlugin(this._server, {})
  }

  /**
   * Adds the route configurations to the server
   */
  private configureRoutes () {
    this._server.log.info('Registering routes')
    routes.configureRoutes(this._server)
  }

  public async start (): Promise<void> {
    await this._server.listen({
      port: this._port,
      host: this._host
    })
    this._isRunning = true
    this._server.log.info('Listening for connections')
  }

  public async stop (): Promise<void> {
    this._server.log.info('Stopping listening for connections')
    await this._server.close()
    this._server.log.info('No longer listening for connections')
    this._isRunning = false
  }

  public get isRunning (): boolean {
    return this._isRunning
  }
}

/**
 * Ignore coverage on this part as it is just to check if running directly and wait for ctrl-c
 * if this becomes more complex it should be refactored and covered by tests
 */
/* istanbul ignore next */
if (require.main === module) {
  const app = new App({
    serverOptions: {
      logger: true
    },
    port: config.get<number>('fastify.port') || 3000,
    host: config.get<string>('fastify.host') || 'localhost'
  })

  process.on('SIGINT', async () => {
    await app.stop()
  })

  app.start().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
