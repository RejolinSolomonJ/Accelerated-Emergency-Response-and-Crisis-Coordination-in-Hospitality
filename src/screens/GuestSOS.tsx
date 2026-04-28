import { useState, useEffect, useRef } from 'react';
import { useStore, genId } from '../store';
import { playP1Alert, playConfirm } from '../sounds';
import { parseSOSMessage, chatWithEmergencyAI, isGeminiAvailable } from '../ai';
import { formatTimestamp } from '../utils';
import { Shield, Globe, Zap, MapPin } from 'lucide-react';
import './GuestSOS.css';

type SOSState = 'idle' | 'chatting' | 'confirming' | 'confirmed';

interface ChatMsg {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
}

export default function GuestSOS() {
  const [state, setState] = useState<SOSState>('idle');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(180);
  const [parsedData, setParsedData] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addIncident = useStore((s) => s.addIncident);
  const soundEnabled = useStore((s) => s.soundEnabled);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, streamText]);

  useEffect(() => {
    if (state === 'confirmed') {
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 0) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [state]);

  const handlePanic = () => {
    if (soundEnabled) playP1Alert();
    setState('chatting');

    // Initial AI greeting
    setChatMessages([{
      id: 'greeting',
      role: 'system',
      text: isGeminiAvailable()
        ? 'Emergency AI is connected via **Gemini 2.0 Flash**. Describe your emergency in any language — I will extract critical details and dispatch help immediately.'
        : 'Emergency AI is active. Describe your emergency in any language — I will extract critical details and dispatch help immediately.',
      timestamp: Date.now(),
    }]);
  };

  const handleSend = async () => {
    if (!message.trim() || isStreaming) return;
    const userMsg = message.trim();
    setMessage('');

    // Add user message
    const userChatMsg: ChatMsg = {
      id: genId(),
      role: 'user',
      text: userMsg,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userChatMsg]);

    // Determine if this is the FIRST user message → do SOS parsing
    const isFirstMsg = chatMessages.filter((m) => m.role === 'user').length === 0;

    if (isFirstMsg) {
      // Step 1: Parse the SOS message using Gemini
      try {
        const parsed = await parseSOSMessage(userMsg);
        setParsedData(parsed);

        // Add AI classification message
        const aiMsg: ChatMsg = {
          id: genId(),
          role: 'model',
          text: `I've analyzed your emergency message. Here's what I detected:\n\n• **Type:** ${parsed.incident_type.toUpperCase()}\n• **Location:** ${parsed.location_hint}\n• **Severity:** ${parsed.severity_1_to_5}/5${parsed.immediate_action_required ? ' — IMMEDIATE ACTION REQUIRED' : ''}\n• **Language:** ${parsed.language_detected}\n\nPlease confirm the details below to dispatch help immediately.`,
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, aiMsg]);
        setState('confirming');
      } catch (e) {
        const errorMsg: ChatMsg = {
          id: genId(),
          role: 'model',
          text: "I've received your report. Help is being dispatched. Can you provide more details about your location or what's happening?",
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, errorMsg]);
      }
      setIsStreaming(false);
    } else {
      // Subsequent messages — conversational AI chat
      setIsStreaming(true);
      setStreamText('');

      try {
        const history = chatMessages
          .filter((m) => m.role === 'user' || m.role === 'model')
          .map((m) => ({ role: m.role as 'user' | 'model', text: m.text }));

        const response = await chatWithEmergencyAI(history, userMsg, (chunk) => {
          setStreamText(chunk);
        });

        const aiMsg: ChatMsg = {
          id: genId(),
          role: 'model',
          text: response,
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, aiMsg]);
        setStreamText('');
      } catch (e) {
        const errorMsg: ChatMsg = {
          id: genId(),
          role: 'model',
          text: "Help is on the way. Please stay calm and stay where you are.",
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, errorMsg]);
      }
      setIsStreaming(false);
    }
  };

  const handleConfirm = () => {
    if (soundEnabled) playConfirm();

    const severity = parsedData?.severity_1_to_5 >= 4 ? 'P1' : parsedData?.severity_1_to_5 >= 3 ? 'P2' : 'P3';

    addIncident({
      id: genId(),
      type: parsedData?.incident_type || 'other',
      severity: severity as any,
      status: 'active',
      title: `Guest SOS — ${parsedData?.location_hint || 'Unknown Location'}`,
      description: chatMessages.find((m) => m.role === 'user')?.text || '',
      location: parsedData?.location_hint || 'Unknown',
      zone: `floor${parsedData?.location_hint?.match(/\d/)?.[0] || '1'}`,
      roomNumber: parsedData?.location_hint?.match(/\d+/)?.[0],
      reportedAt: Date.now(),
      assignedResponders: [],
      language: parsedData?.language_detected,
      timeline: [
        { id: genId(), timestamp: Date.now(), actor: 'Guest', role: 'GUEST', action: 'SOS submitted via mobile portal' },
        { id: genId(), timestamp: Date.now(), actor: 'Gemini AI', role: 'AI', action: `Classified as ${severity} ${parsedData?.incident_type}`, detail: `Language: ${parsedData?.language_detected}` },
      ],
      chatMessages: [],
    });

    setState('confirmed');
    setCountdown(180);
  };

  const handleMicToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    setIsRecording(true);
    // Simulate voice transcription
    setTimeout(() => {
      setMessage('I need help urgently! Someone is having chest pain in room 305, they can barely breathe!');
      setIsRecording(false);
    }, 2500);
  };

  const formatCountdown = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="sos-container">
      {/* Header */}
      <div className="sos-header">
        <div className="sos-header-inner">
          <div className="sos-logo">
            <div className="sos-logo-mark">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L3 8v12l11 6 11-6V8L14 2z" stroke="#1D9E75" strokeWidth="1.5" fill="rgba(29,158,117,0.1)"/>
                <path d="M14 8v4m0 4h.01" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 14h8" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 10v8" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <span className="sos-logo-text">HospitalityShield</span>
              <span className="sos-subtitle mono">GUEST EMERGENCY PORTAL</span>
            </div>
          </div>
          {isGeminiAvailable() && (
            <div className="sos-ai-badge">
              <span className="status-dot status-dot-active"></span>
              <span className="mono">Gemini AI</span>
            </div>
          )}
        </div>
      </div>

      {/* IDLE STATE — Panic Button */}
      {state === 'idle' && (
        <div className="sos-idle animate-fade-in">
          <div className="sos-hero">
            <div className="sos-hero-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" stroke="#E24B4A" strokeWidth="1.5" fill="rgba(226,75,74,0.05)"/>
                <path d="M24 16v8" stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="24" cy="30" r="1.5" fill="#E24B4A"/>
              </svg>
            </div>
            <h1 className="sos-hero-title">Emergency Assistance</h1>
            <p className="sos-hero-desc">
              If you are experiencing an emergency, press the button below. 
              Help will be dispatched to your location immediately.
            </p>
          </div>

          <button className="panic-button" onClick={handlePanic} id="sos-panic-btn">
            <div className="panic-button-ring"></div>
            <div className="panic-button-inner">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span className="panic-text">EMERGENCY SOS</span>
              <span className="panic-subtext">TAP TO ACTIVATE</span>
            </div>
          </button>

          <div className="sos-features">
            <div className="sos-feature">
              <span className="sos-feature-icon"><Globe size={14} /></span>
              <span>Multilingual AI</span>
            </div>
            <div className="sos-feature">
              <span className="sos-feature-icon"><Zap size={14} /></span>
              <span>Instant dispatch</span>
            </div>
            <div className="sos-feature">
              <span className="sos-feature-icon"><MapPin size={14} /></span>
              <span>Auto-location</span>
            </div>
          </div>
        </div>
      )}

      {/* CHATTING / CONFIRMING STATE */}
      {(state === 'chatting' || state === 'confirming') && (
        <div className="sos-chat animate-slide-up">
          <div className="sos-chat-status">
            <div className="sos-chat-status-left">
              <span className="status-dot status-dot-active animate-pulse-teal"></span>
              <span className="sos-chat-status-text">Emergency AI Active</span>
            </div>
            {isGeminiAvailable() && (
              <span className="sos-model-tag mono">gemini-2.0-flash</span>
            )}
          </div>

          <div className="sos-chat-body">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`sos-msg sos-msg-${msg.role} animate-fade-in`}>
                <div className="sos-msg-header">
                  <span className="sos-msg-role mono">
                    {msg.role === 'user' ? 'YOU' : msg.role === 'model' ? 'AI ASSISTANT' : 'SYSTEM'}
                  </span>
                  <span className="sos-msg-time mono">{formatTimestamp(msg.timestamp)}</span>
                </div>
                <div className="sos-msg-text">{msg.text.split('\n').map((line, i) => {
                  // Simple markdown bold rendering
                  const parts = line.split(/\*\*(.*?)\*\*/g);
                  return (
                    <p key={i}>
                      {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
                    </p>
                  );
                })}</div>
              </div>
            ))}

            {/* Streaming AI response */}
            {isStreaming && streamText && (
              <div className="sos-msg sos-msg-model animate-fade-in">
                <div className="sos-msg-header">
                  <span className="sos-msg-role mono">AI ASSISTANT</span>
                  <span className="sos-typing-indicator">●●●</span>
                </div>
                <div className="sos-msg-text"><p>{streamText}</p></div>
              </div>
            )}

            {/* Loading streaming indicators or confirmation card */}

            {/* Confirmation Card */}
            {state === 'confirming' && parsedData && (
              <div className="sos-confirm animate-slide-up">
                <div className="sos-confirm-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <h3>Emergency Detected</h3>
                </div>
                <div className="sos-confirm-grid">
                  <div className="sos-confirm-item">
                    <span className="sos-confirm-label mono">TYPE</span>
                    <span className="sos-confirm-value">{parsedData.incident_type?.toUpperCase()}</span>
                  </div>
                  <div className="sos-confirm-item">
                    <span className="sos-confirm-label mono">LOCATION</span>
                    <span className="sos-confirm-value">{parsedData.location_hint}</span>
                  </div>
                  <div className="sos-confirm-item">
                    <span className="sos-confirm-label mono">SEVERITY</span>
                    <span className={`badge badge-p${parsedData.severity_1_to_5 >= 4 ? '1' : parsedData.severity_1_to_5 >= 3 ? '2' : '3'}`}>
                      P{parsedData.severity_1_to_5 >= 4 ? '1' : parsedData.severity_1_to_5 >= 3 ? '2' : '3'} — {parsedData.severity_1_to_5}/5
                    </span>
                  </div>
                  <div className="sos-confirm-item">
                    <span className="sos-confirm-label mono">LANGUAGE</span>
                    <span className="sos-confirm-value">{parsedData.language_detected}</span>
                  </div>
                </div>
                <button className="btn btn-danger btn-lg sos-dispatch-btn" onClick={handleConfirm}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3"/>
                  </svg>
                  CONFIRM — DISPATCH EMERGENCY TEAM
                </button>
              </div>
            )}

            {/* Loading skeleton */}
            {isStreaming && !parsedData && (
              <div className="sos-msg sos-msg-model">
                <div className="sos-msg-header">
                  <span className="sos-msg-role mono">AI ASSISTANT</span>
                  <span className="sos-typing-indicator animate-blink">●●●</span>
                </div>
                <div className="sos-skeleton-lines">
                  <div className="skeleton" style={{ height: '14px', width: '85%' }}></div>
                  <div className="skeleton" style={{ height: '14px', width: '60%', marginTop: '8px' }}></div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          {(state === 'chatting' || state === 'confirming') && (
            <div className="sos-chat-input">
              <button
                className={`sos-mic-btn ${isRecording ? 'recording' : ''}`}
                onClick={handleMicToggle}
                title="Voice SOS"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                className="input sos-input"
                placeholder={state === 'confirming' ? 'Add more details or confirm above...' : 'Describe your emergency...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isStreaming}
                autoFocus
              />
              <button className="sos-send-btn" onClick={handleSend} disabled={!message.trim() || isStreaming}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMED STATE */}
      {state === 'confirmed' && (
        <div className="sos-confirmed animate-slide-up">
          <div className="sos-confirmed-hero">
            <div className="sos-confirmed-check">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2>Help is on the way</h2>
            <p className="sos-confirmed-desc">Your location has been shared with our emergency team. Stay where you are.</p>
          </div>

          <div className="sos-countdown">
            <div className="sos-countdown-label mono">ESTIMATED ARRIVAL</div>
            <div className="sos-countdown-timer mono">{formatCountdown(countdown)}</div>
            <div className="sos-countdown-bar">
              <div className="sos-countdown-fill" style={{ width: `${((180 - countdown) / 180) * 100}%` }} />
            </div>
          </div>

          <div className="sos-confirmed-info">
            <div className="sos-info-row">
              <span className="sos-info-label mono">INCIDENT ID</span>
              <span className="sos-info-value mono">HS-{Date.now().toString().slice(-6)}</span>
            </div>
            <div className="sos-info-row">
              <span className="sos-info-label mono">STATUS</span>
              <div className="flex items-center gap-xs">
                <span className="status-dot status-dot-active animate-pulse-teal"></span>
                <span className="sos-info-value">RESPONDERS DISPATCHED</span>
              </div>
            </div>
            <div className="sos-info-row">
              <span className="sos-info-label mono">911</span>
              <span className="sos-info-value">Notified automatically</span>
            </div>
            <div className="sos-info-row">
              <span className="sos-info-label mono">AI MODEL</span>
              <span className="sos-info-value mono">{isGeminiAvailable() ? 'Gemini 2.0 Flash' : 'Local Triage'}</span>
            </div>
          </div>

          <div className="sos-confirmed-tips">
            <h4>While you wait:</h4>
            <ul>
              <li>Stay where you are if safe to do so</li>
              <li>Keep this screen open — it updates in real time</li>
              <li>If the situation changes, tap below to update</li>
            </ul>
          </div>

          <button className="btn sos-update-btn" onClick={() => setState('chatting')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            Update Emergency Details
          </button>
        </div>
      )}
    </div>
  );
}
