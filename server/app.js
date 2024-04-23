import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const port = 5000;
const secretKey = 'tommarvoloriddle';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true,
}));

app.get("/", (req, res) => {
  res.send("Server is running bro")
});

app.get("/login", (req, res) => {
  const token = sign({ _id: "jdkalhfhvkfuwkjf" }, secretKey);

  res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" }).json({
    message: "Login Success",
  });
});

let userCount = 0;
let connectedUsers = {}; // Track connected users per room

io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res, (err) => {
    if (err) return next(err);

    const token = socket.request.cookies.token;

    if (!token) return next(new Error("Authentication Error"));

    const decoded = jwt.verify(token, secretKey);

    next();
  });
});

io.on("connection", (socket) => {
  userCount++;
  console.log(`User ${userCount} Connected`, socket.id);
  io.emit('user-connected', `User ${userCount} has joined the chat`);

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`User ${userCount} joined room ${room}`);

    // Add user to connected users list for the room
    connectedUsers[room] = connectedUsers[room] || [];
    connectedUsers[room].push(socket.id);
  });

  socket.on("message", ({ room, message }) => {
    console.log({ room, message });
    socket.to(room).emit("message received", message);
  });

  socket.on("disconnect", () => {
    console.log(`User ${userCount} disconnected`, socket.id);

    // Remove user from connected users list for the room
    if (connectedUsers[socket.id]) {
      const roomIndex = connectedUsers[socket.id].findIndex(id => id === socket.id);
      if (roomIndex !== -1) {
        connectedUsers[socket.id].splice(roomIndex, 1);
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});