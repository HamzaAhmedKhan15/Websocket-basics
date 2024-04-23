import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Container, TextField, Typography, Button, Stack, Grid } from '@mui/material';
import "./app.css"

const App = () => {
  const socket = useMemo(() => io('http://localhost:5000', { withCredentials: true }), []);

  // State variables for message, room, socket ID, messages, and connected users
  const [message, setMessage] = useState('');
  const [room, setRoom] = useState('');
  const [roomName, setRoomName] = useState('');
  const [socketId, setSocketId] = useState('');
  const [allMessages, setAllMessages] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState({}); // Track connected users per room
  const [roomJoined, setRoomJoined] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Ensure both message and room are not empty before sending
    if (message.trim() && room.trim() && roomJoined) {
      socket.emit('message', { message, room });
      setMessage(''); // Clear message input after sending
    } else {
      alert('Please join the room first or enter a message and room name!');
    }
  };

  const joinRoomHandler = (e) => {
    e.preventDefault();
    socket.emit("join-room", roomName);
    setRoomName("");
    setRoomJoined(true);
  }

  useEffect(() => {
    socket.on('connect', () => {
      setSocketId(socket.id);
      console.log('Connected:', socket.id);
    });

    socket.on('user-connected', (message, joinedRoom) => {
      setAllMessages((prevMessages) => [...prevMessages, message]);

      // Update connected users in the specific room
      setConnectedUsers((prevUsers) => {
        const updatedUsers = { ...prevUsers };
        if (!updatedUsers[joinedRoom]) {
          updatedUsers[joinedRoom] = [];
        }
        updatedUsers[joinedRoom].push(message.split(' ')[1]); // Extract username from message
        return updatedUsers;
      });
    });

    // Update allMessages state to display received messages
    socket.on('message received', (data) => {
      setAllMessages((prevMessages) => [...prevMessages, data]);
    });

    // Handle potential 'Welcome' event from the server (optional)
    socket.on('Welcome', (e) => {
      console.log(e);
    });

    return () => {
      socket.disconnect(); // Clean up on unmount
    };
  }, []);

  return (
    
    <Container maxWidth="sm" className='live'>
      <Typography variant="h3" component="div" gutterBottom style={{ marginTop: "150px", color: "orange", fontWeight: "700", fontFamily:"Platypi", fontStyle:"normal" }} className='playti'>
        Socket' ChatRooms!
      </Typography>

      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12}>
          <Typography variant="h5" component="div" gutterBottom style={{ color: "white", fontWeight: "bold", fontStyle:"italic" }}>
            Let's Join & Chat.
          </Typography>
        </Grid>
        <Grid item xs={8}>
          <TextField
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            id="outlined-basic"
            label="Join Room"
            variant="outlined"
            fullWidth
            sx={{
              backgroundColor: "white",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "white",
                },
              },
            }}
          />
        </Grid>
        <Grid item xs={4}>
          <Button type="submit" variant="contained" fullWidth onClick={joinRoomHandler} style={{ height: "99%", background:"#36454F" }}>
            Join
          </Button>
        </Grid>
      </Grid>

      <br />

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={5}>
            <TextField
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              id="outlined-basic"
              label="Message"
              variant="outlined"
              style={{ width: "110%" }}
              sx={{
                backgroundColor: "white",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "white",
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={5}>
            <TextField
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              id="outlined-basic"
              label="Room Name"
              variant="outlined"
              style={{ width: "100%", marginLeft: "15px" }} // Add margin-left here
              sx={{
                backgroundColor: "white",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "white",
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={1}>
            <Button type="submit" variant="contained" className='btnd' fullWidth style={{ height: "99%", marginLeft: "15px", background:"#36454F" }}>
              Send
            </Button>
          </Grid>
        </Grid>
      </form>
    
      <br />
    
      <Stack>
        {allMessages.map((m, i) => {
          if (m.includes('has joined')) {
            const user = m.split(' ')[1];
            const joinedRoom = m.split(' ')[3];
            const isNewUser = !connectedUsers[joinedRoom]?.includes(user);
            if (isNewUser) {
              return (
                <Typography key={i} variant="h6" component="div" gutterBottom style={{ color: "white", ...(m.includes('has joined') && { color: "green" }) }}>
                  {m} <span style={{ color: "gray", fontSize: "12px" }}> (New)</span>
                </Typography>
              );
            }
          } else if (m.includes(':')) {
            return (
              <Typography key={i} variant="h6" component="div" gutterBottom style={{ color: "white" }}>
                {m}
              </Typography>
            );
          }
          return (
            <Typography key={i} variant="h6" component="div" gutterBottom style={{ color: "white", ...(m.includes('has joined') && { color: "green" }) }}>
              {m}
            </Typography>
          );
        })}
      </Stack>
    </Container>
  );
};

export default App;
