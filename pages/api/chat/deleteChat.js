import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);
    const client = await clientPromise;
    const db = client.db("ChattyPette");

    const { chatId } = req.body;

    // Delete the chat using the ObjectId
    await db.collection("chats").deleteOne({
      userId: user.sub,
      _id: new ObjectId(chatId),
    });

    // Send a 200 OK response
    res.status(200).json({});
  } catch (e) {
    // Send a 500 Internal Server Error response
    res.status(500).json({ error: "Internal server error" });
    console.log("ERROR", e);
  }
}
