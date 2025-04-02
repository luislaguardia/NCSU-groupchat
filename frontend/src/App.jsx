import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(import.meta.env.VITE_BACKEND_URL);

function App() {
  const [step, setStep] = useState('login'); // 'login', 'nickname', 'chat'
  const [userId, setUserId] = useState(null);
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingStatus, setTypingStatus] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (step === 'chat') fetchMessages();

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
  }, [step, nickname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, {
        username,
        password,
      });

      if (!res.data || !res.data.id) {
        alert('Login failed');
        return;
      }

      setUserId(res.data.id);
      setNickname(res.data.nickname || '');

      if (!res.data.nickname) {
        setStep('nickname');
      } else {
        setStep('chat');
      }
    } catch (err) {
      alert('Login failed');
    }
  };

  const updateNickname = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/set-nickname`, {
        id: userId,
        nickname: nicknameInput,
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

  const themeClass = darkMode ? 'dark' : '';
  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className={`${themeClass} min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white`}>
      {step === 'login' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow w-full max-w-sm">
            <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
            <input className="w-full mb-3 p-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className="w-full mb-3 p-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded">Login</button>
          </div>
        </div>
      )}

      {step === 'nickname' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow w-full max-w-sm">
            <h1 className="text-2xl font-bold mb-4 text-center">Set Your Nickname</h1>
            <input className="w-full mb-3 p-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white" placeholder="Nickname" value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} />
            <button onClick={updateNickname} className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded">Set Nickname</button>
          </div>
        </div>
      )}

      {step === 'chat' && (
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-1/4 bg-gray-200 dark:bg-gray-800 p-4 space-y-4 hidden md:block">
            <div className="font-bold text-xl mb-2">Chats</div>
            <div className="text-sm">Welcome, {nickname}</div>
            <button onClick={toggleDarkMode} className="text-sm mt-4 text-blue-500">{darkMode ? '☀️ Light' : '🌙 Dark'}</button>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
            <div className="p-4 border-b border-gray-300 dark:border-gray-700 text-lg font-semibold">Group Chat</div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, idx) => {
                const isMine = msg.nickname === nickname;
                return (
                  <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-sm px-4 py-2 rounded-2xl shadow ${isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-300 dark:bg-gray-700 text-black dark:text-white rounded-bl-none'}`}>
                      <div className="text-sm font-semibold">{msg.nickname}</div>
                      <div className="text-sm">{msg.message}</div>
                      <div className="text-xs text-right mt-1 opacity-70">{formatTime(msg.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
              {typingStatus && (
                <div className="text-xs italic text-gray-500">{typingStatus}</div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-300 dark:border-gray-700 flex gap-2">
              <input
                className="flex-grow border rounded-xl p-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  handleTyping();
                  if (e.key === 'Enter') sendMessage();
                }}
              />
              <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
