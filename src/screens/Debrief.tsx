import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { formatTimestamp, formatTime, roleColor, incidentTypeIcon } from '../utils';
import { generateIncidentReport, isGeminiAvailable } from '../ai';
import { Sparkles, CheckSquare, Square, Check, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Debrief.css';

export default function Debrief() {
  const incidents = useStore((s) => s.incidents);
  const [selectedIncident, setSelectedIncident] = useState(incidents[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportText, setReportText] = useState('');
  const [showReport, setShowReport] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    setShowReport(true);
    setReportText('');

    try {
      const report = await generateIncidentReport(
        {
          title: selectedIncident.title,
          type: selectedIncident.type,
          severity: selectedIncident.severity,
          description: selectedIncident.description,
          location: selectedIncident.location,
          reportedAt: selectedIncident.reportedAt,
          resolvedAt: selectedIncident.resolvedAt,
          timeline: selectedIncident.timeline.map((t) => ({
            timestamp: t.timestamp,
            actor: t.actor,
            role: t.role,
            action: t.action,
            detail: t.detail,
          })),
        },
        (chunk) => setReportText(chunk)
      );
      setReportText(report);
    } catch (e) {
      setReportText('Error generating report. Please try again.');
    }
    setIsGenerating(false);
  };

  const responseGaps = [
    {
      metric: 'First Responder Arrival',
      actual: '4:12',
      target: '2:00',
      delta: '+2:12',
      status: 'over',
      detail: 'AED retrieved from wrong floor station. Consider Floor 4 AED install.',
    },
    {
      metric: 'Total Response Time',
      actual: '6:39',
      target: '5:00',
      delta: '+1:39',
      status: 'over',
      detail: 'Elevator not pre-reserved until T+4:00. Implement auto-reservation.',
    },
    {
      metric: 'Detection to Alert',
      actual: '0:12',
      target: '0:15',
      delta: '-0:03',
      status: 'pass',
      detail: 'AI triage performed within expected timeframe.',
    },
    {
      metric: '911 Notification',
      actual: '1:30',
      target: '2:00',
      delta: '-0:30',
      status: 'pass',
      detail: 'Automatic 911 notification triggered successfully.',
    },
  ];

  return (
    <div className="debrief-container">
      <div className="debrief-header">
        <div>
          <h2>Post-Incident AI Debrief</h2>
          <p className="text-secondary" style={{ fontSize: '13px' }}>
            Auto-generated analysis with response gaps, compliance, and training recommendations
          </p>
        </div>
        <div className="debrief-controls">
          <select
            className="select"
            value={selectedIncident.id}
            onChange={(e) => {
              const inc = incidents.find((i) => i.id === e.target.value);
              if (inc) setSelectedIncident(inc);
            }}
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.severity} — {inc.title}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={generateReport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isGenerating ? <><RefreshCw size={14} className="spin" /> Generating...</> : <><Sparkles size={14} /> Generate AI Report</>}
          </button>
          {isGeminiAvailable() && (
            <span className="mono" style={{ fontSize: '10px', color: 'var(--accent-teal)', padding: '4px 8px', border: '1px solid rgba(29,158,117,0.2)', borderRadius: '4px' }}>Gemini AI</span>
          )}
          <button className="btn" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      <div className="debrief-grid">
        {/* Timeline */}
        <div className="card debrief-timeline-card">
          <div className="card-header">
            <h3>Incident Timeline</h3>
            <span className={`badge badge-${selectedIncident.severity.toLowerCase()}`}>
              {selectedIncident.severity}
            </span>
          </div>

          <div className="debrief-incident-info">
            <span className="incident-type-icon" style={{ fontSize: '24px' }}>
              {incidentTypeIcon(selectedIncident.type)}
            </span>
            <div>
              <h4>{selectedIncident.title}</h4>
              <p className="text-secondary" style={{ fontSize: '13px' }}>{selectedIncident.description}</p>
            </div>
          </div>

          <div className="debrief-timeline">
            {selectedIncident.timeline.map((entry, i) => (
              <div key={entry.id} className="debrief-timeline-entry animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="debrief-tl-time mono">{formatTimestamp(entry.timestamp)}</div>
                <div className="debrief-tl-line">
                  <div className="debrief-tl-dot" style={{ background: roleColor(entry.role) }}></div>
                  {i < selectedIncident.timeline.length - 1 && <div className="debrief-tl-connector"></div>}
                </div>
                <div className="debrief-tl-content">
                  <div className="debrief-tl-actor">
                    <span style={{ color: roleColor(entry.role) }}>[{entry.role}]</span>
                    <span>{entry.actor}</span>
                  </div>
                  <p className="debrief-tl-action">{entry.action}</p>
                  {entry.detail && <p className="debrief-tl-detail">{entry.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Gaps + Training */}
        <div className="debrief-right">
          {/* Response Gaps */}
          <div className="card">
            <div className="card-header">
              <h3>Response Gaps</h3>
            </div>
            <div className="gaps-list">
              {responseGaps.map((gap, i) => (
                <div key={i} className={`gap-item ${gap.status === 'over' ? 'gap-over' : 'gap-pass'}`}>
                  <div className="gap-header">
                    <span className="gap-metric">{gap.metric}</span>
                    <span className={`gap-delta mono ${gap.status === 'over' ? 'gap-delta-over' : 'gap-delta-pass'}`}>
                      {gap.delta}
                    </span>
                  </div>
                  <div className="gap-times">
                    <span className="mono">Actual: {gap.actual}</span>
                    <span className="text-secondary">·</span>
                    <span className="mono">Target: {gap.target}</span>
                  </div>
                  <p className="gap-detail">{gap.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Training Recommendations */}
          <div className="card">
            <div className="card-header">
              <h3>Training Recommendations</h3>
            </div>
            <div className="training-list">
              <div className="training-item">
                <span className="training-name">Sarah Chen</span>
                <span className="training-role mono" style={{ color: roleColor('MEDICAL') }}>MEDICAL</span>
                <p className="training-rec">Refresher on floor-specific AED placement locations. Current retrieval time exceeds target.</p>
              </div>
              <div className="training-item">
                <span className="training-name">All Security Staff</span>
                <span className="training-role mono" style={{ color: roleColor('SECURITY') }}>SECURITY</span>
                <p className="training-rec">Drill on elevator reservation protocol during P1 medical emergency scenarios.</p>
              </div>
              <div className="training-item pass">
                <span className="training-name">Lisa Park</span>
                <span className="training-role mono" style={{ color: roleColor('FRONT DESK') }}>FRONT DESK</span>
                <p className="training-rec" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} color="var(--accent-teal)" /> Excellent paramedic coordination. No additional training required.</p>
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div className="card">
            <div className="card-header">
              <h3>Compliance Export</h3>
            </div>
            <div className="compliance-list">
              <div className="compliance-item">
                <span className="compliance-check"><Square size={16} /></span>
                <span>OSHA Form 301 — Workplace incident documentation</span>
              </div>
              <div className="compliance-item">
                <span className="compliance-check"><Square size={16} /></span>
                <span>Insurance notification — required within 24 hours</span>
              </div>
              <div className="compliance-item">
                <span className="compliance-check done"><CheckSquare size={16} /></span>
                <span>Guest consent for medical records sharing</span>
              </div>
              <div className="compliance-item">
                <span className="compliance-check done"><CheckSquare size={16} /></span>
                <span>Body camera footage preserved (90-day retention)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Generated Report */}
      {showReport && (
        <div className="card ai-report-card animate-slide-up" style={{ marginTop: 'var(--space-md)' }}>
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={16} color="var(--accent-primary)" /> AI-Generated Narrative Report</h3>
            <div className="flex items-center gap-sm">
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{isGeminiAvailable() ? 'gemini-2.0-flash' : 'local-fallback'}</span>
              {isGenerating && <span className="animate-blink" style={{ color: 'var(--accent-teal)' }}>●</span>}
            </div>
          </div>
          <div className="ai-report-content">
            {reportText ? (
              <div className="ai-report-text markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportText}</ReactMarkdown>
              </div>
            ) : (
              <div className="skeleton-lines">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="skeleton" style={{ height: '14px', width: `${60 + Math.random() * 40}%`, marginBottom: '8px' }}></div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
