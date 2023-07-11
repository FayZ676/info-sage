import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession } from "@auth0/nextjs-auth0";
import { ObjectId } from "mongodb";
import { v4 as uuid } from "uuid";
import clientPromise from "lib/mongodb";
import { streamReader } from "openai-edge-stream";

import { ChatSidebar } from "components/ChatSidebar";
import { Message } from "components/Message";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot } from "@fortawesome/free-solid-svg-icons";

export default function ChatPage({ chatId, title, messages = [] }) {
  // State variables
  const [messageText, setMessageText] = useState("");
  const [incomingMessage, setIncomingMessage] = useState("");
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [newChatId, setNewChatId] = useState(null);
  const [fullMessage, setFullMessage] = useState("");
  const [fullMetadata, setFullMetadata] = useState([]);
  const [chatIdInGeneration, setChatIdInGeneration] = useState(chatId);
  const [selectedNamespace, setSelectedNamespace] = useState("");

  const router = useRouter();

  const routeHasChanged = chatId != chatIdInGeneration;

  // USE EFFECTS
  // ---------------------------------------------------------------------------
  // Save the new message to the new chat messages state
  useEffect(() => {
    if (!routeHasChanged && !generatingResponse && fullMessage) {
      setNewChatMessages((prev) => [
        ...prev,
        {
          _id: uuid(),
          role: "assistant",
          content: fullMessage,
        },
      ]);
      setFullMessage("");
    }
  }, [generatingResponse, fullMessage, routeHasChanged]);

  // Reset the values of the new chat messages state when the chat id changes
  useEffect(() => {
    setNewChatMessages([]);
    setNewChatId(null);
  }, [chatId]);

  // Redirect to the new chat page when the response is finished generating
  useEffect(() => {
    if (!generatingResponse && newChatId) {
      setNewChatId(null);
      router.push(`/chat/${newChatId}`);
    }
  }, [newChatId, generatingResponse, router]);
  // ---------------------------------------------------------------------------

  // HANDLE CHAT SUBMISSION
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneratingResponse(true);
    setChatIdInGeneration(chatId);

    // Update newChatMessages state with user's message
    setNewChatMessages((prev) => [
      ...prev,
      {
        _id: uuid(),
        role: "user",
        content: messageText,
      },
    ]);
    setMessageText("");

    // If the selectedNamespace is empty, send the message to the assistant
    if (selectedNamespace === "") {
      const response = await fetch("/api/chat/sendMessage", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ chatId, message: messageText }),
      });
      const data = response.body;
      if (!data) {
        return;
      }
      const reader = data.getReader();
      let content = "";
      await streamReader(reader, (message) => {
        // Update incomingMessage state with assistant's message
        if (message.event === "newChatId") {
          setNewChatId(message.content);
        } else {
          setIncomingMessage((s) => `${s}${message.content}`);
          content = content + message.content;
        }
      });
      setFullMessage(content);
    }
    // If a selectedNamespace is selected, query the selectedNamespace instead
    else {
      const response = await fetch("/api/query/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          message: messageText,
          selectedNamespace: selectedNamespace,
        }),
      });
      const responseData = await response.json();
      if (!responseData) {
        return;
      }
      console.log("RESPONSE DATA: ", responseData);
      console.log("RESPONSE MESSAGE: ", responseData.message);
      if (responseData.newChatId) {
        setNewChatId(responseData.newChatId);
      }
      setFullMessage(responseData.message);
      const rawMetadata = responseData.metadata;
      const metadataList = rawMetadata.map((item) => item.metadata.source);
      setFullMetadata(metadataList);
    }

    // setFullMessage(content);
    setIncomingMessage("");
    setGeneratingResponse(false);
  };
  // ---------------------------------------------------------------------------

  // Combine messages and newChatMessages
  const allMessages = [...messages, ...newChatMessages];

  return (
    <>
      <Head>
        <title>New Chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr]">
        <ChatSidebar
          chatId={chatId}
          selectedNamespace={selectedNamespace}
          setSelectedNamespace={setSelectedNamespace}
        />
        <div className="flex flex-col overflow-hidden bg-gray-700 text-white">
          <div className="flex flex-1 flex-col-reverse overflow-scroll text-white">
            {!allMessages.length && !incomingMessage && (
              <div className="m-auto flex items-center justify-center text-center">
                <div>
                  {" "}
                  <FontAwesomeIcon
                    icon={faRobot}
                    className="text-6xl text-emerald-200"
                  />
                  <h1 className="mt-2 text-4xl font-bold text-white/50">
                    Ask me a question
                  </h1>
                </div>
              </div>
            )}
            {!!allMessages.length && (
              <div className="mb-auto">
                {allMessages.map((message) => (
                  <Message
                    key={message.id}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                {!!incomingMessage && !routeHasChanged && (
                  <Message role="assistant" content={incomingMessage} />
                )}
                {!!incomingMessage && !!routeHasChanged && (
                  <Message
                    role="warning"
                    content="Please wait for other responses to complete streaming."
                  />
                )}
              </div>
            )}
          </div>
          <div className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset className="flex gap-2" disabled={generatingResponse}>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={generatingResponse ? "" : "Send a message ..."}
                  className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-500 focus:outline focus:outline-emerald-500"
                />
                <button type="submit" className="btn">
                  Send
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = async (ctx) => {
  const chatId = ctx.params?.chatId?.[0] || null;
  if (chatId) {
    let objectId;

    try {
      objectId = new ObjectId(chatId);
    } catch (e) {
      return {
        redirect: {
          destination: "/chat",
        },
      };
    }

    const { user } = await getSession(ctx.req, ctx.res);
    const client = await clientPromise;
    const db = await client.db("ChattyPette");
    const chat = await db.collection("chats").findOne({
      userId: user.sub,
      _id: objectId,
    });

    if (!chat) {
      return {
        redirect: {
          destination: "/chat",
        },
      };
    }

    return {
      props: {
        chatId,
        title: chat.title,
        messages: chat.messages.map((message) => ({
          ...message,
          _id: uuid(),
        })),
      },
    };
  }
  return {
    props: {},
  };
};
