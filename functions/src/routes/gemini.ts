import { Hono } from "hono";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { connect } from "vectordb";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { LanceDB } from "@langchain/community/vectorstores/lancedb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { streamText } from "hono/streaming";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "hono/adapter";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

let tbl = "table"

const app = new Hono()
    .post("/", async (c) => {
        const { GEMINI_KEY } = env(c)
        const model = new ChatGoogleGenerativeAI({
            model: "gemini-pro",
            maxOutputTokens: 2048,
            apiKey: GEMINI_KEY as string,
            streaming: true
        });
        const uri = './data/lancedb-train'
        const db = await connect(uri);
        const table = await db.openTable(tbl);
        const vectorStore = new LanceDB(new GoogleGenerativeAIEmbeddings({ apiKey: GEMINI_KEY as string, modelName: 'embedding-001' }), { table });
        const retriever = vectorStore.asRetriever();

        const prompt =
            ChatPromptTemplate.fromTemplate(`
        You are a financial chatbot that tells user about quantitative and qualitative data about companies , 
        <context>
        {context}
        </context>
        
        Question: {input}`
            );


        const documentChain = await createStuffDocumentsChain({
            llm: model,
            prompt,
        });

        const retrievalChain = await createRetrievalChain({
            combineDocsChain: documentChain,
            retriever,
        });
        console.log(retrievalChain)

        const body = await c.req.parseBody()
        const query = (body["query"]) as string

        let streamm = await retrievalChain.stream({ input: query })
        return streamText(c, async (strm) => {
            let sm = "Wow"
            for await (let chunks of streamm) {
                // console.log(chunks.answer)
                let ans = (chunks.answer) ? chunks.answer : "."
                await strm.write(ans)
            }
        })

    })
    .get("/", async (c) => {
        const { GEMINI_KEY } = env(c)
        console.log("KEYYYYYY", GEMINI_KEY)
        const genAI = new GoogleGenerativeAI(GEMINI_KEY as string);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", });

        const prompt = "Explain how AI works";

        const result = await model.generateContent(prompt);
        console.log(result.response.text());

        return c.text(result.response.text())
    })
    .post('/train', async (c) => {
        const { GEMINI_KEY } = env(c)
        const body = await c.req.parseBody()
        console.log("Entered")
        let dta: File | string = body['files'] as File
        let file = await dta.text()

        const db = await connect('./data/lancedb-train')


        const { OPENAI_KEY } = env<{ OPENAI_KEY: string }>(c)
        const splitter = new RecursiveCharacterTextSplitter({ separators: ['/n', '/n/n', "--X--", " ", ''] });
        // const doc = new Document({ pageContent: embeddingText });
        const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: GEMINI_KEY as string, model: "text-embedding-004" })
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
        console.log(vectorstore)
        // const vectorstore = await LanceDB.fromDocuments(
        // docs,
        //   embeddings,
        //   { table }
        // );

        // console.log(vectorstore)
        // const resultOne = await vectorstore.similaritySearch("Summarize", 1);
        console.log("done")
        return c.json({ res: "ok", sample: table })
    })
export { app } 