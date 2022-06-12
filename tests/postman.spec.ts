/* eslint-disable no-undef */

import App from '../src/app'
import newman from 'newman'
import { Agent } from 'http'

describe('Postman collections', () => {
  let app: App
  let agent: Agent

  beforeAll(async () => {
    agent = new Agent()
    console.log('Starting app for postman tests')
    app = new App({
      serverOptions: {
        logger: false
      },
      port: 3000,
      host: 'localhost'
    })
    await app.start()
  })
  afterAll(async () => {
    console.log('Stopping app for postman tests')
    await app.stop()
    agent.destroy()
  })
  describe('Object Storage', () => {
    // increase time since this is E2E test
    jest.setTimeout(30000)
    it('Passess', (done) => {
      newman.run({
        collection: require('../postman/object_storage.postman_collection.json'),
        environment: require('../postman/dev.postman_environment.json'),
        reporters: 'cli',
        timeout: 20000,
        timeoutRequest: 3000,
        timeoutScript: 3000,
        requestAgents: {
          http: agent
        }
      }).on('done', (err, summary) => {
        if (err) {
          return done(err)
        }
        if (summary.error) {
          return done(summary.error)
        }
        if (summary.run.failures.length > 0) {
          return done(summary.run.failures)
        }
        done()
      })
    })
  })
  describe('Storage Status', () => {
    // increase time since this is E2E test
    jest.setTimeout(30000)
    it('Passess', (done) => {
      newman.run({
        collection: require('../postman/storage_status.postman_collection.json'),
        environment: require('../postman/dev.postman_environment.json'),
        reporters: 'cli',
        timeout: 20000,
        timeoutRequest: 3000,
        timeoutScript: 3000,
        requestAgents: {
          http: agent
        }
      }).on('done', (err, summary) => {
        if (err) {
          return done(err)
        }
        if (summary.error) {
          return done(summary.error)
        }
        if (summary.run.failures.length > 0) {
          return done(summary.run.failures)
        }
        done()
      })
    })
  })
})
