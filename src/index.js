import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import { pool } from "./db.js";
import { createServer } from "http";

const app = express();
const server = createServer(app);

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(`select * from users`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/messages", async (req, res) => {
  try {
    const result = await pool.query(`
      select messages.id, messages.message, messages.created_at, users.id as user_id, users.username
      from messages
      inner join users on messages.user_id = users.id
      order by messages.created_at asc`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

io.on("connection", (socket) => {
  console.log("A user is connected: ", socket.id);

  socket.on("user_online", async (value) => {
    console.log("User is online: ", value);
  });

  // socket.on("load_messages", async () => {});

  socket.on("chat_message", async ({ userId, message }) => {
    try {
      console.log("received: ", { userId, message });
      const result = await pool.query(
        `with new_msg as (
        insert into messages (user_id, message)
        values ($1, $2)
        returning id, user_id, message, created_at
        )
        select new_msg.id, new_msg.message, new_msg.created_at,
          users.id as user_id, users.username
        from new_msg
        inner join users on new_msg.user_id = users.id`,
        [userId, message]
      );
      console.log("message insert result", result.rows);
      io.emit("new_message", result.rows[0]);
    } catch (error) {
      console.error(error);
    }
  });
});

server.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});
