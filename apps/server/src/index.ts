import { existsSync } from 'node:fs'
import process from 'node:process'
import cors from 'cors'
import express from 'express'

// Load .env from the package directory if present (Node >= 20.12).
if (existsSync('.env')) {
  process.loadEnvFile('.env')
}

const app = express()
const port = Number(process.env.SERVER_PORT ?? process.env.PORT ?? 3000)

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/hello', (req, res) => {
  const name = typeof req.query.name === 'string' ? req.query.name : 'world'
  res.json({ message: `Hello, ${name}!` })
})

app.listen(port, () => {
  // eslint-disable-next-line no-console -- intentional startup notice on stdout
  console.log(`server listening on http://localhost:${port}`)
})
