import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { Container, TextField, Typography, Button, Stack, Grid } from '@mui/material';
import "./app.css"

const App = () => {
  const socket = useMemo(() => io('http://localhost:5000', {withCredentials: true}), []);

  // State variables for message, room, socket ID, and messages
  const [message, setMessage] = useState('');
  const [room, setRoom] = useState('');
  const [roomName, setRoomName] = useState('');
  const [socketId, setSocketId] = useState('');
  const [allMessages, setAllMessages] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Ensure both message and room are not empty before sending
    if (message.trim() && room.trim()) {
      socket.emit('message', { message, room });
      setMessage(''); // Clear message input after sending
    } else {
      alert('Please enter a message and room name!');
    }
  };

  const joinRoomHandler=(e) =>{
    e.preventDefault();
    socket.emit("join-room", roomName); 
    setRoomName("");
  }

  useEffect(() => {
    socket.on('connect', () => {
      setSocketId(socket.id);
      console.log('Connected:', socket.id);
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
    <Container maxWidth="sm">
      <Typography variant="h3" component="div" gutterBottom style={{marginTop:"150px", color:"white", fontWeight:"bold"}}>
        The Websocket Room!
      </Typography>

      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12}>
          <Typography variant="h5" component="div" gutterBottom style={{color:"white", fontWeight:"bold"}}>
            Join Room
          </Typography>
        </Grid>
        <Grid item xs={8}>
          <TextField
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            id="outlined-basic"
            label="Room Name"
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
          <Button type="submit" variant="contained" color="primary" fullWidth onClick={joinRoomHandler} style={{height:"99%"}}>
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
    label="Room"
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
            <Button type="submit" variant="contained" color="primary" fullWidth style={{height:"99%", marginLeft:"15px"}}>
              Send
            </Button>
          </Grid>
        </Grid>
      </form>

      <br />

      <Stack>
        {allMessages.map((m, i) => (
          <Typography key={i} variant="h6" component="div" gutterBottom style={{color:"white"}}>
            {m}
          </Typography>
        ))}
      </Stack>
    </Container>
  );
};

export default App;
