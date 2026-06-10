import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import ScrollStack, { ScrollStackItem } from './components/reactbits/ScrollStack';
import SpotlightCard from './components/reactbits/SpotlightCard';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const TIPS = [
  { tag: 'table', icon: '📊', text: 'Show me a comparison table of JavaScript frameworks' },
  { tag: 'chart', icon: '📈', text: 'Show a chart of global EV adoption by year' },
  { tag: 'grid',  icon: '🔲', text: 'Give me a grid of machine learning algorithms' },
  { tag: 'box',   icon: '📦', text: 'Give me a summary of microservices architecture' },
  { tag: 'text',  icon: '💬', text: 'Explain the difference between REST and GraphQL' },
];

function ChartRenderer({ data }) {
  const colors = ['rgba(108,99,255,0.8)','rgba(0,212,170,0.8)','rgba(255,107,107,0.8)','rgba(255,179,71,0.8)'];
  const chartData = {
    labels: data.labels,
    datasets: (data.datasets || []).map((ds, i) => ({
      ...ds,
      backgroundColor: colors[i % colors.length],
      borderColor: colors[i % colors.length].replace('0.8','1'),
      borderWidth: 1.5,
      borderRadius: 5,
      fill: data.chartType === 'line',
    }))
  };
  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#8892a4', font: { family: 'Inter', size: 11 } } } },
    scales: {
      x: { ticks: { color: '#556175' }, grid: { color: 'rgba(42,47,66,0.8)' } },
      y: { ticks: { color: '#556175' }, grid: { color: 'rgba(42,47,66,0.8)' } }
    }
  };
  return (
    <SpotlightCard className="response-card" spotlightColor="rgba(255,107,107,0.12)">
      <div className="card-header">
        <span className="badge badge-chart">Chart</span>
        <span className="card-title">{data.title}</span>
        <span className="reactbits-tag">✦ SpotlightCard</span>
      </div>
      <div className="chart-wrap">
        {data.chartType === 'line'
          ? <Line data={chartData} options={opts} />
          : <Bar data={chartData} options={opts} />}
      </div>
    </SpotlightCard>
  );
}

function TableRenderer({ data }) {
  return (
    <SpotlightCard className="response-card" spotlightColor="rgba(108,99,255,0.14)">
      <div className="card-header">
        <span className="badge badge-table">Table</span>
        <span className="card-title">{data.title}</span>
        <span className="reactbits-tag">✦ SpotlightCard</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{data.headers?.map((h, i) => <th key={i}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {data.rows?.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </SpotlightCard>
  );
}

function GridRenderer({ data }) {
  return (
    <SpotlightCard className="response-card" spotlightColor="rgba(0,212,170,0.12)">
      <div className="card-header">
        <span className="badge badge-grid">Grid</span>
        <span className="card-title">{data.title}</span>
        <span className="reactbits-tag">✦ SpotlightCard</span>
      </div>
      <div className="grid-body">
        {data.items?.map((item, i) => (
          <div key={i} className="grid-item">
            <div className="grid-icon">{item.icon}</div>
            <div className="grid-item-title">{item.title}</div>
            <div className="grid-item-desc">{item.description}</div>
          </div>
        ))}
      </div>
    </SpotlightCard>
  );
}

function BoxRenderer({ data }) {
  return (
    <SpotlightCard className="response-card box-card" spotlightColor="rgba(255,179,71,0.14)">
      <div className="card-header">
        <span className="badge badge-box">Summary</span>
        <span className="reactbits-tag">✦ SpotlightCard</span>
      </div>
      <div className="box-hero">
        <div className="box-title">{data.title}</div>
        {data.subtitle && <div className="box-sub">{data.subtitle}</div>}
      </div>
      <div className="box-points">
        {data.points?.map((pt, i) => (
          <div key={i} className="box-point">
            <div className="box-point-dot" />
            <div>
              <div className="box-point-label">{pt.label}</div>
              <div className="box-point-value">{pt.value}</div>
            </div>
          </div>
        ))}
      </div>
      {data.footer && <div className="box-footer">✦ {data.footer}</div>}
    </SpotlightCard>
  );
}

function TextRenderer({ content }) {
  return <div className="text-bubble">{content}</div>;
}

function LoadingBubble() {
  return (
    <div className="loading-bubble">
      <div className="dots"><span/><span/><span/></div>
      <span>Thinking...</span>
    </div>
  );
}

function ErrorBubble({ message }) {
  return (
    <div className="error-bubble">
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}

// Uses ScrollStack when there are 2+ structured responses in the panel
function ResponseRenderer({ msg }) {
  if (msg.loading) return <LoadingBubble />;
  if (msg.error) return <ErrorBubble message={msg.error} />;
  const d = msg.data;
  if (!d) return null;
  switch (d.type) {
    case 'table': return <TableRenderer data={d} />;
    case 'chart': return <ChartRenderer data={d} />;
    case 'grid':  return <GridRenderer data={d} />;
    case 'box':   return <BoxRenderer data={d} />;
    case 'text':  return <TextRenderer content={d.content} />;
    default:      return <TextRenderer content={typeof d === 'string' ? d : JSON.stringify(d)} />;
  }
}

function HistoryPanel({ messages }) {
  const structured = messages.filter(m => m.role === 'assistant' && m.data && m.data.type !== 'text' && !m.loading && !m.error);
  if (structured.length === 0) {
    return (
      <div className="history-empty">
        <div className="history-empty-icon">🗂️</div>
        <div className="history-empty-title">Visual History</div>
        <div className="history-empty-sub">Structured responses (tables, charts, grids, summaries) will stack here as you chat.</div>
        <div className="reactbits-note">✦ Powered by ReactBits ScrollStack</div>
      </div>
    );
  }
  return (
    <div className="history-panel-inner">
      <div className="history-label">
        <span>Visual History</span>
        <span className="reactbits-tag">✦ ScrollStack</span>
      </div>
      <ScrollStack
        className="history-scroll-stack"
        itemDistance={60}
        itemScale={0.04}
        itemStackDistance={20}
        stackPosition="15%"
        scaleEndPosition="8%"
        baseScale={0.88}
        blurAmount={1}
      >
        {structured.map((msg) => (
          <ScrollStackItem key={msg.id}>
            <div className="stack-card-wrap">
              <ResponseRenderer msg={msg} />
            </div>
          </ScrollStackItem>
        ))}
      </ScrollStack>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'history'
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { id: Date.now(), role: 'user', text: trimmed };
    const loadingId = Date.now() + 1;
    const assistantMsg = { id: loadingId, role: 'assistant', loading: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, loading: false, data } : m));
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, loading: false, error: err.message } : m));
    } finally {
      setLoading(false);
    }
  }, [input, apiKey, loading]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (id) => new Date(id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const structuredCount = messages.filter(m => m.role === 'assistant' && m.data && m.data.type !== 'text' && !m.loading && !m.error).length;

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <div className="logo">🤖</div>
          <h1>LLM Chat</h1>
          <span className="header-badge">Gemini</span>
        </div>
        <div className="header-center">
          <div className="reactbits-pill">
            <span>ReactBits</span>
            <span className="rb-sep">·</span>
            <span>ScrollStack</span>
            <span className="rb-sep">+</span>
            <span>SpotlightCard</span>
          </div>
        </div>
        <div className="header-right">
          <div className="status-dot" />
          <span className="status-text">Live</span>
        </div>
      </header>

      {/* API KEY BAR */}
      <div className="api-bar">
        <span className="api-label">🔑 Gemini API Key</span>
        <input
          type="password"
          placeholder="Paste your AIza... key here"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />
        <span className={`api-status ${apiKey ? 'set' : 'unset'}`}>{apiKey ? '✓ Set' : '✗ Not set'}</span>
      </div>

      {/* MAIN LAYOUT */}
      <div className="main">
        {/* LEFT SIDEBAR - Tips */}
        <aside className="sidebar">
          <div className="sidebar-label">Try These</div>
          {TIPS.map((tip, i) => (
            <button key={i} className="tip-chip" onClick={() => sendMessage(tip.text)}>
              <span className="chip-icon">{tip.icon}</span>
              <div className="chip-body">
                <span className={`chip-tag tag-${tip.tag}`}>{tip.tag}</span>
                <span className="chip-text">{tip.text}</span>
              </div>
            </button>
          ))}
        </aside>

        {/* CENTER - Chat Feed */}
        <div className="chat-area">
          {/* Mobile tab switcher */}
          <div className="tab-bar">
            <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
              Chat
            </button>
            <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              Visual Stack {structuredCount > 0 && <span className="tab-count">{structuredCount}</span>}
            </button>
          </div>

          <div className={`tab-pane ${activeTab === 'chat' ? 'shown' : 'hidden'}`}>
            <div className="messages">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <div className="empty-title">Start a conversation</div>
                  <div className="empty-sub">Ask anything. Use keywords like <b>table</b>, <b>chart</b>, <b>grid</b>, or <b>summary</b> for structured visual outputs.</div>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`message-row ${msg.role}`}>
                    <div className={`avatar ${msg.role}`}>{msg.role === 'user' ? 'Y' : '✦'}</div>
                    <div className="message-content">
                      <div className="message-meta">{formatTime(msg.id)}</div>
                      {msg.role === 'user'
                        ? <div className="user-bubble">{msg.text}</div>
                        : <ResponseRenderer msg={msg} />
                      }
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className={`tab-pane ${activeTab === 'history' ? 'shown' : 'hidden'} history-tab`}>
            <HistoryPanel messages={messages} />
          </div>

          {/* Input Bar */}
          <div className="input-bar">
            <div className="input-wrap">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Ask something... try 'table', 'chart', 'grid', or 'summary'"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={loading}
              />
              <button className="send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                {loading ? '⏳' : '➤'}
              </button>
            </div>
            <div className="input-hint">Enter to send · Shift+Enter for new line</div>
          </div>
        </div>

        {/* RIGHT PANEL - ScrollStack visual history (desktop) */}
        <div className="history-panel">
          <HistoryPanel messages={messages} />
        </div>
      </div>
    </div>
  );
}
