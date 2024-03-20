import { db } from "@/db";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Index } from "@upstash/vector";
import type { NextRequest } from "next/server";

import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import { openai } from "@/lib/openai";

import { OpenAIStream, StreamingTextResponse } from "ai";

export const POST = async (req: NextRequest): Promise<Response> => {
  // enpoint for asking a question to pdf file

  const body = await req.json();

  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (user?.id == null) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: userId } = user;

  const { fileId, message } = SendMessageValidator.parse(body);

  console.log(fileId, message);
  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  });

  console.log("HELLLOOOO I AM AT ROUTE");
  if (file == null) return new Response("No file found", { status: 404 });

  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      userId,
      fileId,
    },
  });

  // 1: vectorize message
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });

  const vectorStore = await UpstashVectorStore.fromExistingIndex(embeddings, {
    index,
  });

  const results = await vectorStore.similaritySearch(message, 4);

  const prevMessages = await db.message.findMany({
    where: {
      fileId,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 6,
  });

  const formattedPrevMessages = prevMessages.map((msg) => ({
    role: (msg.isUserMessage as boolean)
      ? ("user" as const)
      : ("assistant" as const),
    content: msg.text,
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.",
      },
      {
        role: "user",
        content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  
  ${formattedPrevMessages
    .map((message) => {
      if (message.role === "user") return `User: ${message.content}\n`;
      return `Assistant: ${message.content}\n`;
    })
    .join("")}
  
  \n----------------\n
  
  CONTEXT:
  ${results.map((r) => r.pageContent).join("\n\n")}
  
  USER INPUT: ${message}`,
      },
    ],
  });

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      await db.message.create({
        data: {
          text: completion,
          isUserMessage: false,
          fileId,
          userId,
        },
      });
    },
  });

  return new StreamingTextResponse(stream);
};
