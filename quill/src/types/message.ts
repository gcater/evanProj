import type { AppRouter } from "@/trpc";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;

type Messages = RouterOutput["getFileMessages"]["messages"];

type OmitText = Omit<Messages[number], "text">;

interface ExtendedText {
  text: string | JSX.Element;
}

export type ExtendedMessage = OmitText & ExtendedText;
