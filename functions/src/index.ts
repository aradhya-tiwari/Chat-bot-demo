import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ChatOpenAI } from "@langchain/openai";

type Bindings = {
  OPENAI_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()



app.use('*', cors({
  origin: ["http://localhost:4321", "*"],
  credentials: true,

}))

app.get('/', (c) => {

  const chatModel = new ChatOpenAI({
    openAIApiKey: c.env.OPENAI_KEY
  });

  return c.html("")
})

export default app


