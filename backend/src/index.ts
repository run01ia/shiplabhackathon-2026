import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello from Hono!')
})

const port = 3000
console.log(`Port: ${port}`)

serve({
  fetch: app.fetch,
  port
})
