import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { streamText, streamSSE } from 'hono/streaming'
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { embeddingText } from '../data/cf-pricing'
import { Document } from "langchain/document";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate } from "@langchain/core/prompts";



type Bindings = {
  OPENAI_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()



app.use('*', cors({
  origin: ["http://localhost:4321", "*"],
  credentials: true,

}))

app.get('/', async (c) => {

  const chatModel = new ChatOpenAI({
    openAIApiKey: c.env.OPENAI_KEY,
    streaming: true,
    // maxTokens: 100
  });

  const splitter = new RecursiveCharacterTextSplitter({ separators: ['/n', '/n/n', "--X--", " ", ''] });
  const doc = new Document({ pageContent: embeddingText });
  const splitDocs = await splitter.splitDocuments([doc]);
  const embeddings = new OpenAIEmbeddings({ openAIApiKey: c.env.OPENAI_KEY })
  const vectorstore = await MemoryVectorStore.fromDocuments(
    splitDocs,
    embeddings
  );


  const prompt =
    ChatPromptTemplate.fromTemplate(`You are a chatbot for pricing only answer provided in context, provided context:

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
  let streamm = await retrievalChain.invoke({ input: "what is the pricing of d1  tell me in a freindly tone" })


  // let streamm = await chatModel.pipe(parser).stream("hey there, pls tell me an indian styled joke in hinglish")

  // return streamSSE(c, async (strm) => {
  //   let sm = "Wow"
  //   for await (let chunks of streamm) {
  //     console.log(chunks.answer)
  //     await strm.writeln(chunks.answer)
  //   }
  // })

  return c.json(streamm)
})

export default app


