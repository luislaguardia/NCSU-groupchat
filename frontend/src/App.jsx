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
  const [typingStatus, setTypingStatus] = useState('');
  const [darkMode, setDarkMode] = useState(true);
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

  const handleTyping = () => {
    socket.emit('typing', { nickname });
  };

  const formatTime = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const themeClass = darkMode ? 'dark' : '';
  const toggleDarkMode = () => setDarkMode(!darkMode);

  const AuthCard = ({ title, children }) => (
    <div className={`min-h-screen ${themeClass} bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center px-4`}>
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );

  if (!userId) {
    return (
      <AuthCard title="Login">
        <input className="border rounded w-full p-2 mb-3 bg-gray-200 dark:bg-gray-700 text-black dark:text-white" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="border rounded w-full p-2 mb-3 bg-gray-200 dark:bg-gray-700 text-black dark:text-white" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded" onClick={handleLogin}>Login</button>
      </AuthCard>
    );
  }

  if (showNicknamePrompt) {
    return (
      <AuthCard title="Set Your Nickname">
        <input className="border rounded w-full p-2 mb-3 bg-gray-200 dark:bg-gray-700 text-black dark:text-white" placeholder="Nickname" value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} />
        <button className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded" onClick={updateNickname}>Set Nickname</button>
      </AuthCard>
    );
  }

  return (
    <div className={`${themeClass} min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white flex flex-col items-center justify-center p-4`}>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-xl flex flex-col h-[90vh]">
        <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">💬 Group Chat</h2>
          <button onClick={toggleDarkMode} className="text-sm text-blue-500 dark:text-blue-300 hover:underline">
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 dark:bg-gray-800">
          {messages.map((msg, idx) => {
            const isMine = msg.nickname === nickname;
            return (
              <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-sm px-4 py-2 rounded-2xl shadow-md ${isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-bl-sm'}`}>
                  <div className="text-sm font-semibold mb-1">{msg.nickname}</div>
                  <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                  <div className="text-[10px] text-right mt-1 opacity-70">{formatTime(msg.createdAt)}</div>
                </div>
              </div>
            );
          })}
          {typingStatus && (
            <div className="text-xs text-gray-500 dark:text-gray-300 italic">{typingStatus}</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-300 dark:border-gray-700 flex gap-2 bg-white dark:bg-gray-900">
          <input
            className="flex-grow border rounded-xl p-2 text-sm bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
            placeholder="Type a message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={(e) => {
              handleTyping();
              if (e.key === 'Enter') sendMessage();
            }}
          />
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
