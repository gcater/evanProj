"use client"
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
// import Link from "next/link";
import React, { useState } from "react";
import { api } from "~/utils/api";
import {Button, useDragAndDrop, Item, ListView, useListData, defaultTheme, Provider} from '@adobe/react-spectrum';
import type {TextDropItem} from '@adobe/react-spectrum';
import {Text} from '@adobe/react-spectrum';
//import Folder from '@spectrum-icons/illustrations/Folder';


export default function Home() {
  return (
    <>
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
        <TaskManager/>
        <App/>
       

      </main>
    </>
  );
}

function App() {
  return (
    <Provider theme={defaultTheme}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <DraggableList/>
        <DroppableList/>
      </div>
      <Button
        variant="accent"
        onPress={() => alert('Hey there!')}
      >
        Hello React Spectrum!
      </Button>
    </Provider>
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



const TaskManager: React.FC = () => {
  const { data: sessionData } = useSession();
  const [task, setTask] = useState(""); // State to hold the input value

  // Fetch tasks
  const { data: tasks, refetch: refetchTasks } = api.task.getAll.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );

  // Create task mutation
  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      console.log(tasks)
      void refetchTasks(); // Refetch tasks after a successful creation
    },
  });

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTask(event.target.value);
  };

  // Handle submit
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void createTask.mutate({
      title: task,
    });
    setTask(""); // Clear input after submission
  };

  // Delete task mutation
  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => {
      void refetchTasks(); // Refetch tasks after a successful deletion
    },
  });

  // Handle delete
  const handleDelete = (taskId: string) => {
    void deleteTask.mutate({
      id: taskId,
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Task"
          value={task}
          onChange={handleInputChange}
        />
        <button type="submit">Submit</button>
      </form>
      <div>
        {tasks?.map((task) => (
          <div key={task.id}>
            <span>{task.title}</span>
            <button style={{ marginLeft: '10px' }} onClick={() => handleDelete(task.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};




interface ListItem {
  id: string;
  type: string;
  name: string;
}

const DraggableList: React.FC = () => {
  const list = useListData<ListItem>({
    initialItems: [
      { id: 'a', type: 'file', name: 'Adobe Photoshop' },
      { id: 'b', type: 'file', name: 'Adobe XD' },
      { id: 'c', type: 'file', name: 'Adobe Dreamweaver' },
      { id: 'd', type: 'file', name: 'Adobe InDesign' },
      { id: 'e', type: 'file', name: 'Adobe Connect' },
    ],
  });

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => Array.from(keys).map((key) => {
      const item = list.getItem(key.toString());
      return { 'adobe-app': JSON.stringify(item) };
    }),

    onDragEnd: (e) => {
      if (e.dropOperation === 'move') {
        list.remove(...e.keys);
      }
    },
  });

  return (
    <ListView
      aria-label="Draggable list view example"
      width="size-3600"
      height="size-3600"
      selectionMode="multiple"
      items={list.items}
      dragAndDropHooks={dragAndDropHooks}
    >
      {(item) => (
        <Item textValue={item.name}>
          {item.name}
        </Item>
      )}
    </ListView>
  );
};
interface ProcessedItem {
  id: string;
  type: string;
  name: string;
  childNodes?: ProcessedItem[];
  // include other properties as per your data structure
}

function DroppableList() {
  const list = useListData({
    initialItems: [
      { id: 'f', type: 'file', name: 'Adobe AfterEffects' },
      { id: 'g', type: 'file', name: 'Adobe Illustrator' },
      { id: 'h', type: 'file', name: 'Adobe Lightroom' },
      { id: 'i', type: 'file', name: 'Adobe Premiere Pro' },
      { id: 'j', type: 'file', name: 'Adobe Fresco' },
      { id: 'k', type: 'folder', name: 'Apps', childNodes: [] }
    ]
  });

  const { dragAndDropHooks } = useDragAndDrop({
    acceptedDragTypes: ['adobe-app'],
    shouldAcceptItemDrop: (target) => !!list.getItem(target.key).childNodes,
    onInsert: (e) => {
      const {
        items,
        target
      } = e;

      items.forEach((item: TextDropItem) => {
        item.getText('adobe-app').then(text => {
          const processedItem = JSON.parse(text) as ProcessedItem;

          if (target.dropPosition === 'before') {
            list.insertBefore(target.key, processedItem);
          } else if (target.dropPosition === 'after') {
            list.insertAfter(target.key, processedItem);
          }
        }).catch(error => {
          console.error("An error occurred:", error);
        });
      });
    },
    onItemDrop: (e) => {
      const {
        items,
        target
      } = e;

      items.forEach((item: TextDropItem) => {
        item.getText('adobe-app').then(text => {
          const processedItem = JSON.parse(text) as ProcessedItem;
          const targetItem = list.getItem(target.key) as ProcessedItem;

          list.update(target.key, {
            ...targetItem,
            childNodes: [...targetItem.childNodes, processedItem]
          });
        }).catch(error => {
          console.error("An error occurred:", error);
        });
      });
    }
  });

  return (
    <ListView
      aria-label="Droppable list view example"
      width="size-3600"
      height="size-3600"
      selectionMode="multiple"
      items={list.items}
      dragAndDropHooks={dragAndDropHooks}
    >
      {(item) => (
        <Item textValue={item.name} hasChildItems={item.type === 'folder'}>
          
          <Text>{item.name}</Text>
          {item.type === 'folder' &&
            (
              <Text slot="description">
                {`contains ${item.childNodes.length} dropped item(s)`}
              </Text>
            )}
        </Item>
      )}
    </ListView>
  );
}