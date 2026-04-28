import { useState, useEffect } from 'react';
import { useStore } from './store';
import { startSimulation } from './simulation';
import { formatTimestamp } from './utils';
import Dashboard from './screens/Dashboard';
import GuestSOS from './screens/GuestSOS';
import Triage from './screens/Triage';
import Handoff from './screens/Handoff';
import Debrief from './screens/Debrief';
import Drill from './screens/Drill';
import { Activity, ShieldAlert, BrainCircuit, Stethoscope, ClipboardList, Target, Shield, Volume2, VolumeX, TriangleAlert } from 'lucide-react';
import './App.css';

const screens = [
  { id: 'dashboard', label: 'Staff Ops', icon: <Activity size={16} /> },
  { id: 'sos', label: 'Guest SOS', icon: <ShieldAlert size={16} /> },
  { id: 'triage', label: 'AI Triage', icon: <BrainCircuit size={16} /> },
  { id: 'handoff', label: 'Responder', icon: <Stethoscope size={16} /> },
  { id: 'debrief', label: 'Debrief', icon: <ClipboardList size={16} /> },
  { id: 'drill', label: 'Drill', icon: <Target size={16} /> },
];

function App() {
  const activeScreen = useStore((s) => s.activeScreen);
  const setActiveScreen = useStore((s) => s.setActiveScreen);
  const isOnline = useStore((s) => s.isOnline);
  const setOnline = useStore((s) => s.setOnline);
  const soundEnabled = useStore((s) => s.soundEnabled);
  const toggleSound = useStore((s) => s.toggleSound);
  const isDrillMode = useStore((s) => s.isDrillMode);
  const incidents = useStore((s) => s.incidents);

  const [currentTime, setCurrentTime] = useState(Date.now());

  const activeCount = incidents.filter((i) => i.status !== 'resolved').length;

  // Start simulation
  useEffect(() => {
    const cleanup = startSimulation();
    return cleanup;
  }, []);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Online status
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard': return <Dashboard />;
      case 'sos': return <GuestSOS />;
      case 'triage': return <Triage />;
      case 'handoff': return <Handoff />;
      case 'debrief': return <Debrief />;
      case 'drill': return <Drill />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <TriangleAlert size={14} /> OFFLINE — Core SOS functionality remains active. Data will sync when connection restores.
        </div>
      )}

      {/* Top Navigation */}
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">
            <span className="app-logo-icon" style={{ display: 'flex', alignItems: 'center' }}><Shield size={24} color="var(--accent-primary)" /></span>
            <span className="app-logo-text">HospitalityShield</span>
          </div>
          {isDrillMode && (
            <span className="badge badge-amber" style={{ fontSize: '10px' }}>DRILL MODE</span>
          )}
        </div>

        <nav className="nav-tabs app-nav">
          {screens.map((screen) => (
            <button
              key={screen.id}
              className={`nav-tab ${activeScreen === screen.id ? 'active' : ''}`}
              onClick={() => setActiveScreen(screen.id)}
              id={`nav-${screen.id}`}
            >
              <span className="nav-tab-icon">{screen.icon}</span>
              <span className="nav-tab-label">{screen.label}</span>
              {screen.id === 'dashboard' && activeCount > 0 && (
                <span className="nav-incident-badge">{activeCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="app-header-right">
          <button
            className="header-btn"
            onClick={toggleSound}
            title={soundEnabled ? 'Mute alerts' : 'Enable alerts'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <span className="header-time mono">{formatTimestamp(currentTime)}</span>
          <span className="header-status">
            <span className={`status-dot ${isOnline ? 'status-dot-active' : 'status-dot-alert'}`}></span>
            <span className="mono" style={{ fontSize: '11px' }}>{isOnline ? 'LIVE' : 'OFFLINE'}</span>
          </span>
        </div>
      </header>

      {/* Screen Content */}
      <main className="app-content">
        {renderScreen()}
      </main>
    </div>
  );
}

export default App;
