import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { randomBytes } from 'crypto'; // Import randomBytes for generating random keys

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
  const token = jwt.sign({ _id: "jdkalhfhvkfuwkjf" }, secretKey);

  res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" }).json({
    message: "Login Success",
  });
});

let userCount = 0;
let connectedUsers = {}; // Track connected users per room
let messages = {}; // Track messages per room
let roomOwners = {}; // Track room owners
let roomKeys = {}; // Track room keys

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

  socket.on("join-room", ({ room, username }) => {
    socket.join(room);
    console.log(`User ${userCount} joined room ${room}`);

    // Add user to connected users list for the room
    connectedUsers[room] = connectedUsers[room] || [];
    connectedUsers[room].push({ id: socket.id, username: username || `User ${userCount}` });

    // Set room owner if not set already
    if (!roomOwners[room]) {
      roomOwners[room] = username || `User ${userCount}`;
    }

    // Generate and set room key if not set already
    if (!roomKeys[room]) {
      const key = generateRoomKey();
      roomKeys[room] = key;
    }

    // Send all previous messages of the room to the joining user
    if (messages[room]) {
      for (const msg of messages[room]) {
        socket.emit("message received", msg);
      }
    }

    io.to(room).emit('user-connected', `${username || `User ${userCount}`} has joined the chat`, room);
    io.to(room).emit('room-joined', { room, owner: roomOwners[room], key: roomKeys[room] }); // Send room name, owner, and key to all users in the room
  });

  socket.on("message", ({ room, message }) => {
    console.log({ room, message });
    if (connectedUsers[room]) {
      const user = connectedUsers[room].find(u => u.id === socket.id);
      if (user) {
        const messageWithUser = `${user.username}: ${message}`;
        io.to(room).emit("message received", messageWithUser);
        messages[room] = messages[room] || [];
        messages[room].push(messageWithUser);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`User ${userCount} disconnected`, socket.id);

    // Remove user from connected users list for the room
    for (const room in connectedUsers) {
      const roomIndex = connectedUsers[room].findIndex(u => u.id === socket.id);
      if (roomIndex !== -1) {
        connectedUsers[room].splice(roomIndex, 1);
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});

// Function to generate a random 5-character key
function generateRoomKey() {
  return randomBytes(3).toString('hex').toUpperCase(); // Generating a 3-byte random key and converting it to uppercase hex string
}
