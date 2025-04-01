// src/App.js
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(import.meta.env.VITE_BACKEND_URL);

function App() {
  const [userId, setUserId] = useState(null);
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [nicknameInput, setNicknameInput] = useState('');
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);

  useEffect(() => {
    fetchMessages();

    socket.on('receiveMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  const fetchMessages = async () => {
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/messages`);
    setMessages(res.data);
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        username,
        password
      });
      setUserId(res.data.id);
      if (!res.data.nickname) {
        setShowNicknamePrompt(true);
      } else {
        setNickname(res.data.nickname);
      }
    } catch (err) {
      alert('Login failed');
    }
  };

  const updateNickname = async () => {
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/set-nickname`, {
      id: userId,
      nickname: nicknameInput
    });
    setNickname(nicknameInput);
    setShowNicknamePrompt(false);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit('sendMessage', { userId, nickname, message });
    setMessage('');
  };

  if (!userId) {
    return (
      <div className="p-4">
        <h2 className="text-xl mb-2">Login</h2>
        <input className="border p-2 mr-2" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="border p-2 mr-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="bg-blue-500 text-white p-2" onClick={handleLogin}>Login</button>
      </div>
    );
  }

  if (showNicknamePrompt) {
    return (
      <div className="p-4">
        <h2 className="text-xl mb-2">Set Your Nickname</h2>
        <input className="border p-2 mr-2" value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} />
        <button className="bg-green-500 text-white p-2" onClick={updateNickname}>Set Nickname</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Group Chat</h2>
      <div className="border p-4 h-96 overflow-y-scroll mb-2">
        {messages.map((msg, idx) => (
          <div key={idx}><strong>{msg.nickname}:</strong> {msg.message}</div>
        ))}
      </div>
      <input className="border p-2 w-3/4 mr-2" placeholder="Type a message..." value={message} onChange={e => setMessage(e.target.value)} />
      <button className="bg-blue-500 text-white p-2" onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
