import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
//import Link from "next/link";
import React from "react";
import { useRef } from "react";
import { api } from "~/utils/api";

export default function Home() {
  //const hello = api.post.hello.useQuery({ text: "from tRPC" });

  return (
    <div>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <header className="flex justify-between items-center p-5 bg-blue-500 text-white">
          <h1 className="text-xl">Welcome to T3 Checklist</h1>

          <AuthShowcase />
        </header>
        <Content />
      </main>
      
    </div>
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.post.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}
const Content: React.FC = () => {
  const { data: sessionData } = useSession();
  const { data: tasks, refetch: refetchTasks } = api.task.getAll.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );
  const createTask = api.task.create.useMutation();

  const inputRef = useRef<HTMLInputElement>(null);
  const handleAddTask = async () => {
    if (inputRef.current?.value) {
      await createTask.mutateAsync({
        title: inputRef.current.value,
      }).catch(error => {
        console.error("Failed to add task:", error);
      });
      refetchTasks();
      inputRef.current.value = ""; // Clear the input after adding the task
    }
  };

  return (
    <>
      <input ref={inputRef} type="text" placeholder="Type a task..." className="border-2 border-gray-300 p-2 rounded-md" />
      <button onClick={() =>handleAddTask} className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Add Task
      </button>
      <div>
        {tasks && tasks.length > 0 ? (
          <ul className="mt-4">
            {tasks.map((task, index) => (
              <li key={index} className="border-b border-gray-200 py-2">
                {task.title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4">No tasks added yet.</p>
        )}
      </div>
    </>
  );
};
