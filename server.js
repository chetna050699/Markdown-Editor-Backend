const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { marked } = require("marked");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 5000;

let connectedUsers = [];
let markdownContent = ""; // Shared Markdown content

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  connectedUsers.push(socket.id);

  // Notify all clients about the updated user list
  io.emit("updateUsers", connectedUsers);

  // Send current Markdown content to the newly connected user
  socket.emit("markdownUpdate", markdownContent);

  // Handle Markdown updates
  socket.on("markdownUpdate", (newMarkdown) => {
    markdownContent = newMarkdown;
    socket.broadcast.emit("markdownUpdate", newMarkdown); // Send to all other users
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    connectedUsers = connectedUsers.filter((id) => id !== socket.id);
    io.emit("updateUsers", connectedUsers);
  });
});

// Markdown-to-HTML conversion API
app.post("/convert", (req, res) => {
  const { markdown } = req.body;

  if (!markdown) {
    return res.status(400).json({ error: "Markdown input is required" });
  }

  try {
    const html = marked(markdown);
    res.json({ html });
  } catch (error) {
    res.status(500).json({ error: "Error processing Markdown." });
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
