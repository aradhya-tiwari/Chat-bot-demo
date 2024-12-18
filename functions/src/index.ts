import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { streamText, streamSSE } from 'hono/streaming'
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import { embeddingText } from '../data/cf-pricing'
import { Document } from "langchain/document";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { LanceDB } from "@langchain/community/vectorstores/lancedb";
import { env } from 'hono/adapter'
import * as dotenv from 'dotenv'
import { TextLoader } from "langchain/document_loaders/fs/text";
import { basicAuth } from 'hono/basic-auth'
import { connect } from "vectordb";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { app as train } from './routes/train'
import { app as answer } from './routes/answer'
import { app as gemini } from "./routes/gemini"
// import os from "node:os";


dotenv.config()

// type Bindings = {
//   OPENAI_KEY: string,
//     MY_BUCKET: R2Bucket
// }

const app = new Hono()
app.use('*', cors({
  origin: ["http://localhost:4321", "*"],
  credentials: true
}))
app.basePath('/api')
app.route('/trainn', train)
app.route('/answer', answer)
app.route("/chat_gemini", gemini)
let tbl = "table"



async function comp(c: any, next: any) {
  console.log(c.req.header('origin'))
  await next()
}

// app.use('*', basicAuth({
//   username: '123',
//   password: '123',
// })
// )

app.post('/', (c) => c.text("ok"))

app.get('/', async (c) => {

  const { OPENAI_KEY } = env<{ OPENAI_KEY: string }>(c)
  const chatModel = new ChatOpenAI({
    openAIApiKey: OPENAI_KEY,
    streaming: true,
    // maxTokens: 100
  });

  const prompt =
    ChatPromptTemplate.fromTemplate(`You are a chatbot answer only for context, provided context:

<context>
{context}
</context>

Question: {input}`);

  const documentChain = await createStuffDocumentsChain({
    llm: chatModel,
    prompt,
  });

  const retriever = vectorstore.asRetriever();

  const retrievalChain = await createRetrievalChain({
    combineDocsChain: documentChain,
    retriever,
  });

  let parser = new StringOutputParser()
  let streamm = await retrievalChain.invoke({ input: "what ia the price of cloudflare kv databaseb" })


  // let streamm = await chatModel.pipe(parser).stream("What is ")

  // return streamSSE(c, async (strm) => {
  //   let sm = "Wow"
  //   for await (let chunks of streamm) {
  //     console.log(chunks.answer)
  //     await strm.writeln(chunks.answer)
  //   }
  // })

  return c.json(streamm)
})




app.post("/chat", comp, async (c) => {
  console.log("Chatting...")
  const body = await c.req.parseBody()
  const query = (body["query"]) as string
  console.log("Ok")

  const { OPENAI_KEY } = env<{ OPENAI_KEY: string }>(c)
  const chatModel = new ChatOpenAI({
    openAIApiKey: OPENAI_KEY,
    streaming: true,
    maxTokens: 1000
  });
  const uri = './data/lancedb-train'
  const db = await connect(uri);
  const table = await db.openTable(tbl);

  const vectorStore = new LanceDB(new OpenAIEmbeddings({ openAIApiKey: OPENAI_KEY }), { table });
  // console.log(vectorStore)
  const retriever = vectorStore.asRetriever();
  //You are pricing bot tells about only pricing and no other text 
  const prompt =
    ChatPromptTemplate.fromTemplate(
      `
    You are a financial chatbot that tells user about quantitative and qualitative data about companies answers questions only from the given knowledge, 
    <context>
    {context}
    </context>
    
    Question: {input}
  `
    );

  const documentChain = await createStuffDocumentsChain({
    llm: chatModel,
    prompt,
  });

  let parser = new StringOutputParser()
  const retrievalChain = await createRetrievalChain({
    combineDocsChain: documentChain,
    retriever,
  });
  type car = {
    cata: number
  }
  console.log("--------------->" + query)
  let streamm = await retrievalChain.stream({ input: query })
  return streamText(c, async (strm) => {
    let sm = "Wow"
    for await (let chunks of streamm) {
      // console.log(chunks.answer)
      let ans = (chunks.answer) ? chunks.answer : "."
      await strm.write(ans)
    }
  })

  const resultOne = await vectorStore.similaritySearch("to whom", 1);
  console.log(resultOne);
  return c.json(streamm)



})

app.get("/chatGemini", async (c) => {

})

app.get('/r2', async (c) => {
  const { OPENAI_KEY } = env<{ OPENAI_KEY: string }>(c)
  const chatModel = new ChatOpenAI({
    openAIApiKey: OPENAI_KEY,
    streaming: true,
    // maxTokens: 100
  });
  const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_KEY })
  let vctr = await embeddings.embedQuery("Hello world")
  const db = await connect('./data/lancedb-train')
  const table = await db.openTable(tbl);
  // const query = await c.req.parseBody()
  // const files = query.files
  table.add([{ vector: await embeddings.embedQuery("Pricing of cloudflare vectorise is 0.04$ per million requests"), text: "Pricing of cloudflare vectorise is 0.04$ per million requests" }])
  console.log((vctr))
  return c.text("ok")
  // return c.json(query['files'])
  const splitter = new RecursiveCharacterTextSplitter({ separators: ['/n', '/n/n', "--X--", " ", ''] });
  const doc = new Document({ pageContent: embeddingText });
  const splitDocs = await splitter.splitDocuments([doc]);
  console.log(splitDocs);
})


app.get('/createTable', async (c) => {
  const uri = './data/lancedb-train'
  const db = await connect(uri);
  let schema = {};

  const table = await db.createTable(tbl, [
    { vector: Array(768), text: "vector", },
  ]);
  return c.text("done")
})
app.post('/train', async (c) => {

  const body = await c.req.parseBody()
  console.log("Entered")
  let dta: File | string = body['files'] as File
  let file = await dta.text()

  const db = await connect('./data/lancedb-train')


  const { OPENAI_KEY } = env<{ OPENAI_KEY: string }>(c)
  const splitter = new RecursiveCharacterTextSplitter({ separators: ['/n', '/n/n', "--X--", " ", ''] });
  // const doc = new Document({ pageContent: embeddingText });
  const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_KEY })
  // const loader = new TextLoader("./data/cf-ricing.txt");
  // const docs = await loader.load();
  const splitDocs = await splitter.splitText(file);

  // const table = await db.createTable(tbl, [
  //   { vector: Array(1536), text: "sample", },
  // ]);

  const table = await db.openTable(tbl);
  // table.add([{
  //   vector: await splitDocs.map(embs => embeddings.embedQuery(embs)), text: splitDocs.map(embs => (embs))
  // }])
  // await splitDocs.map(embs => table.add([{ vector: embeddings.embedQuery(embs), text: embs }]))

  const vectorstore = await LanceDB.fromTexts(splitDocs.map(embs => embs), [Array(splitDocs.length).map(e => { id: e })], embeddings, { table })

  // const vectorstore = await LanceDB.fromDocuments(
  // docs,
  //   embeddings,
  //   { table }
  // );

  // console.log(vectorstore)
  // const resultOne = await vectorstore.similaritySearch("Summarize", 1);
  return c.json({ res: "ok", sample: table })
})

app.get('/faiss', async (c) => {

  const { OPENAI_KEY } = env<{ OPENAI_KEY: string }>(c)

  const vectorStore = await FaissStore.fromTexts(
    ["Hello world", "Bye bye", "hello nice world"],
    [{ id: 2 }, { id: 1 }, { id: 3 }],
    new OpenAIEmbeddings({ openAIApiKey: OPENAI_KEY })
  );

  const resultOne = await vectorStore.similaritySearch("hello world", 1);
  console.log(resultOne);

})

app.get('/db', async (c) => {
  const db = await connect('./data/lancedb-train')
  db.createTable
  const table = await db.openTable(tbl);
  return c.json({ l: table.countRows })
})
// export default app

serve({
  fetch: app.fetch,
  port: 3000
}, () => console.log("Listening..."))


