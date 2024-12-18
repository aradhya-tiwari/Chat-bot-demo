import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { LanceDB } from "@langchain/community/vectorstores/lancedb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
// import * as fs from "node:fs/promises";
// import * as  path from "path";
// import * as os from "os";
import { connect } from "vectordb";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import * as dotenv from 'dotenv';
import { env } from 'hono/adapter';

dotenv.config()
console.log()
export const app = new Hono()

let table = "zeel"
app.get('/', async (c) => {
    const { OPENAI_KEY } = env<{ OPENAI_KEY: string }>(c)




    // Create docs with a loader
    // const loader = new TextLoader("./data/annual.pdf");

    const loader = new PDFLoader("./data/annual.pdf", {

        // splitPages: false,
    });

    const docs = await loader.load();


    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "lancedbb-"));
    const db = await connect(dir);
    const table = await db.createTable("vectors", [
        { vector: Array(1536), text: "sample", source: "a" },
    ]);
    console.log(docs)
    const vectorStore = await LanceDB.fromDocuments(
        docs,
        new OpenAIEmbeddings({
            openAIApiKey: OPENAI_KEY
            // maxTokens: 1000
        }),
        { table }
    );

    const resultOne = await vectorStore.similaritySearch("hello world", 1);
    console.log(resultOne);
    return c.text("yes The training Route Working")

})