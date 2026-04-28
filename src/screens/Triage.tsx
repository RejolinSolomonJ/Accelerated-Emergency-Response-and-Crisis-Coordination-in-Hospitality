import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { formatTimestamp, timeAgo, roleColor } from '../utils';
import { Video, Smartphone, Radio, Hand, AlertTriangle } from 'lucide-react';
import './Triage.css';

export default function Triage() {
  const { signals, updateSignalPriority, processSignal, addIncident } = useStore();
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeSignals = signals.filter(s => !s.processed).sort((a, b) => {
    if (a.assignedPriority === 'P1' && b.assignedPriority !== 'P1') return -1;
    if (b.assignedPriority === 'P1' && a.assignedPriority !== 'P1') return 1;
    return b.timestamp - a.timestamp;
  });

  const p1Count = activeSignals.filter(s => s.assignedPriority === 'P1').length;
  const p2Count = activeSignals.filter(s => s.assignedPriority === 'P2').length;
  const p3Count = activeSignals.filter(s => s.assignedPriority === 'P3').length;

  const handleDispatch = (signal: any, e: React.MouseEvent) => {
    e.stopPropagation();
    processSignal(signal.id);
    
    addIncident({
      id: `inc-${Math.floor(Math.random() * 10000)}`,
      type: signal.threatCategory.includes('medical') ? 'medical' : 
            signal.threatCategory.includes('fire') ? 'fire' : 'security',
      severity: signal.assignedPriority || 'P2',
      status: 'responding',
      title: signal.aiClassification || 'Unclassified Event',
      description: signal.rawInput,
      location: 'Determining...', 
      zone: 'lobby',
      reportedAt: signal.timestamp,
      assignedResponders: [],
      timeline: [
        { id: `tl-${Date.now()}`, timestamp: signal.timestamp, actor: 'System', role: 'SYSTEM', action: `Signal ${signal.source} detected` },
        { id: `tl-${Date.now()+1}`, timestamp: Date.now(), actor: 'Command Desk', role: 'GM', action: 'Signal escalated to Active Incident' }
      ],
      chatMessages: []
    });
  };

  const sourceIcon = (source: string) => {
    switch (source) {
      case 'CCTV': return <Video size={16} />;
      case 'SOS_TEXT': return <Smartphone size={16} />;
      case 'SENSOR': return <Radio size={16} />;
      case 'MANUAL': return <Hand size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  const sourceLabel = (source: string) => {
    switch (source) {
      case 'CCTV': return 'CCTV Anomaly';
      case 'SOS_TEXT': return 'SOS Text';
      case 'SENSOR': return 'Sensor Trigger';
      case 'MANUAL': return 'Manual Report';
      default: return source;
    }
  };

  return (
    <div className="triage-container">
      <div className="triage-header">
        <div>
          <h2>AI Triage Engine</h2>
          <p className="text-secondary" style={{ fontSize: '13px' }}>Live feed of incoming signals — AI-classified and prioritized in real time</p>
        </div>
        <div className="triage-stats">
          <div className="triage-stat">
            <span className="triage-stat-number mono">{activeSignals.length}</span>
            <span className="triage-stat-label mono">SIGNALS</span>
          </div>
          <div className="triage-stat">
            <span className="triage-stat-number mono" style={{ color: 'var(--accent-red)' }}>
              {p1Count}
            </span>
            <span className="triage-stat-label mono">P1</span>
          </div>
          <div className="triage-stat">
            <span className="triage-stat-number mono" style={{ color: 'var(--accent-amber)' }}>
              {p2Count}
            </span>
            <span className="triage-stat-label mono">P2</span>
          </div>
          <div className="triage-stat">
            <span className="triage-stat-number mono" style={{ color: 'var(--accent-teal)' }}>
              {p3Count}
            </span>
            <span className="triage-stat-label mono">P3</span>
          </div>
        </div>
      </div>

      {/* Severity Scoring Formula */}
      <div className="scoring-formula card-compact">
        <span className="scoring-label mono">SEVERITY SCORING</span>
        <code className="scoring-code mono">
          score = (weight × 0.4) + (density × 0.3) + (type_factor × 0.3) | threshold: P1 ≥ 0.85 · P2 ≥ 0.60 · P3 &lt; 0.60
        </code>
      </div>

      {/* Signal Feed */}
      <div className="signal-feed">
        {activeSignals.map((signal, index) => (
          <div
            key={signal.id}
            className={`signal-card ${signal.assignedPriority ? signal.assignedPriority.toLowerCase() : ''} animate-slide-right ${expandedSignal === signal.id ? 'expanded' : ''}`}
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => setExpandedSignal(expandedSignal === signal.id ? null : signal.id)}
          >
            <div className="signal-card-top">
              <div className="signal-source">
                <span className="signal-source-icon">{sourceIcon(signal.source)}</span>
                <span className="signal-source-label mono">{sourceLabel(signal.source)}</span>
                <span className="timestamp">{formatTimestamp(signal.timestamp)}</span>
              </div>
              <div className="flex items-center gap-sm">
                {signal.assignedPriority && (
                  <span className={`badge badge-${signal.assignedPriority.toLowerCase()}`}>
                    {signal.assignedPriority}
                  </span>
                )}
                {signal.confidence !== undefined && (
                  <span className="confidence-badge mono">
                    {(signal.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            <div className="signal-body">
              <div className="signal-raw-input">
                <span className="signal-raw-label mono">RAW INPUT</span>
                <p className="signal-text">{signal.rawInput}</p>
              </div>
            </div>

            {signal.aiClassification && (
              <div className="signal-classification">
                <span className="signal-class-label mono">AI CLASSIFICATION</span>
                <span className="signal-class-value">{signal.aiClassification}</span>
              </div>
            )}

            {/* Expanded view - Gemini API call demo */}
            {expandedSignal === signal.id && (
              <div className="signal-expanded animate-slide-up">
                <div className="api-call-block">
                  <div className="api-call-header mono">
                    <span className="api-call-label">GEMINI AI CALL</span>
                    <span className="api-call-model">gemini-2.0-flash</span>
                  </div>

                  <div className="api-prompt">
                    <span className="api-section-label mono">PROMPT</span>
                    <pre className="api-code mono">{`System: "You are an emergency triage AI.
Classify the following signal input.
Return JSON: {threat_category, confidence,
recommended_response, dispatch_roles[],
estimated_affected_guests}"

User: "${signal.rawInput}"`}</pre>
                  </div>

                  <div className="api-response">
                    <span className="api-section-label mono">RESPONSE</span>
                    <pre className="api-code mono">{JSON.stringify({
                      threat_category: signal.threatCategory,
                      confidence: signal.confidence,
                      recommended_response: signal.recommendedResponse,
                      dispatch_roles: signal.dispatchRoles,
                      estimated_affected_guests: signal.estimatedAffected,
                    }, null, 2)}</pre>
                  </div>
                </div>

                {/* Override controls */}
                <div className="signal-override">
                  <span className="override-label">Manual Override:</span>
                  <div className="override-buttons">
                    <button
                      className={`btn btn-sm ${signal.assignedPriority === 'P1' ? 'btn-danger' : ''}`}
                      onClick={(e) => { e.stopPropagation(); updateSignalPriority(signal.id, 'P1'); }}
                    >
                      ↑ Escalate P1
                    </button>
                    <button
                      className={`btn btn-sm ${signal.assignedPriority === 'P2' ? 'btn-amber' : ''}`}
                      onClick={(e) => { e.stopPropagation(); updateSignalPriority(signal.id, 'P2'); }}
                    >
                      P2
                    </button>
                    <button
                      className={`btn btn-sm ${signal.assignedPriority === 'P3' ? 'btn-teal' : ''}`}
                      onClick={(e) => { e.stopPropagation(); updateSignalPriority(signal.id, 'P3'); }}
                    >
                      ↓ Downgrade P3
                    </button>
                  </div>
                </div>

                {signal.dispatchRoles && signal.dispatchRoles.length > 0 && (
                  <div className="signal-dispatch-roles">
                    <span className="dispatch-label mono">RECOMMENDED DISPATCH</span>
                    <div className="dispatch-role-tags">
                      {signal.dispatchRoles.map((role) => (
                        <span key={role} className="dispatch-role-tag" style={{ color: roleColor(role), borderColor: roleColor(role) }}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {signal.recommendedResponse && (
                  <div className="signal-recommendation">
                    <span className="rec-label mono">RECOMMENDED ACTION</span>
                    <p>{signal.recommendedResponse}</p>
                  </div>
                )}
                
                <div className="triage-signal-actions" style={{ marginTop: '16px' }}>
                  <button className="btn btn-primary" onClick={(e) => handleDispatch(signal, e)}>
                    Accept & Dispatch System →
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
