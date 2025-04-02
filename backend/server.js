const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5008;

// Middleware
app.use(cors());
app.use(express.json());

// Models
const User = require('./models/User');
const Message = require('./models/Message');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ id: user._id, nickname: user.nickname });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Set nickname
app.post('/set-nickname', async (req, res) => {
  const { id, nickname } = req.body;
  try {
    await User.findByIdAndUpdate(id, { nickname });
    res.json({ message: 'Nickname updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating nickname' });
  }
});

// Fetch messages
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Online users tracking
const onlineUsers = new Set();

// Socket.IO events
io.on('connection', (socket) => {
  console.log('🟢 A user connected');

  socket.on('userConnected', (nickname) => {
    socket.nickname = nickname;
    onlineUsers.add(nickname);
    io.emit('updateOnlineUsers', Array.from(onlineUsers));
  });

  socket.on('sendMessage', async ({ userId, nickname, message }) => {
    try {
      const newMessage = new Message({ userId, nickname, message });
      await newMessage.save();
      io.emit('receiveMessage', newMessage);
    } catch (err) {
      console.error('❌ Failed to send message:', err);
    }
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('userTyping', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 A user disconnected');
    if (socket.nickname) {
      onlineUsers.delete(socket.nickname);
      io.emit('updateOnlineUsers', Array.from(onlineUsers));
    }
  });
});

// Start server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
