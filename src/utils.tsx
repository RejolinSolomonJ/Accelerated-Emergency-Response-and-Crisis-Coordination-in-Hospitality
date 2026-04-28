import type { Severity } from './types';
import { Stethoscope, Flame, Shield, Skull, Building, Waves, Zap, AlertCircle } from 'lucide-react';
import React from 'react';

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function formatFullTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  return formatTime(diff) + ' ago';
}

export function severityColor(sev: Severity): string {
  switch (sev) {
    case 'P1': return 'var(--accent-red)';
    case 'P2': return 'var(--accent-amber)';
    case 'P3': return 'var(--accent-teal)';
  }
}

export function incidentTypeIcon(type: string): React.ReactNode {
  switch (type) {
    case 'medical': return <Stethoscope size={20} />;
    case 'fire': return <Flame size={20} />;
    case 'security': return <Shield size={20} />;
    case 'hazmat': return <Skull size={20} />;
    case 'structural': return <Building size={20} />;
    case 'flood': return <Waves size={20} />;
    case 'power': return <Zap size={20} />;
    default: return <AlertCircle size={20} />;
  }
}

export function roleColor(role: string): string {
  switch (role) {
    case 'SECURITY': return '#E24B4A';
    case 'MEDICAL': return '#1D9E75';
    case 'GM': return '#7C6AEF';
    case 'FIRE DEPT': return '#EF9F27';
    case 'MAINTENANCE': return '#3B82F6';
    case 'FRONT DESK': return '#8B949E';
    case 'SYSTEM': return '#6E7681';
    case 'AI': return '#00D4AA';
    case 'GUEST': return '#F0F6FC';
    default: return '#8B949E';
  }
}
