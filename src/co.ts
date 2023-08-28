/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import {
  makeWASocket,
  useMultiFileAuthState,
  isJidBroadcast,
  makeInMemoryStore,
  DisconnectReason
} from '@whiskeysockets/baileys'
import pino from 'pino'
import { Boom } from '@hapi/boom'

let sock: any
const { session } = { session: 'baileys_auth_info' }

const store = makeInMemoryStore({
  logger: pino({ timestamp: () => `,"time":"${new Date().toJSON()}"` })
    .child({ level: 'silent', stream: 'store' })
})

export async function connection (): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info')

  sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    logger: pino({ level: 'error' }),
    shouldIgnoreJid: jid => isJidBroadcast(jid),
    emitOwnEvents: true,
    defaultQueryTimeoutMs: undefined
  })

  store.bind(sock.ev)

  // sock.multi = true

  sock.ev.on('connection.update', async (update: any) => {
    console.log(update)
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect.error).output.statusCode
      if (reason === DisconnectReason.badSession) {
        console.log(`Bad Session File, Please Delete ${session} and Scan Again`)
        sock.logout()
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log('Connection closed, reconnecting....')
        await connection()
      } else if (reason === DisconnectReason.connectionLost) {
        console.log('Connection Lost from Server, reconnecting...')
        await connection()
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log('Connection Replaced, Another New Session Opened, Please Close Current Session First')
        sock.logout()
      } else if (reason === DisconnectReason.loggedOut) {
        console.log(`Device Logged Out, Please Delete ${session} and Scan Again.`)
        sock.logout()
      } else if (reason === DisconnectReason.restartRequired) {
        console.log('Restart Required, Restarting...')
        await connection()
      } else if (reason === DisconnectReason.timedOut) {
        console.log('Connection TimedOut, Reconnecting...')
        await connection()
      } else {
        sock.end(`Unknown DisconnectReason: ${reason}|${lastDisconnect.error}`)
      }
    } else if (connection === 'open') {
      console.log('opened connection'); return
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('messages.upsert', async ({ messages, type }: { messages: any[], type: string }) => {
      if (type === 'notify') {
        if (!messages[0].key.fromMe) {
          const message: string = messages[0].message.extendedTextMessage.text
          const sender = messages[0].key.remoteJid

          await sock.readMessages([messages[0].key])

          if (!messages[0].key.fromMe && message.toLocaleLowerCase() === 'ping') {
            await sock.sendMessage(sender, { text: 'Pong' }, { quoted: messages[0] })
          } else {
            await sock.sendMessage('6289660408282@s.whatsapp.net', { text: `anda mengirimkan pesan ${message}` }, { quoted: messages[0] })
          }
        }
      }
    })
  })
}

export async function send (message: string, to: string): Promise<any> {
  await sock.sendMessage(`${to}@s.whatsapp.net`, { text: message })
}
