"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.send = exports.connection = void 0;
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
const baileys_1 = require("@whiskeysockets/baileys");
const pino_1 = __importDefault(require("pino"));
const boom_1 = require("@hapi/boom");
let sock;
const { session } = { session: 'baileys_auth_info' };
const store = (0, baileys_1.makeInMemoryStore)({
    logger: (0, pino_1.default)({ timestamp: () => `,"time":"${new Date().toJSON()}"` })
        .child({ level: 'silent', stream: 'store' })
});
async function connection() {
    const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)('baileys_auth_info');
    sock = (0, baileys_1.makeWASocket)({
        printQRInTerminal: true,
        auth: state,
        logger: (0, pino_1.default)({ level: 'error' }),
        shouldIgnoreJid: jid => (0, baileys_1.isJidBroadcast)(jid),
        emitOwnEvents: true,
        defaultQueryTimeoutMs: undefined
    });
    store.bind(sock.ev);
    // sock.multi = true
    sock.ev.on('connection.update', async (update) => {
        console.log(update);
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = new boom_1.Boom(lastDisconnect.error).output.statusCode;
            if (reason === baileys_1.DisconnectReason.badSession) {
                console.log(`Bad Session File, Please Delete ${session} and Scan Again`);
                sock.logout();
            }
            else if (reason === baileys_1.DisconnectReason.connectionClosed) {
                console.log('Connection closed, reconnecting....');
                await connection();
            }
            else if (reason === baileys_1.DisconnectReason.connectionLost) {
                console.log('Connection Lost from Server, reconnecting...');
                await connection();
            }
            else if (reason === baileys_1.DisconnectReason.connectionReplaced) {
                console.log('Connection Replaced, Another New Session Opened, Please Close Current Session First');
                sock.logout();
            }
            else if (reason === baileys_1.DisconnectReason.loggedOut) {
                console.log(`Device Logged Out, Please Delete ${session} and Scan Again.`);
                sock.logout();
            }
            else if (reason === baileys_1.DisconnectReason.restartRequired) {
                console.log('Restart Required, Restarting...');
                await connection();
            }
            else if (reason === baileys_1.DisconnectReason.timedOut) {
                console.log('Connection TimedOut, Reconnecting...');
                await connection();
            }
            else {
                sock.end(`Unknown DisconnectReason: ${reason}|${lastDisconnect.error}`);
            }
        }
        else if (connection === 'open') {
            console.log('opened connection');
            return;
        }
        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type === 'notify') {
                if (!messages[0].key.fromMe) {
                    const message = messages[0].message.extendedTextMessage.text;
                    const sender = messages[0].key.remoteJid;
                    await sock.readMessages([messages[0].key]);
                    if (!messages[0].key.fromMe && message.toLocaleLowerCase() === 'ping') {
                        await sock.sendMessage(sender, { text: 'Pong' }, { quoted: messages[0] });
                    }
                    else {
                        await sock.sendMessage('6289660408282@s.whatsapp.net', { text: `anda mengirimkan pesan ${message}` }, { quoted: messages[0] });
                    }
                }
            }
        });
    });
}
exports.connection = connection;
async function send(message, to) {
    await sock.sendMessage(`${to}@s.whatsapp.net`, { text: message });
}
exports.send = send;
