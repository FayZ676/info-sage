export default async function handler(req, res) {
  try {
    const { chatId: chatIdFromParam, message, selectedNamespace } = req.body;

    // Validate message
    if (!message || typeof message !== "string" || message.length > 200) {
      return new Response(
        {
          message: "Message is required and must be less than 200 characters",
        },
        {
          status: 422,
        }
      );
    }

    let chatId = chatIdFromParam;
    let newChatId;
    let chatMessages = [];
    let response;

    // Chat already exists
    if (chatId) {
      // Add user's message to an existing chat
      const response = await fetch(
        `${req.headers.origin}/api/chat/addMessageToChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.cookie,
          },
          body: JSON.stringify({
            chatId,
            role: "user",
            content: message,
          }),
        }
      );
      const json = await response.json();
      chatMessages = json.chat.messages || [];
      // New Chat
    } else {
      // Create a new chat
      const response = await fetch(
        `${req.headers.origin}/api/chat/createNewChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.cookie,
          },
          body: JSON.stringify({
            message,
          }),
        }
      );
      const json = await response.json();
      chatId = json._id;
      newChatId = json._id;
      chatMessages = json.messages || [];
    }

    const messagesToInclude = [];
    chatMessages.reverse();
    let usedTokens = 0;
    for (let chatMessage of chatMessages) {
      const messageTokens = chatMessage.content.length / 4;
      usedTokens = usedTokens + messageTokens;
      if (usedTokens <= 2000) {
        messagesToInclude.push(chatMessage);
      } else {
        break;
      }
    }
    messagesToInclude.reverse();

    const query_response = await fetch(
      `http://127.0.0.1:8000/query?query=${message}&namespace=${selectedNamespace}&index=secondmuse`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      }
    );
    const json = await query_response.json();
    const query_message = json.message;
    const metadata = json.metadata;

    if (newChatId) {
      response = {
        newChatId: newChatId,
        message: query_message,
        metadata: metadata,
      };
    } else {
      response = {
        message: query_message,
        metadata: metadata,
      };
    }

    // Add assistant's message to the chat
    await fetch(`${req.headers.origin}/api/chat/addMessageToChat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: req.headers.cookie,
      },
      body: JSON.stringify({
        chatId,
        role: "assistant",
        content: query_message,
      }),
    });

    res.status(200).json(response);
  } catch (e) {
    console.log("ERROR: ", e);
    res.status(500).json({ error: "Internal server error" });
  }
}
