import { Hono } from 'hono'
import { serve } from '@hono/node-server'

export const app = new Hono()
app.get('/', (c) => c.text("yes The answer Route Working"))
