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
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [nicknameInput, setNicknameInput] = useState('');
  const [typingStatus, setTypingStatus] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    socket.on('receiveMessage', (msg) => setMessages((prev) => [...prev, msg]));
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
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, { username, password });
      setUserId(res.data.id);
      setNickname(res.data.nickname || '');
      setStep(res.data.nickname ? 'chat' : 'nickname');
    } catch {
      alert('Login failed');
    }
  };

  const updateNickname = async () => {
    await axios.post(`${import.meta.env.VITE_BACKEND_URL}/set-nickname`, { id: userId, nickname: nicknameInput });
    setNickname(nicknameInput);
    setStep('chat');
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit('sendMessage', { userId, nickname, message });
    setMessage('');
  };

  const handleTyping = () => {
    socket.emit('typing', { nickname });
  };

  const formatTime = (isoDate) => new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const LoginScreen = () => (
    <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <input className="w-full p-2 mb-3 rounded bg-gray-200 dark:bg-gray-700" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="w-full p-2 mb-3 rounded bg-gray-200 dark:bg-gray-700" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin} className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
      </div>
    </div>
  );

  const NicknameScreen = () => (
    <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4">Set Nickname</h2>
        <input className="w-full p-2 mb-3 rounded bg-gray-200 dark:bg-gray-700" placeholder="Your nickname" value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} />
        <button onClick={updateNickname} className="w-full bg-green-600 text-white py-2 rounded">Save</button>
      </div>
    </div>
  );

  const ChatDashboard = () => (
    <div className="h-screen flex text-white">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-900 p-4 space-y-4">
        <h2 className="text-xl font-bold mb-4">Chats</h2>
        <div className="space-y-2">
          {["Luis", "MJ", "Kenji", "Ken"].map((name, idx) => (
            <div key={idx} className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 cursor-pointer">
              <div className="font-medium">{name}</div>
              <div className="text-xs text-gray-400">Active now</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold">{nickname}</h2>
          <span className="text-sm text-green-400">Online</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => {
            const isMine = msg.nickname === nickname;
            return (
              <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md px-4 py-2 rounded-xl shadow ${isMine ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>
                  <div className="font-semibold text-sm mb-1">{msg.nickname}</div>
                  <div className="text-sm">{msg.message}</div>
                  <div className="text-[10px] text-right mt-1 text-gray-300">{formatTime(msg.createdAt)}</div>
                </div>
              </div>
            );
          })}
          {typingStatus && <div className="text-xs italic text-gray-400">{typingStatus}</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-700 flex">
          <input
            className="flex-grow p-2 rounded-lg bg-gray-700 text-white"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              handleTyping();
              if (e.key === 'Enter') sendMessage();
            }}
          />
          <button onClick={sendMessage} className="ml-2 bg-blue-500 px-4 py-2 rounded-lg">Send</button>
        </div>
      </div>
    </div>
  );

  if (step === 'login') return <LoginScreen />;
  if (step === 'nickname') return <NicknameScreen />;
  return <ChatDashboard />;
}

export default App;
