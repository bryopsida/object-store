/* eslint-disable no-undef */
import App, { AppOptions } from '../src/app'

function buildServerOptions (port: number) : AppOptions {
  return {
    serverOptions: {
      logger: false
    },
    port,
    host: 'localhost'
  }
}

describe('App', () => {
  it('Can Run', async () => {
    const app = new App(buildServerOptions(3500))
    expect(app.isRunning).toBe(false)
    await app.start()
    expect(app.isRunning).toBe(true)
    await app.stop()
    expect(app.isRunning).toBe(false)
  })
  it('Stops Idempotently', async () => {
    const app = new App(buildServerOptions(3501))
    expect(app.isRunning).toBe(false)
    await app.start()
    expect(app.isRunning).toBe(true)
    await app.stop()
    expect(app.isRunning).toBe(false)
    await app.stop()
    expect(app.isRunning).toBe(false)
  })
})
