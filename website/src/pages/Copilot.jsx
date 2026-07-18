import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from '../services/api';

export default function Copilot() {
  const [liveContext, setLiveContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:3000', {
      auth: { token }
    });

    socket.on('website:live_review_context', (data) => {
      setLiveContext(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.getChatHistory();
      if (res.success) setConversations(res.conversations);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const selectConversation = async (id) => {
    setActiveConversationId(id);
    try {
      const res = await api.getChatConversation(id);
      if (res.success) {
        setMessages(res.conversation.messages);
      }
    } catch (err) {
      console.error('Failed to load conversation', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatWithCopilot(userMsg.content, liveContext, activeConversationId);
      if (res.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
        if (!activeConversationId) {
          setActiveConversationId(res.conversationId);
          loadHistory();
        }
      }
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-gray-200 p-4 bg-gray-50 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">History</h3>
          <button 
            onClick={() => { setActiveConversationId(null); setMessages([]); }}
            className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200"
          >
            + New
          </button>
        </div>
        {conversations.length === 0 ? (
          <p className="text-sm text-gray-500">No previous conversations.</p>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => (
              <div 
                key={conv.id} 
                onClick={() => selectConversation(conv.id)}
                className={`p-2 rounded cursor-pointer text-sm ${activeConversationId === conv.id ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-gray-200 text-gray-700'}`}
              >
                {conv.title}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col p-4 bg-white">
        <div className="flex-1 overflow-auto bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200 flex flex-col">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-center text-gray-400">Ask your AI Financial Copilot anything...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-2 rounded-lg max-w-[80%] whitespace-pre-wrap ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && <div className="text-gray-400 text-sm">AI is thinking...</div>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="How much tax can I save?" 
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
      <div className="w-80 border-l border-gray-200 p-4 bg-gray-50 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          Live Extension Context
          {liveContext ? (
            <span className="ml-2 h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
          ) : (
            <span className="ml-2 h-2 w-2 bg-red-400 rounded-full"></span>
          )}
        </h3>
        
        {!liveContext ? (
          <div className="text-sm text-gray-500">
            <p className="mb-2">No active connection to the browser extension.</p>
            <p>Paste your web token into the extension's "Platform Sync" section to link your context!</p>
          </div>
        ) : (
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <h4 className="text-sm font-semibold text-emerald-800 mb-2">Sync Active</h4>
            <p className="text-xs text-gray-700">Page: {liveContext.pageTitle}</p>
            <p className="text-xs text-gray-700 break-all">URL: {liveContext.pageUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
}
