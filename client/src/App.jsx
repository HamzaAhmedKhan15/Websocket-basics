import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Container, TextField, Typography, Button, Grid, Paper } from '@mui/material';
import "./app.css"

const App = () => {
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(""); // Track current user ID
  const [message, setMessage] = useState('');
  const [roomName, setRoomName] = useState('');
  const [allMessages, setAllMessages] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState({});
  const [roomJoined, setRoomJoined] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('');
  const [roomOwner, setRoomOwner] = useState('');
  const [roomKey, setRoomKey] = useState(''); // State to store room key
  const messagesEndRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && roomJoined) {
      socket.emit('message', { message, room: currentRoom });
      setMessage('');
    } else {
      alert('Please join the room first to send messages!');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      setMessage(message + '\n');
    }
  };

  const joinRoomHandler = (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    
    if (!username) {
      alert('Please enter a username.');
      return;
    }
  
    socket.emit("join-room", { room: roomName, username });
    setCurrentRoom(roomName);
    setRoomOwner(username);
    setRoomJoined(true);
  };

  useEffect(() => {
    const newSocket = io('http://localhost:5000', { withCredentials: true });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected:', newSocket.id);
      setCurrentUser(newSocket.id); // Set current user ID on connect
    });

    newSocket.on('user-connected', (message, joinedRoom) => {
      setAllMessages((prevMessages) => [...prevMessages, message]);
      setConnectedUsers((prevUsers) => {
        const updatedUsers = { ...prevUsers };
        if (!updatedUsers[joinedRoom]) {
          updatedUsers[joinedRoom] = [];
        }
        updatedUsers[joinedRoom].push(message.split(' ')[1]);
        return updatedUsers;
      });
    });

    newSocket.on('message received', (data) => {
      setAllMessages((prevMessages) => [...prevMessages, data]);
      scrollToBottom();
    });

    newSocket.on('room-joined', ({ room, owner, key }) => {
      setCurrentRoom(room);
      setRoomOwner(owner);
      setRoomKey(key); // Set room key state
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessage = (msg) => {
    const messageParts = msg.split(':');
    const username = messageParts[0];
    const content = messageParts.slice(1).join(':').trim();
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
    return (
      <div>
        <Typography variant="h6" gutterBottom style={{ color: "white", textAlign: "left" }}>
          <span style={{ color: "grey" }}>{`${username}:`}</span> {content}
          <span style={{ color: "grey", fontSize: "12px", marginLeft: "5px" }}>{` - ${timestamp}`}</span>
        </Typography>
      </div>
    );
  };

  return (
    <Container maxWidth="lg">
      <Grid container spacing={4}>
        <Grid item xs={6}>
          <Typography variant="h3" gutterBottom style={{ color: "orange", fontWeight: "700", fontFamily: "Platypi", fontStyle: "normal", marginTop:"150px" }} className='playti'>
            Socket' ChatRooms!
          </Typography>

          <Typography variant="h5" gutterBottom style={{ color: "white", fontWeight: "bold", fontStyle: "italic" }}>
            Let's Join & Chat.
          </Typography>

          {roomJoined ? (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress} // Handle Enter key press
                    label="Message"
                    variant="outlined"
                    multiline
                    rows={4} // Adjust the number of rows here
                    maxRows={8} // Adjust the maximum number of rows here
                    style={{ width: "100%" }}
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
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary" fullWidth style={{background:"#181818"}}>
                    Send
                  </Button>
                </Grid>
              </Grid>
            </form>
          ) : (
            <form onSubmit={joinRoomHandler}>
  <Grid container spacing={2}>
    <Grid item xs={5.5}>
      <TextField
        id="roomName"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        label="Join New Room"
        variant="outlined"
        style={{ width: "100%" }}
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
    <Grid item xs={1} style={{ textAlign: "center", marginTop: "17px" }}>
      <Typography variant="body1" style={{ color: "orange", fontSize: "16px", fontWeight: "bold" }}>
        or
      </Typography>
    </Grid>
    <Grid item xs={5.5}>
      <TextField
        id="roomKey"
        label="Enter Room ID"
        variant="outlined"
        style={{ width: "100%" }}
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
    <Grid item xs={12}>
      <TextField
        id="username"
        label="Join as (e.g. John, Max, Anonymous) etc "
        variant="outlined"
        style={{ width: "100%" }}
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
    <Grid item xs={12}>
    <Button 
  type="submit" 
  variant="contained" 
  fullWidth 
  sx={{
    backgroundColor: "#181818",
    '&:hover': {
      backgroundColor: "#181818", // Keep the background color same on hover
      '& .MuiButton-label': {
        color: "orange" // Change the text color to orange on hover
      }
    },
  }}
>
  Join
</Button>
    </Grid>
  </Grid>
</form>

          
          )}
        </Grid>
        <Grid item xs={6}>
          <Paper style={{ padding: "10px", backgroundColor: "rgba(0, 0, 0, 0.7)", maxHeight: "500px", scrollbarColor: "black", marginTop:"70px" }}>
            {roomJoined && (
              <div style={{ textAlign: "center",fontFamily: "Platypi" }}>
                <Typography variant="h5" gutterBottom style={{ color: "white", fontWeight: "bold" }}>
                  <span style={{ color: "orange" }}>ROOM:</span> {currentRoom}
                </Typography>
                <Typography variant="subtitle1" gutterBottom style={{ color: "grey", marginTop: "-5px", fontSize:"12px" , fontStyle: "italic"}}>
                  <span style={{ color: "grey", fontSize: "12px", marginLeft: "5px" }}> Room Key: {roomKey}</span> {/* Display room key */}<br/>
                  created by {roomOwner} ({new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })})
                  <hr />
                </Typography>
              </div>
            )}
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {allMessages.map((m, i) => {
                const isCurrentUserMessage = m.includes(currentUser); // Check if message is sent by current user
                if (m.includes('has joined')) {
                  const user = m.split(' ')[1];
                  const joinedRoom = m.split(' ')[3];
                  const isNewUser = !connectedUsers[joinedRoom]?.includes(user);
                  if (isNewUser) {
                    return (
                      <Typography key={i} variant="subtitle1" gutterBottom style={{ color: "white", fontSize: "13px", ...(m.includes('has joined') && { color: "#1F51FF" }) }}>
                        {m} <span style={{ color: "gray", fontSize: "10px" }}> (New)</span>
                      </Typography>
                    );
                  }
                } else if (m.includes(':')) {
                  return (
                    formatMessage(m)
                  );
                }
                return (
                  <Typography key={i} variant="h6" gutterBottom style={{ color: "white", ...(m.includes('has joined') && { color: "green" }) }}>
                    {m}
                  </Typography>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default App;
