import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { PDFLoader } from "langchain/document_loaders/fs/pdf";
// import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from "@langchain/openai";

import { Index } from "@upstash/vector";
//import { UpstashVectorStore } from "upstash";
import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";

// import { PineconeStore } from "@langchain/pinecone";
// import {PineconeVectorStore} from "@langchain/pinecone";
// import {pinecone} from "@/lib/pinecone"
import { getPineconeClient } from "@/lib/pinecone";
const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter: FileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();

      if (!user || !user.id) throw new Error("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const createdFile = await db.file.create({
        data: {
          key: file.key,
          name: file.name,
          userId: metadata.userId,
          url: `https://utfs.io/f/${file.key}`,
          uploadStatus: "PROCESSING",
        },
      });

      try {
        const response = await fetch(`https://utfs.io/f/${file.key}`);
        const blob = await response.blob();

        const loader = new PDFLoader(blob);

        const pageLevelDocs = await loader.load();

        const pagesAmt = pageLevelDocs.length;
        //console.log(pageLevelDocs)
        //vecotrize and index entire docu;

        const index = new Index({
          url: process.env.UPSTASH_VECTOR_REST_URL as string,
          token: process.env.UPSTASH_VECTOR_REST_TOKEN as string,
        });

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY as string,
        });

        const upstashVector = new UpstashVectorStore(embeddings, {
          index,
        });
        try {
          await upstashVector.addDocuments(pageLevelDocs);
        } catch (err) {
          console.error("Error generating or indexing embeddings:", err);
        }

        // Waiting vectors to be indexed in the vector store.
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const queryResult = await upstashVector.similaritySearchWithScore(
          "The company and influencer agree to enter into a partnership",
          1
        );
        //console.log("queryResult: ", queryResult);

        await db.file.update({
          data: {
            uploadStatus: "SUCCESS",
          },
          where: {
            id: createdFile.id,
          },
        });
      } catch (err) {
        console.log("there was an error", err);

        await db.file.update({
          data: {
            uploadStatus: "FAILED",
          },
          where: {
            id: createdFile.id,
          },
        });
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
