import express, { Express, Request, Response } from 'express'
import LocalAuth from 'whatsapp-web.js/src/authStrategies/LocalAuth.js';
import { Client } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'

import fs from 'fs'

fs.rmSync('./.wwebjs_auth/session-tes-1', { recursive: true, force: true })

const client = new Client({
    authStrategy: new LocalAuth({clientId: 'tes-1'}),
    puppeteer: { headless: true, args: ['--no-sandbox']}
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
    console.log(qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
    sendMessage()
    console.log(client.getState().then(t => console.log(t)));
});

function sendMessage() {
    // Number where you want to send the message.
    const number = "6289660408282";

    // Your message.
    const text = "Hey john";

    // Getting chatId from the number.
    // we have to delete "+" from the beginning and add "@c.us" at the end of the number.
    const chatId = number + "@c.us";

    // Sending message.
    client.sendMessage(chatId, text)
        .then(response => console.log(response))
}

client.on('message', () => sendMessage())

client.initialize()

const app: Express = express();
const port = 3000;

app.get('/', (req: Request, res: Response) => {
    sendMessage()

    console.log(req.query);
  res.json('oke')
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});