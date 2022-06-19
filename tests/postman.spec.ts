/* eslint-disable no-undef */

import App from '../src/app'
import newman from 'newman'
import { Agent } from 'http'
import axios from 'axios'
import FormData from 'form-data'
import path from 'path'

describe('Postman collections', () => {
  let app: App
  let agent: Agent

  async function uploadFile (area: string, id: string, fileName: string, buffer: Buffer) : Promise<any> {
    const formData = new FormData()
    formData.append('file', buffer, fileName)
    await axios.put(`${process.env.SERVER_URL || 'http://localhost:3000'}/api/objects/v1/${area}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      auth: {
        username: 'admin',
        password: 'admin'
      }
    })
  }

  async function deleteFile (area: string, id: string) : Promise<any> {
    await axios.delete(`${process.env.SERVER_URL || 'http://localhost:3000'}/api/objects/v1/${area}/${id}`, {
      auth: {
        username: 'admin',
        password: 'admin'
      }
    })
  }

  beforeAll(async () => {
    if (!process.env.OBJ_STORE_SKIP_APP_LAUNCH) {
      agent = new Agent()
      console.log('Starting app for postman tests')
      app = new App({
        serverOptions: {
          logger: true
        },
        port: 3000,
        host: 'localhost'
      })
      await app.start()
    }

    // populate stuff for postman
    // need the following files created
    const dummyFileContents = {
      test: 'test'
    }

    const jStr = JSON.stringify(dummyFileContents)
    const blob = Buffer.from(jStr)
    try {
      // postman_test_list_upload
      await uploadFile('default', 'postman_test_list_upload', 'postman_test.json', blob)
      // postman_test_download
      await uploadFile('default', 'postman_test_download', 'postman_test.json', blob)
      // postman_test_upload
      await uploadFile('default', 'postman_test_upload', 'postman_test.json', blob)
      // postman_test_delete
      await uploadFile('default', 'postman_test_delete', 'postman_test.json', blob)
    } catch (err) {
      console.error(`Error while creating test files ${err}`)
    }
  })
  afterAll(async () => {
    console.log('Stopping app for postman tests')
    try {
      await deleteFile('default', 'postman_test_list_upload')
      await deleteFile('default', 'postman_test_download')
      await deleteFile('default', 'postman_test_upload')
      await deleteFile('default', 'postman_test_delete')
    } catch (err) {
      console.error(`Error while cleaning up test resources: ${err}`)
    }
    if (!process.env.OBJ_STORE_SKIP_APP_LAUNCH) {
      await app.stop()
      agent.destroy()
    }
  })
  describe('Object Storage', () => {
    const workingDir = path.resolve(process.cwd(), 'postman')
    console.log(`Using ${workingDir} for postman working directory`)
    // increase time since this is E2E test
    jest.setTimeout(30000)
    it('Passess', (done) => {
      newman.run({
        collection: require('../postman/object_storage.postman_collection.json'),
        environment: require(`../postman/${process.env.OBJ_STORE_PM_ENV || 'dev'}.postman_environment.json`),
        reporters: 'cli',
        timeout: 20000,
        timeoutRequest: 3000,
        timeoutScript: 3000,
        workingDir,
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
        environment: require(`../postman/${process.env.OBJ_STORE_PM_ENV || 'dev'}.postman_environment.json`),
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
