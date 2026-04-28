import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { formatTimestamp, formatTime, incidentTypeIcon, roleColor } from '../utils';
import FloorPlan from '../components/FloorPlan';
import { Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import './Handoff.css';

export default function Handoff() {
  const incidents = useStore((s) => s.incidents);
  const guests = useStore((s) => s.guests);
  const responders = useStore((s) => s.responders);
  const zones = useStore((s) => s.zones);
  const [arrived, setArrived] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const primaryIncident = activeIncidents[0];

  const guestsByZone = zones.map((zone) => ({
    zone: zone.name,
    count: guests.filter((g) => g.zone === zone.id).length,
    status: zone.status,
  }));

  const accessCodes = [
    { area: 'Main Entrance', code: '#7291' },
    { area: 'Service Elevator', code: '#4580' },
    { area: 'Emergency Stairwell', code: '#1234' },
    { area: 'Roof Access', code: '#9876' },
    { area: 'Utility Room', code: '#5555' },
  ];

  const hazards = [
    { type: 'Gas Line', location: 'Kitchen - NW corner', status: 'Active' },
    { type: 'Construction Zone', location: 'Floor 6 - East wing', status: 'Blocked' },
    { type: 'Pool Chemicals', location: 'Pool Level - Storage B', status: 'Secured' },
  ];

  return (
    <div className="handoff-container">
      {/* Header with QR */}
      <div className="handoff-header">
        <div>
          <h2>First Responder Briefing</h2>
          <p className="text-secondary" style={{ fontSize: '13px' }}>
            Live-updating incident summary for arriving paramedics & fire
          </p>
        </div>
        <div className="handoff-share">
          <div className="qr-placeholder">
            <div className="qr-grid">
              {Array.from({ length: 49 }, (_, i) => (
                <div
                  key={i}
                  className="qr-cell"
                  style={{ background: Math.random() > 0.4 ? '#F0F6FC' : 'transparent' }}
                />
              ))}
            </div>
            <span className="qr-label mono">SCAN TO ACCESS</span>
          </div>
          <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(window.location.href)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Copy size={14} /> Copy Link
          </button>
        </div>
      </div>

      {/* Mark Arrived */}
      <div className="handoff-arrival">
        {!arrived ? (
          <button className="btn btn-primary btn-lg" onClick={() => setArrived(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} /> MARK ARRIVED — Update Command Dashboard
          </button>
        ) : (
          <div className="arrived-banner">
            <span className="status-dot status-dot-active animate-pulse-teal"></span>
            <span>Arrival confirmed at {formatTimestamp(Date.now())} — Command center notified</span>
          </div>
        )}
      </div>

      <div className="handoff-grid">
        {/* Active Incident Summary */}
        <div className="card handoff-incident-card">
          <div className="card-header">
            <h3>Active Incident Summary</h3>
            <span className="timestamp">LIVE</span>
          </div>

          {primaryIncident ? (
            <div className="incident-summary">
              <div className="incident-summary-header">
                <span className={`badge badge-${primaryIncident.severity.toLowerCase()}`}>
                  {primaryIncident.severity}
                </span>
                <span className="incident-type-icon" style={{ fontSize: '20px' }}>
                  {incidentTypeIcon(primaryIncident.type)}
                </span>
                <h4>{primaryIncident.title}</h4>
              </div>
              <p className="incident-desc">{primaryIncident.description}</p>

              <div className="incident-meta-grid">
                <div className="incident-meta-item">
                  <span className="meta-label mono">LOCATION</span>
                  <span className="meta-value">{primaryIncident.location}</span>
                </div>
                <div className="incident-meta-item">
                  <span className="meta-label mono">ELAPSED</span>
                  <span className="meta-value mono">{formatTime(now - primaryIncident.reportedAt)}</span>
                </div>
                <div className="incident-meta-item">
                  <span className="meta-label mono">STATUS</span>
                  <span className="badge badge-amber">{primaryIncident.status.toUpperCase()}</span>
                </div>
                <div className="incident-meta-item">
                  <span className="meta-label mono">RESPONDERS</span>
                  <span className="meta-value">{primaryIncident.assignedResponders.length} on scene</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="incident-timeline">
                <span className="timeline-label mono">TIMELINE</span>
                {primaryIncident.timeline.map((entry) => (
                  <div key={entry.id} className="timeline-entry">
                    <span className="timeline-time mono">{formatTimestamp(entry.timestamp)}</span>
                    <span className="timeline-dot" style={{ background: roleColor(entry.role) }}></span>
                    <div className="timeline-content">
                      <span className="timeline-actor" style={{ color: roleColor(entry.role) }}>{entry.actor}</span>
                      <span className="timeline-action">{entry.action}</span>
                      {entry.detail && <span className="timeline-detail">{entry.detail}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No active incidents</p>
            </div>
          )}

          {/* Other active incidents */}
          {activeIncidents.length > 1 && (
            <div className="other-incidents">
              <span className="other-label mono">OTHER ACTIVE INCIDENTS</span>
              {activeIncidents.slice(1).map((inc) => (
                <div key={inc.id} className="other-incident-item">
                  <span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span>
                  <span>{inc.title}</span>
                  <span className="timestamp">{formatTime(now - inc.reportedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="handoff-right">
          {/* Floor Plan */}
          <div className="card">
            <div className="card-header">
              <h3>Floor Plan</h3>
            </div>
            <FloorPlan compact highlightZone={primaryIncident?.zone} />
          </div>

          {/* Guest Count by Zone */}
          <div className="card">
            <div className="card-header">
              <h3>Guest Count by Zone</h3>
            </div>
            <div className="zone-count-table">
              <div className="zone-count-header mono">
                <span>ZONE</span>
                <span>COUNT</span>
                <span>STATUS</span>
              </div>
              {guestsByZone.filter(z => z.count > 0).slice(0, 10).map((zone) => (
                <div key={zone.zone} className="zone-count-row">
                  <span>{zone.zone}</span>
                  <span className="mono">{zone.count}</span>
                  <span className={`status-dot ${zone.status === 'clear' ? 'status-dot-active' : zone.status === 'alert' ? 'status-dot-warning' : 'status-dot-alert'}`}></span>
                </div>
              ))}
            </div>
          </div>

          {/* Known Hazards */}
          <div className="card">
            <div className="card-header">
              <h3>Known Hazards</h3>
            </div>
            <div className="hazards-list">
              {hazards.map((h, i) => (
                <div key={i} className="hazard-item">
                  <span className="hazard-type" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={14} color="var(--accent-amber)" /> {h.type}</span>
                  <span className="hazard-location text-secondary">{h.location}</span>
                  <span className="badge badge-amber" style={{ fontSize: '10px' }}>{h.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Contacts */}
          <div className="card">
            <div className="card-header">
              <h3>Staff Contacts</h3>
            </div>
            <div className="contacts-list">
              {responders.filter(r => r.status !== 'offline').slice(0, 5).map((r) => (
                <div key={r.id} className="contact-item">
                  <span className="contact-name">{r.name}</span>
                  <span className="contact-role mono" style={{ color: roleColor(r.role) }}>{r.role}</span>
                  <span className="contact-zone mono">{r.currentZone}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Access Codes */}
          <div className="card">
            <div className="card-header">
              <h3>Access Codes</h3>
            </div>
            <div className="access-codes-list">
              {accessCodes.map((code, i) => (
                <div key={i} className="access-code-item">
                  <span>{code.area}</span>
                  <span className="mono" style={{ color: 'var(--accent-teal)' }}>{code.code}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
