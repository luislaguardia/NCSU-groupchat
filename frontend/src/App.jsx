import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(import.meta.env.VITE_BACKEND_URL);

function App() {
  const [step, setStep] = useState('login');
  const [userId, setUserId] = useState(null);
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingStatus, setTypingStatus] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    socket.on('receiveMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('userTyping', (data) => {
      if (data.nickname !== nickname) {
        setTypingStatus(`${data.nickname} is typing…`);
        setTimeout(() => setTypingStatus(''), 2000);
      }
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('userTyping');
    };
  }, [nickname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Fetch messages failed:', err);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        username,
        password
      });
      if (res.data && res.data.id) {
        setUserId(res.data.id);
        if (!res.data.nickname) {
          setStep('nickname');
        } else {
          setNickname(res.data.nickname);
          setStep('chat');
        }
      }
    } catch (err) {
      alert('Login failed');
    }
  };

  const updateNickname = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/set-nickname`, {
        id: userId,
        nickname: nicknameInput
      });
      setNickname(nicknameInput);
      setStep('chat');
    } catch (err) {
      alert('Failed to set nickname');
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit('sendMessage', { userId, nickname, message });
    setMessage('');
  };

  const handleTyping = () => {
    socket.emit('typing', { nickname });
  };

  const formatTime = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (step === 'login') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="bg-gray-800 p-6 rounded-xl w-80">
          <h2 className="text-xl font-bold mb-4 text-center">Login</h2>
          <input className="w-full p-2 mb-3 bg-gray-700 text-white rounded" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <input className="w-full p-2 mb-3 bg-gray-700 text-white rounded" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-blue-500 hover:bg-blue-600 p-2 rounded" onClick={handleLogin}>Login</button>
        </div>
      </div>
    );
  }

  if (step === 'nickname') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="bg-gray-800 p-6 rounded-xl w-80">
          <h2 className="text-xl font-bold mb-4 text-center">Set Nickname</h2>
          <input className="w-full p-2 mb-3 bg-gray-700 text-white rounded" placeholder="Nickname" value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} />
          <button className="w-full bg-green-500 hover:bg-green-600 p-2 rounded" onClick={updateNickname}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex text-white bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Chats</h2>
        <input className="mb-4 p-2 bg-gray-700 rounded text-sm" placeholder="Search..." />
        <div className="space-y-3 overflow-y-auto">
          {[1,2,3,4].map((user) => (
            <div key={user} className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer">
              <p className="text-sm font-semibold">User {user}</p>
              <p className="text-xs text-gray-300">Active</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-700 p-4 flex justify-between items-center bg-gray-800">
          <h3 className="font-bold">{nickname}</h3>
          <span className="text-xs text-green-400">Online</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => {
            const isMine = msg.nickname === nickname;
            return (
              <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md px-4 py-2 rounded-xl ${isMine ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <p className="text-sm font-semibold">{msg.nickname}</p>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-xs text-right text-gray-300 mt-1">{formatTime(msg.createdAt)}</p>
                </div>
              </div>
            );
          })}
          {typingStatus && <div className="text-xs italic text-gray-400">{typingStatus}</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-700 p-4 bg-gray-800 flex gap-2">
          <input
            className="flex-grow bg-gray-700 p-2 rounded text-white text-sm"
            placeholder="Type a message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              handleTyping();
              if (e.key === 'Enter') sendMessage();
            }}
          />
          <button className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded" onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
