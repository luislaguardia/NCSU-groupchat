import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './index.css';

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
  const [showSidebar, setShowSidebar] = useState(false);
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
      setStep(res.data.nickname ? 'chat' : 'nickname');
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

  const toggleSidebar = () => setShowSidebar(!showSidebar);

  if (step === 'login') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Login</h1>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin}>Login</button>
        </div>
      </div>
    );
  }

  if (step === 'nickname') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Set Your Nickname</h1>
          <input placeholder="Nickname" value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} />
          <button onClick={updateNickname}>Set Nickname</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button className="hamburger-fixed" onClick={toggleSidebar}>☰</button>

      <div className="chat-wrapper">
        <aside className={`sidebar ${showSidebar ? 'visible' : ''}`}>
          <h2>Chats</h2>
          <p>Welcome, <strong>{nickname}</strong></p>
        </aside>

        <main className="chat-panel">
          <header className="chat-header">
            Group Chat
          </header>

          <div className="chat-messages">
            {messages.map((msg, idx) => {
              const isMine = msg.nickname === nickname;
              return (
                <div key={idx} className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
                  <div className="message-bubble">
                    <div className="message-nickname">{msg.nickname}</div>
                    <div className="message-text">{msg.message}</div>
                    <div className="message-time">{formatTime(msg.createdAt)}</div>
                  </div>
                </div>
              );
            })}
            {typingStatus && <div className="typing-status">{typingStatus}</div>}
            <div ref={messagesEndRef} />
          </div>

          <footer className="chat-input">
            <input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                handleTyping();
                if (e.key === 'Enter') sendMessage();
              }}
            />
            <button onClick={sendMessage}>Send</button>
          </footer>
        </main>
      </div>
    </>
  );
}

export default App;
