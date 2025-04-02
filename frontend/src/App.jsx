import React, { useEffect, useRef, useState } from 'react';
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    socket.on('receiveMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const formatTime = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const AuthCard = ({ title, children }) => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );

  if (!userId) {
    return (
      <AuthCard title="Login">
        <input className="border rounded w-full p-2 mb-3" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="border rounded w-full p-2 mb-3" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded" onClick={handleLogin}>Login</button>
      </AuthCard>
    );
  }

  if (showNicknamePrompt) {
    return (
      <AuthCard title="Set Your Nickname">
        <input className="border rounded w-full p-2 mb-3" placeholder="Nickname" value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} />
        <button className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded" onClick={updateNickname}>Set Nickname</button>
      </AuthCard>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl flex flex-col h-[90vh]">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-blue-700">💬 Messenger-style Group Chat</h2>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {messages.map((msg, idx) => {
            const isMine = msg.nickname === nickname;
            return (
              <div
                key={idx}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs px-4 py-2 rounded-lg shadow-md ${isMine ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}>
                  <div className="text-sm font-semibold mb-1">{msg.nickname}</div>
                  <div className="text-sm">{msg.message}</div>
                  <div className="text-[10px] text-right mt-1 opacity-70">
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t flex gap-2">
          <input
            className="flex-grow border rounded p-2 text-sm"
            placeholder="Type a message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
