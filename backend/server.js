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

// MongoDB Models
const User = require('./models/User');
const Message = require('./models/Message');

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// Routes

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ id: user._id, nickname: user.nickname });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Set nickname after login
app.post('/set-nickname', async (req, res) => {
  const { id, nickname } = req.body;

  try {
    await User.findByIdAndUpdate(id, { nickname });
    res.json({ message: 'Nickname updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating nickname' });
  }
});

// Get all messages
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Socket.IO handling
io.on('connection', (socket) => {
  console.log('🟢 A user connected');

  socket.on('sendMessage', async ({ userId, nickname, message }) => {
    try {
      const newMessage = new Message({ userId, nickname, message });
      await newMessage.save();
      io.emit('receiveMessage', newMessage); // broadcast to all
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 A user disconnected');
  });
});

// Start server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));