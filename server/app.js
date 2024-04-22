import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import jwt from 'jsonwebtoken'
import cookieParser from "cookie-parser";


const port = 5000;
const secretKey = 'tommarvoloriddle'

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors:{
        origin:"http://localhost:5173",
        methods: ["GET", "POST"],
        credentials:true,
    }
});

app.use(cors({
    origin:"http://localhost:5173",        // Middleware
    methods: ["GET", "POST"],
    credentials:true,
})
);              

app.get("/", (req,res) => {
    res.send("Server is running bro")
});

app.get("/login", (req,res) => {
    
    const token = jwt.sign({ _id: "jdkalhfhvkfuwkjf"}, secretKey);

    res.cookie("token", token, {httpOnly: true, secure: true, sameSite: "none"}).json({
        message: "Login Success",
    })
});


io.use((socket, next) =>{
    cookieParser()(socket.request, socket.request.res, (err) =>{

        if (err) return next(err)

        const token = socket.request.cookies.token;

        if(!token) return next(new Error("Authentication Error"))

        const decoded = jwt.verify(token, secretKey);

        next();

    });
});

io.on("connection", (socket)=>{
    console.log("User Connected", socket.id);
    // socket.emit("Welcome!", `Welcome to the server.`);
    // socket.broadcast.emit("Welcome!", `${socket.id} has joined the server.`);
    socket.on("message", ({room, message}) => {
        console.log({room, message});
        socket.to(room).emit("message received", message);
    });

    socket.on("join-room", (room)=>{
        socket.join(room);
        console.log(`User joined room ${room}`);
    });


    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });

})



server.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});