import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { formatTime, timeAgo, formatTimestamp, incidentTypeIcon, roleColor } from '../utils';
import FloorPlan from '../components/FloorPlan';
import { Check, LogOut, Search } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const incidents = useStore((s) => s.incidents);
  const responders = useStore((s) => s.responders);
  const guests = useStore((s) => s.guests);
  const zones = useStore((s) => s.zones);
  const selectedIncidentId = useStore((s) => s.selectedIncidentId);
  const selectIncident = useStore((s) => s.selectIncident);
  const dispatchResponder = useStore((s) => s.dispatchResponder);
  const isDrillMode = useStore((s) => s.isDrillMode);

  const [now, setNow] = useState(Date.now());
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId) || activeIncidents[0];

  const safeGuests = guests.filter((g) => g.status === 'safe').length;
  const unaccountedGuests = guests.filter((g) => g.status === 'unaccounted').length;
  const evacuatedGuests = guests.filter((g) => g.status === 'evacuated').length;

  const availableResponders = responders.filter((r) => r.status === 'available');
  const onlineResponders = responders.filter((r) => r.status !== 'offline');

  const dispatchNearest = (incidentId: string) => {
    if (availableResponders.length > 0) {
      const responder = availableResponders[0];
      dispatchResponder(responder.id, incidentId);
    }
  };

  return (
    <div className="dashboard">
      {/* Status Strip */}
      <div className="status-strip">
        <div className="status-strip-item">
          <span className="status-dot status-dot-alert animate-blink"></span>
          <span>911 notified {formatTime(now - (incidents[0]?.reportedAt || now) + 23000)} ago</span>
        </div>
        <span className="status-strip-separator">·</span>
        <div className="status-strip-item">
          <span>3 units en route</span>
        </div>
        <span className="status-strip-separator">·</span>
        <div className="status-strip-item">
          <span className="status-dot status-dot-active"></span>
          <span>{onlineResponders.length} staff online</span>
        </div>
        <span className="status-strip-separator">·</span>
        <div className="status-strip-item">
          <span>{activeIncidents.length} active incidents</span>
        </div>
        {isDrillMode && (
          <>
            <span className="status-strip-separator">·</span>
            <div className="status-strip-item">
              <span className="badge badge-amber">DRILL MODE</span>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-grid">
        {/* LEFT: Floor Plan + Guest Count */}
        <div className="dashboard-left">
          <div className="card">
            <div className="card-header">
              <h3>Venue Floor Plan</h3>
              <span className="timestamp">LIVE</span>
            </div>
            <FloorPlan
              highlightZone={selectedIncident?.zone}
              onZoneClick={(zone) => {
                const inc = activeIncidents.find((i) => i.zone === zone.id);
                if (inc) selectIncident(inc.id);
              }}
            />
          </div>

          {/* Guest Headcount */}
          <div className="card guest-count-card">
            <div className="card-header">
              <h3>Guest Headcount</h3>
              <span className="mono" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{guests.length} total</span>
            </div>
            <div className="guest-count-grid">
              <div className="guest-count-item">
                <span className="guest-count-number" style={{ color: 'var(--accent-teal)' }}>{safeGuests}</span>
                <span className="guest-count-label mono" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Check size={12} /> SAFE</span>
              </div>
              <div className="guest-count-item">
                <span className="guest-count-number" style={{ color: 'var(--accent-amber)' }}>{unaccountedGuests}</span>
                <span className="guest-count-label mono" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Search size={12} /> UNACCOUNTED</span>
              </div>
              <div className="guest-count-item">
                <span className="guest-count-number" style={{ color: 'var(--text-secondary)' }}>{evacuatedGuests}</span>
                <span className="guest-count-label mono" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LogOut size={12} /> EVACUATED</span>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE: Active Incidents */}
        <div className="dashboard-middle">
          <div className="card" style={{ height: '100%' }}>
            <div className="card-header">
              <h3>Active Incidents</h3>
              <span className="badge badge-red">{activeIncidents.length}</span>
            </div>

            <div className="incidents-list">
              {activeIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`incident-item ${selectedIncident?.id === incident.id ? 'selected' : ''}`}
                  onClick={() => selectIncident(incident.id)}
                >
                  <div className="incident-item-header">
                    <div className="flex items-center gap-sm">
                      <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
                      <span className="incident-type-icon">{incidentTypeIcon(incident.type)}</span>
                      <span className="incident-title">{incident.title}</span>
                    </div>
                  </div>
                  <div className="incident-item-meta">
                    <span className="timestamp">{formatTime(now - incident.reportedAt)} elapsed</span>
                    <span className="text-secondary">·</span>
                    <span className="text-secondary" style={{ fontSize: '12px' }}>
                      {incident.assignedResponders.length > 0
                        ? `${incident.assignedResponders.length} responder${incident.assignedResponders.length > 1 ? 's' : ''}`
                        : 'Unassigned'}
                    </span>
                  </div>

                  {incident.assignedResponders.length > 0 && (
                    <div className="incident-responders">
                      {incident.assignedResponders.map((rId) => {
                        const r = responders.find((resp) => resp.id === rId);
                        return r ? (
                          <span key={r.id} className="responder-tag" style={{ borderColor: roleColor(r.role) }}>
                            <span style={{ color: roleColor(r.role), fontSize: '10px' }}>{r.role}</span>
                            {r.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className="incident-actions">
                    <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); dispatchNearest(incident.id); }}>
                      ↗ Dispatch Nearest
                    </button>
                  </div>
                </div>
              ))}

              {activeIncidents.length === 0 && (
                <div className="empty-state">
                  <span style={{ fontSize: '32px' }}>✓</span>
                  <p>No active incidents</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Command Chat + Responders */}
        <div className="dashboard-right">
          {/* Available Responders */}
          <div className="card">
            <div className="card-header">
              <h3>Responders</h3>
              <span className="mono" style={{ color: 'var(--accent-teal)', fontSize: '12px' }}>{availableResponders.length} available</span>
            </div>
            <div className="responder-list">
              {responders.slice(0, 8).map((r) => (
                <div key={r.id} className="responder-item">
                  <div className="flex items-center gap-sm">
                    <span className={`status-dot ${r.status === 'available' ? 'status-dot-active' : r.status === 'dispatched' ? 'status-dot-alert' : 'status-dot-warning'}`}></span>
                    <span className="responder-name">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <span className="responder-role mono" style={{ color: roleColor(r.role) }}>{r.role}</span>
                    <span className="responder-zone mono">{r.currentZone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Command Chat */}
          {selectedIncident && (
            <div className="card command-chat-card">
              <div className="card-header">
                <h3>Command Chat</h3>
                <span className="mono" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                  {selectedIncident.title}
                </span>
              </div>
              <div className="command-chat-messages">
                {selectedIncident.chatMessages.slice(-8).map((msg) => (
                  <div key={msg.id} className="command-chat-msg animate-fade-in">
                    <div className="command-chat-meta">
                      <span className="command-chat-role" style={{ color: roleColor(msg.role) }}>{msg.role}</span>
                      <span className="timestamp">{formatTimestamp(msg.timestamp)}</span>
                    </div>
                    <div className="command-chat-sender">{msg.sender}</div>
                    <p className="command-chat-text">{msg.message}</p>
                  </div>
                ))}
              </div>
              <div className="command-chat-input">
                <input
                  type="text"
                  className="input"
                  placeholder="Send command message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatInput.trim()) {
                      useStore.getState().addChatMessage(selectedIncident.id, {
                        id: `chat-${Date.now()}`,
                        timestamp: Date.now(),
                        sender: 'Command Center',
                        role: 'GM',
                        message: chatInput,
                      });
                      setChatInput('');
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
