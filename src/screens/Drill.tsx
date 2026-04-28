import { useState, useEffect, useRef } from 'react';
import { useStore, genId } from '../store';
import { formatTimestamp, formatTime, roleColor } from '../utils';
import FloorPlan from '../components/FloorPlan';
import { Flame, Stethoscope, Shield, Waves, Zap, Video, Radio, Smartphone, AlertTriangle, PlaySquare, ArrowLeft } from 'lucide-react';
import './Drill.css';

type DrillScenario = 'fire' | 'medical' | 'active_threat' | 'flood' | 'power_failure';

interface DrillEvent {
  id: string;
  timestamp: number;
  description: string;
  expectedAction: string;
  role: string;
  timeLimit: number;
  completed: boolean;
  response?: string;
  responseTime?: number;
  passed?: boolean;
}

const scenarioDescriptions: Record<DrillScenario, { title: string; icon: React.ReactNode; description: string }> = {
  fire: { title: 'Fire Emergency', icon: <Flame size={40} />, description: 'Kitchen grease fire spreads to ventilation. Full evacuation required.' },
  medical: { title: 'Mass Medical Event', icon: <Stethoscope size={40} />, description: 'Food poisoning outbreak affecting 15+ guests at banquet. Multiple casualties.' },
  active_threat: { title: 'Active Threat', icon: <Shield size={40} />, description: 'Armed individual reported in lobby. Lockdown procedures required.' },
  flood: { title: 'Flooding Emergency', icon: <Waves size={40} />, description: 'Basement pipe burst. Water rising. Electrical hazard on floors 1-2.' },
  power_failure: { title: 'Total Power Failure', icon: <Zap size={40} />, description: 'Complete grid failure. Backup generators failing. Elevator entrapments. Guest panic.' },
};

const scenarioEvents: Record<DrillScenario, Omit<DrillEvent, 'id' | 'timestamp' | 'completed'>[]> = {
  fire: [
    { description: '[ALERT] FIRE ALARM: Kitchen smoke detectors activated. Visible flames on cooking station 3.', expectedAction: 'Activate fire suppression system', role: 'MAINTENANCE', timeLimit: 30 },
    { description: '[SENSOR] Smoke spreading to ventilation shaft. Temperature rising in adjacent corridors.', expectedAction: 'Initiate floor-by-floor evacuation starting from ground level', role: 'SECURITY', timeLimit: 60 },
    { description: '[CCTV] 8 guests still in pool area, unaware of alarm. Pool PA system offline.', expectedAction: 'Dispatch security to physically evacuate pool area', role: 'SECURITY', timeLimit: 45 },
    { description: '[SOS] Guest in Room 305 reports smoke under door. Wheelchair user, needs assistance.', expectedAction: 'Dispatch medical + evacuation chair to Room 305', role: 'MEDICAL', timeLimit: 60 },
    { description: '[WARNING] Fire dept reports ETA 8 minutes. Flames now in ventilation. Floor 1-3 compromised.', expectedAction: 'Escalate evacuation. Account for all guests floors 1-3. Stage at muster point.', role: 'GM', timeLimit: 90 },
    { description: '[SENSOR] Sprinkler system activated Floor 2. Electrical panel at risk.', expectedAction: 'Kill power to Floor 2 electrical panel', role: 'MAINTENANCE', timeLimit: 45 },
  ],
  medical: [
    { description: '[SOS] 3 guests reporting severe nausea in Banquet Hall B.', expectedAction: 'Dispatch medical team to Banquet Hall', role: 'MEDICAL', timeLimit: 45 },
    { description: '[SOS] 5 more guests now symptomatic. Suspect food poisoning from evening meal.', expectedAction: 'Notify 911. Request multiple ambulance units.', role: 'GM', timeLimit: 60 },
    { description: '[CCTV] Guest collapsed near elevator on Floor 3. Unconscious.', expectedAction: 'Dispatch medical with AED to Floor 3 elevator bay', role: 'MEDICAL', timeLimit: 30 },
    { description: '[WARNING] Kitchen confirms potential contamination in shrimp appetizer. 85 portions served.', expectedAction: 'Isolate food source. Identify all affected guests.', role: 'FRONT DESK', timeLimit: 60 },
    { description: '[SOS] Elderly guest in Room 812 in anaphylactic shock.', expectedAction: 'Priority medical dispatch. EpiPen from Floor 8 station.', role: 'MEDICAL', timeLimit: 30 },
    { description: '[WARNING] Health Dept notified. 12 guests now in medical distress.', expectedAction: 'Set up triage area in lobby. Coordinate with arriving paramedics.', role: 'MEDICAL', timeLimit: 90 },
  ],
  active_threat: [
    { description: '[CCTV] Individual with concealed object in lobby. Aggressive posture. Threatening staff.', expectedAction: 'Initiate lockdown. Discreet security approach.', role: 'SECURITY', timeLimit: 30 },
    { description: '[SOS] Front desk staff reports threat of violence. Individual demanding access to room.', expectedAction: 'Notify 911 immediately. Silent alarm.', role: 'GM', timeLimit: 30 },
    { description: '[WARNING] LOCKDOWN: All floors notified. Shelter-in-place protocol active.', expectedAction: 'Verify all stairwell and service doors secured', role: 'SECURITY', timeLimit: 60 },
    { description: '[CCTV] Individual moving toward elevator bank. 3 guests in direct path.', expectedAction: 'Elevator lockout. Verbal intercept by trained security.', role: 'SECURITY', timeLimit: 30 },
    { description: '[SOS] Guests on Floor 2 reporting loud noises. Panic spreading.', expectedAction: 'Update PA system: maintain shelter-in-place. Reassure guests.', role: 'FRONT DESK', timeLimit: 45 },
    { description: '[WARNING] Police ETA 4 minutes. Individual contained in lobby.', expectedAction: 'Maintain perimeter. Prepare access for law enforcement.', role: 'SECURITY', timeLimit: 60 },
  ],
  flood: [
    { description: '[SENSOR] Abnormal water flow detected in basement. Pressure dropping.', expectedAction: 'Dispatch maintenance to locate source. Shut off main valve.', role: 'MAINTENANCE', timeLimit: 60 },
    { description: '[SENSOR] Water level rising in parking garage. Electrical room at risk.', expectedAction: 'Kill power to basement level. Activate sump pumps.', role: 'MAINTENANCE', timeLimit: 45 },
    { description: '[CCTV] Water seepage visible on Floor 1 lobby. Guest belongings at risk.', expectedAction: 'Deploy sand barriers. Relocate guests from lobby to upper floors.', role: 'FRONT DESK', timeLimit: 60 },
    { description: '[SOS] Guest in Room 102 reports water under door.', expectedAction: 'Evacuate Floor 1 rooms 101-120.', role: 'SECURITY', timeLimit: 60 },
    { description: '[WARNING] Municipal water authority notified. Break in main supply line.', expectedAction: 'Coordinate with utility company. ETA for shutoff.', role: 'GM', timeLimit: 90 },
    { description: '[SENSOR] Electrical hazard confirmed Floor 1 corridor B.', expectedAction: 'Block access to corridor B. Redirect all traffic via corridor A.', role: 'SECURITY', timeLimit: 30 },
  ],
  power_failure: [
    { description: '[ALERT] Total grid power failure. UPS engaged. Backup generators starting.', expectedAction: 'Verify generator status. Prioritize emergency lighting.', role: 'MAINTENANCE', timeLimit: 60 },
    { description: '[SENSOR] Elevator ELV-2 stopped between Floors 6-7. 4 guests trapped.', expectedAction: 'Initiate elevator rescue protocol. Establish intercom contact.', role: 'MAINTENANCE', timeLimit: 45 },
    { description: '[SOS] Guest on Life-support equipment in Room 903. Needs immediate power.', expectedAction: 'Priority: Connect Room 903 to generator circuit. Dispatch medical.', role: 'MEDICAL', timeLimit: 30 },
    { description: '[CCTV] Guests gathering in dark corridors Floors 4-5. Confusion/panic.', expectedAction: 'Deploy staff with emergency lighting. Guide guests to safe areas.', role: 'SECURITY', timeLimit: 60 },
    { description: '[WARNING] Backup generator 2 offline. Only 40% emergency power available.', expectedAction: 'Prioritize critical systems. Shut down non-essential loads.', role: 'MAINTENANCE', timeLimit: 60 },
    { description: '[ALERT] Power company ETA: 45 minutes. Second generator failing.', expectedAction: 'Prepare for extended outage. Consider partial evacuation of upper floors.', role: 'GM', timeLimit: 90 },
  ],
};

export default function Drill() {
  const [selectedScenario, setSelectedScenario] = useState<DrillScenario | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [events, setEvents] = useState<DrillEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const startTimeRef = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning) {
      timer = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || !selectedScenario) return;

    const scenarioEvts = scenarioEvents[selectedScenario];
    if (currentEventIndex >= scenarioEvts.length - 1) return;

    const timer = setTimeout(() => {
      const nextIndex = currentEventIndex + 1;
      const evt = scenarioEvts[nextIndex];
      const newEvent: DrillEvent = {
        ...evt,
        id: genId(),
        timestamp: Date.now(),
        completed: false,
      };
      setEvents((prev) => [...prev, newEvent]);
      setCurrentEventIndex(nextIndex);
    }, currentEventIndex === -1 ? 1000 : 8000 + Math.random() * 4000);

    return () => clearTimeout(timer);
  }, [isRunning, currentEventIndex, selectedScenario]);

  const startDrill = (scenario: DrillScenario) => {
    setSelectedScenario(scenario);
    setIsRunning(true);
    setEvents([]);
    setCurrentEventIndex(-1);
    setElapsedTime(0);
    setShowResults(false);
    startTimeRef.current = Date.now();
  };

  const respondToEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId && !e.completed) {
          const responseTime = (Date.now() - e.timestamp) / 1000;
          return {
            ...e,
            completed: true,
            responseTime,
            passed: responseTime <= e.timeLimit,
            response: e.expectedAction,
          };
        }
        return e;
      })
    );
  };

  const endDrill = () => {
    setIsRunning(false);
    setShowResults(true);
  };

  const totalScore = events.length > 0
    ? Math.round((events.filter((e) => e.passed).length / events.length) * 100)
    : 0;

  const allEvents = events;
  const pendingEvents = events.filter((e) => !e.completed);
  const completedEvents = events.filter((e) => e.completed);

  return (
    <div className="drill-container">
      {/* Not started — Scenario Selection */}
      {!isRunning && !showResults && (
        <div className="drill-selection animate-fade-in">
          <div className="drill-selection-header">
            <h2>Drill Simulation Mode</h2>
            <p className="text-secondary">Select a scenario to begin. AI will inject realistic events into the live dashboard. Staff respond as if real — the system scores every decision.</p>
          </div>

          <div className="scenario-grid">
            {(Object.entries(scenarioDescriptions) as [DrillScenario, typeof scenarioDescriptions.fire][]).map(([key, scenario]) => (
              <div key={key} className="scenario-card" onClick={() => startDrill(key)}>
                <span className="scenario-icon">{scenario.icon}</span>
                <h3>{scenario.title}</h3>
                <p>{scenario.description}</p>
                <div className="scenario-meta mono">
                  <span>{scenarioEvents[key].length} events</span>
                  <span>·</span>
                  <span>~{Math.round(scenarioEvents[key].length * 10 / 60)}–{Math.round(scenarioEvents[key].length * 15 / 60)} min</span>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                  Start Drill
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Running Drill */}
      {isRunning && selectedScenario && (
        <div className="drill-active">
          {/* Drill Header */}
          <div className="drill-active-header">
            <div className="flex items-center gap-md">
              <span className="scenario-icon-sm">{scenarioDescriptions[selectedScenario].icon}</span>
              <div>
                <h2>{scenarioDescriptions[selectedScenario].title}</h2>
                <span className="badge badge-amber">DRILL IN PROGRESS</span>
              </div>
            </div>
            <div className="drill-timer">
              <span className="drill-timer-label mono">ELAPSED</span>
              <span className="drill-timer-value mono">{formatTime(elapsedTime)}</span>
            </div>
            <button className="btn btn-danger" onClick={endDrill} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><PlaySquare size={16} /> End Drill</button>
          </div>

          <div className="drill-active-grid">
            {/* Event Feed */}
            <div className="card drill-events-card">
              <div className="card-header">
                <h3>Incoming Events</h3>
                <span className="badge badge-red animate-blink">{pendingEvents.length} pending</span>
              </div>
              <div className="drill-events-feed">
                {allEvents.map((event, i) => (
                  <div
                    key={event.id}
                    className={`drill-event-item animate-slide-up ${event.completed ? (event.passed ? 'event-passed' : 'event-failed') : 'event-pending'}`}
                  >
                    <div className="drill-event-header">
                      <span className="timestamp">{formatTimestamp(event.timestamp)}</span>
                      <span className="drill-event-role mono" style={{ color: roleColor(event.role) }}>{event.role}</span>
                      {event.completed && (
                        <span className={`badge ${event.passed ? 'badge-teal' : 'badge-red'}`}>
                          {event.passed ? 'PASS' : 'LATE'} {event.responseTime?.toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <p className="drill-event-desc">{event.description}</p>
                    <div className="drill-event-action">
                      <span className="drill-action-label mono">EXPECTED:</span>
                      <span>{event.expectedAction}</span>
                    </div>
                    <div className="drill-event-footer">
                      <span className="drill-time-limit mono">Time limit: {event.timeLimit}s</span>
                      {!event.completed && (
                        <button className="btn btn-sm btn-primary" onClick={() => respondToEvent(event.id)}>
                          ✓ Mark Responded
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="empty-state">
                    <span className="animate-blink">⟳</span>
                    <p>Awaiting first event...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Floor Plan + Score */}
            <div className="drill-right">
              <div className="card">
                <h3 style={{ marginBottom: 'var(--space-md)' }}>Live Floor Plan</h3>
                <FloorPlan compact />
              </div>

              <div className="card drill-score-card">
                <h3>Performance</h3>
                <div className="drill-score-display">
                  <div className={`drill-score-number ${totalScore >= 70 ? 'score-good' : totalScore >= 50 ? 'score-ok' : 'score-bad'}`}>
                    {totalScore}%
                  </div>
                  <div className="drill-score-breakdown">
                    <div className="score-row">
                      <span>Responded</span>
                      <span className="mono">{completedEvents.length}/{events.length}</span>
                    </div>
                    <div className="score-row">
                      <span>On Time</span>
                      <span className="mono" style={{ color: 'var(--accent-teal)' }}>
                        {events.filter(e => e.passed).length}
                      </span>
                    </div>
                    <div className="score-row">
                      <span>Late</span>
                      <span className="mono" style={{ color: 'var(--accent-red)' }}>
                        {events.filter(e => e.completed && !e.passed).length}
                      </span>
                    </div>
                    <div className="score-row">
                      <span>Missed</span>
                      <span className="mono" style={{ color: 'var(--accent-amber)' }}>
                        {pendingEvents.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && selectedScenario && (
        <div className="drill-results animate-fade-in">
          <div className="drill-results-header">
            <div>
              <h2>Drill Complete — {scenarioDescriptions[selectedScenario].title}</h2>
              <p className="text-secondary">Duration: {formatTime(elapsedTime)}</p>
            </div>
            <button className="btn" onClick={() => { setShowResults(false); setSelectedScenario(null); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back to Scenarios
            </button>
          </div>

          {/* Overall Score */}
          <div className="results-score-card card">
            <div className={`results-score ${totalScore >= 70 ? 'score-good' : totalScore >= 50 ? 'score-ok' : 'score-bad'}`}>
              <span className="results-score-number">{totalScore}%</span>
              <span className="results-score-label">
                {totalScore >= 70 ? 'PASS' : 'NEEDS IMPROVEMENT'}
              </span>
            </div>
            <div className="results-score-grid">
              <div className="results-stat">
                <span className="results-stat-value mono">{events.length}</span>
                <span className="results-stat-label mono">TOTAL EVENTS</span>
              </div>
              <div className="results-stat">
                <span className="results-stat-value mono" style={{ color: 'var(--accent-teal)' }}>{events.filter(e => e.passed).length}</span>
                <span className="results-stat-label mono">ON TIME</span>
              </div>
              <div className="results-stat">
                <span className="results-stat-value mono" style={{ color: 'var(--accent-red)' }}>{events.filter(e => e.completed && !e.passed).length}</span>
                <span className="results-stat-label mono">LATE</span>
              </div>
              <div className="results-stat">
                <span className="results-stat-value mono" style={{ color: 'var(--accent-amber)' }}>{pendingEvents.length}</span>
                <span className="results-stat-label mono">MISSED</span>
              </div>
            </div>
          </div>

          {/* Per-event breakdown */}
          <div className="card">
            <div className="card-header">
              <h3>Event-by-Event Breakdown</h3>
            </div>
            <div className="results-events">
              {events.map((event, i) => (
                <div key={event.id} className={`results-event-item ${event.passed ? 'result-pass' : event.completed ? 'result-late' : 'result-miss'}`}>
                  <div className="results-event-num mono">#{i + 1}</div>
                  <div className="results-event-content">
                    <p className="results-event-desc">{event.description}</p>
                    <p className="results-event-expected"><strong>Expected:</strong> {event.expectedAction}</p>
                  </div>
                  <div className="results-event-score">
                    <span className="results-event-role mono" style={{ color: roleColor(event.role) }}>{event.role}</span>
                    {event.completed ? (
                      <span className={`badge ${event.passed ? 'badge-teal' : 'badge-red'}`}>
                        {event.responseTime?.toFixed(1)}s / {event.timeLimit}s
                      </span>
                    ) : (
                      <span className="badge badge-amber">MISSED</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-role breakdown */}
          <div className="card">
            <div className="card-header">
              <h3>Pass/Fail by Role</h3>
            </div>
            <div className="role-breakdown">
              {['SECURITY', 'MEDICAL', 'MAINTENANCE', 'GM', 'FRONT DESK'].map((role) => {
                const roleEvents = events.filter((e) => e.role === role);
                if (roleEvents.length === 0) return null;
                const passed = roleEvents.filter(e => e.passed).length;
                const pct = Math.round((passed / roleEvents.length) * 100);
                return (
                  <div key={role} className="role-breakdown-item">
                    <span className="role-breakdown-name" style={{ color: roleColor(role) }}>{role}</span>
                    <div className="role-breakdown-bar">
                      <div className="role-breakdown-fill" style={{ width: `${pct}%`, background: pct >= 70 ? 'var(--accent-teal)' : 'var(--accent-red)' }}></div>
                    </div>
                    <span className="role-breakdown-pct mono">{pct}%</span>
                    <span className={`badge ${pct >= 70 ? 'badge-teal' : 'badge-red'}`}>
                      {pct >= 70 ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
