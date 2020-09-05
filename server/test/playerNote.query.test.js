const assert = require('assert')
const { unparse } = require('uuid-parse')
const supertest = require('supertest')
const createApp = require('../app')
const { createSetup, getAuthPassword } = require('./lib')
const { createPlayer, createNote } = require('./fixtures')

describe('Query player note', () => {
  let setup
  let request

  beforeAll(async () => {
    setup = await createSetup()
    const app = await createApp({ ...setup, disableUI: true })

    request = supertest(app.callback())
  }, 20000)

  afterAll(async () => {
    await setup.teardown()
  }, 20000)

  test('should resolve all fields', async () => {
    const { config: server, pool } = setup.serversPool.values().next().value
    const cookie = await getAuthPassword(request, 'admin@banmanagement.com')

    const player = createPlayer()
    const actor = createPlayer()
    const note = createNote(player, actor)

    await pool('bm_players').insert([player, actor])
    await pool('bm_player_notes').insert(note)

    const { body, statusCode } = await request
      .post('/graphql')
      .set('Cookie', cookie)
      .set('Accept', 'application/json')
      .send({
        query: `query playerBan {
        playerNote(id:"1", serverId: "${server.id}") {
          id
          message
          created
          actor {
            id
            name
          }
          acl {
            update
            delete
            yours
          }
        }
      }`
      })

    assert.strictEqual(statusCode, 200)

    assert(body)
    assert(body.data)
    assert.deepStrictEqual(body.data.playerNote,
      {
        id: '1',
        message: note.message,
        created: note.created,
        actor: { id: unparse(actor.id), name: actor.name },
        acl: { delete: true, update: true, yours: false }
      })
  })
})
