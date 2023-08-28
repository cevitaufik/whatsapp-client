/* eslint-disable @typescript-eslint/no-misused-promises */
import express, { type Express, type Request, type Response } from 'express'
import { send, connection } from './co'
import bodyParser from 'body-parser'

const app: Express = express()
const port = 3000

app.use(bodyParser.json())

app.get('/', (req: Request, res: Response) => {
  res.json('oke')
})

app.post('/send', async (req: Request, res: Response) => {
  await send(req.body.message, req.body.to)
    .then(() => res.json('oke'))
})

// eslint-disable-next-line @typescript-eslint/no-floating-promises
connection()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`)
    })
  })
