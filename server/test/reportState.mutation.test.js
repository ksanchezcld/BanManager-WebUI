const assert = require('assert')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword, getAccount, setTempRole } = require('./lib')
const { createPlayer, createReport } = require('./fixtures')

describe('Mutation reportState', () => {
  let setup
  let request

  beforeAll(async () => {
    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 20000)

  afterAll(async () => {
    await setup.teardown()
  })

  test('should error if unauthenticated', async () => {
    const { config: server } = setup.serversPool.values().next().value
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Accept', 'application/json')
      .send({
        query: `mutation reportState {
        reportState(state: 1, serverId: "${server.id}", report: 1) {
          id
          state {
            id
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message,
      'You do not have permission to perform this action, please contact your server administrator')
  })

  test('should allow update.state.any', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, player)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'update.state.any', 'view.any')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation reportState {
        reportState(state: 2, serverId: "${server.id}", report: ${inserted}) {
          id
          state {
            id
          }
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.reportState.state.id, '2')
  })

  test('should allow update.state.own', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, account)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'update.state.own')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation reportState {
        reportState(state: 2, serverId: "${server.id}", report: ${inserted}) {
          id
          state {
            id
          }
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.reportState.state.id, '2')
  })

  test('should allow update.state.assigned', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(player, account)

    report.assignee_id = account.id

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'update.state.assigned')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation reportState {
        reportState(state: 2, serverId: "${server.id}", report: ${inserted}) {
          id
          state {
            id
          }
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.reportState.state.id, '2')
  })

  test('should allow update.state.reported', async () => {
    const cookie = await getAuthPassword(request, 'user@banmanagement.com')
    const account = await getAccount(request, cookie)
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()
    const report = createReport(account, player)

    await pool('bm_players').insert(player)

    const [inserted] = await pool('bm_player_reports').insert(report, ['id'])
    const role = await setTempRole(setup.dbPool, account, 'player.reports', 'update.state.reported')

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation reportState {
        reportState(state: 2, serverId: "${server.id}", report: ${inserted}) {
          id
          state {
            id
          }
        }
      }`
      })

    await role.reset()

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.strictEqual(body.data.reportState.state.id, '2')
  })

  test('should error if report does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config: server, pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation reportState {
        reportState(state: 2, serverId: "${server.id}", report: 123123) {
          id
          state {
            id
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Report 123123 does not exist')
  })

  test('should error if server does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { pool } = setup.serversPool.values().next().value
    const player = createPlayer()

    await pool('bm_players').insert(player)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation reportState {
        reportState(state: 2, serverId: "3", report: 3) {
          id
          state {
            id
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Server does not exist')
  })

  test('should error if state does not exist', async () => {
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')
    const { config } = setup.serversPool.values().next().value
    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `mutation reportState {
        reportState(state: 2123, serverId: "${config.id}", report: 3) {
          id
          state {
            id
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert.strictEqual(body.errors[0].message, 'Report State 2123 does not exist')
  })
})
