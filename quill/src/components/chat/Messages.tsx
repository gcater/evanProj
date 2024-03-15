import { trpc } from "@/app/_trpc/client";

interface MessagesProps {
  fileId: string;
}

const Messages = ({ fileId }: MessagesProps) => {
  const {} = trpc;
  return <div></div>;
};

export default Messages;
