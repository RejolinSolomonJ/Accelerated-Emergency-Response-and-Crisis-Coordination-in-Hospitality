import { useMemo } from 'react';
import { useStore } from '../store';
import type { Zone } from '../types';
import './FloorPlan.css';

const zoneStatusColor = (status: string) => {
  switch (status) {
    case 'active': return '#E24B4A';
    case 'alert': return '#EF9F27';
    default: return '#1D9E75';
  }
};

const zoneStatusFill = (status: string) => {
  switch (status) {
    case 'active': return 'rgba(226,75,74,0.15)';
    case 'alert': return 'rgba(239,159,39,0.12)';
    default: return 'rgba(29,158,117,0.08)';
  }
};

interface Props {
  onZoneClick?: (zone: Zone) => void;
  highlightZone?: string;
  incidentPins?: { zoneId: string; severity: string }[];
  compact?: boolean;
}

export default function FloorPlan({ onZoneClick, highlightZone, incidentPins = [], compact }: Props) {
  const zones = useStore((s) => s.zones);
  const allIncidents = useStore((s) => s.incidents);
  const incidents = useMemo(() => allIncidents.filter((i) => i.status !== 'resolved'), [allIncidents]);

  const getIncidentPin = (zoneId: string) => {
    return incidents.find((i) => i.zone === zoneId);
  };

  const w = compact ? 400 : 770;
  const h = compact ? 280 : 500;
  const scale = compact ? 0.52 : 1;

  return (
    <div className="floorplan-container">
      <svg
        viewBox={`0 0 ${770} ${500}`}
        width="100%"
        height="100%"
        className="floorplan-svg"
      >
        {/* Building outline */}
        <rect x="40" y="30" width="690" height="440" rx="12"
          fill="none" stroke="rgba(15, 23, 42, 0.1)" strokeWidth="1.5" />

        {/* Title */}
        <text x="385" y="22" textAnchor="middle" fill="#64748b" fontSize="11"
          fontFamily="'JetBrains Mono', monospace">GRAND HOTEL — FLOOR PLAN</text>

        {/* Floors 10 down to 5 */}
        {[10, 9, 8, 7, 6, 5].map((floor, i) => {
          const y = 40 + i * 42;
          const zone = zones.find((z) => z.id === `floor${floor}`);
          const status = zone?.status || 'clear';
          const pin = getIncidentPin(`floor${floor}`);

          return (
            <g key={floor} onClick={() => zone && onZoneClick?.(zone)} style={{ cursor: 'pointer' }}>
              <rect x="50" y={y} width="670" height="36" rx="2"
                fill={highlightZone === `floor${floor}` ? 'rgba(29,158,117,0.2)' : zoneStatusFill(status)}
                stroke={zoneStatusColor(status)} strokeWidth="1" />
              <text x="65" y={y + 22} fill={zoneStatusColor(status)} fontSize="11"
                fontFamily="'JetBrains Mono', monospace" fontWeight="600">
                FL{floor}
              </text>
              <text x="105" y={y + 22} fill="#8B949E" fontSize="10"
                fontFamily="'JetBrains Mono', monospace">
                {zone ? `${zone.guestCount} guests` : ''}
              </text>

              {/* Room grid representation */}
              {Array.from({ length: 10 }, (_, ri) => (
                <rect key={ri} x={200 + ri * 52} y={y + 6} width="44" height="24" rx="4"
                  fill="rgba(15, 23, 42, 0.02)" stroke="rgba(15, 23, 42, 0.06)" strokeWidth="0.5" />
              ))}

              {/* Room numbers */}
              {Array.from({ length: 10 }, (_, ri) => (
                <text key={`t${ri}`} x={222 + ri * 52} y={y + 22} fill="#94a3b8" fontSize="8"
                  fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
                  {floor}{String(ri + 1).padStart(2, '0')}
                </text>
              ))}

              {/* Incident pin */}
              {pin && (
                <g>
                  <circle cx="720" cy={y + 18} r="8"
                    fill={pin.severity === 'P1' ? '#E24B4A' : '#EF9F27'}
                    className={pin.severity === 'P1' ? 'incident-pin-pulse' : ''} />
                  <text x="720" y={y + 22} textAnchor="middle" fill="#fff" fontSize="8"
                    fontFamily="'JetBrains Mono', monospace" fontWeight="700">!</text>
                </g>
              )}

              {/* Status indicator */}
              <circle cx="730" cy={y + 18} r="4" fill={zoneStatusColor(status)} />
            </g>
          );
        })}

        {/* Floors 4 down to 1 */}
        {[4, 3, 2, 1].map((floor, i) => {
          const y = 292 + i * 42;
          const zone = zones.find((z) => z.id === `floor${floor}`);
          const status = zone?.status || 'clear';
          const pin = getIncidentPin(`floor${floor}`);

          return (
            <g key={floor} onClick={() => zone && onZoneClick?.(zone)} style={{ cursor: 'pointer' }}>
              <rect x="50" y={y} width="670" height="36" rx="2"
                fill={highlightZone === `floor${floor}` ? 'rgba(29,158,117,0.2)' : zoneStatusFill(status)}
                stroke={zoneStatusColor(status)} strokeWidth="1" />
              <text x="65" y={y + 22} fill={zoneStatusColor(status)} fontSize="11"
                fontFamily="'JetBrains Mono', monospace" fontWeight="600">
                FL{floor}
              </text>
              <text x="105" y={y + 22} fill="#64748b" fontSize="10"
                fontFamily="'JetBrains Mono', monospace">
                {zone ? `${zone.guestCount} guests` : ''}
              </text>

              {Array.from({ length: 10 }, (_, ri) => (
                <rect key={ri} x={200 + ri * 52} y={y + 6} width="44" height="24" rx="4"
                  fill="rgba(15,23,42,0.02)" stroke="rgba(15,23,42,0.06)" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 10 }, (_, ri) => (
                <text key={`t${ri}`} x={222 + ri * 52} y={y + 22} fill="#94a3b8" fontSize="8"
                  fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
                  {floor}{String(ri + 1).padStart(2, '0')}
                </text>
              ))}

              {pin && (
                <g>
                  <circle cx="720" cy={y + 18} r="8"
                    fill={pin.severity === 'P1' ? '#E24B4A' : '#EF9F27'}
                    className={pin.severity === 'P1' ? 'incident-pin-pulse' : ''} />
                  <text x="720" y={y + 22} textAnchor="middle" fill="#fff" fontSize="8"
                    fontFamily="'JetBrains Mono', monospace" fontWeight="700">!</text>
                </g>
              )}

              <circle cx="730" cy={y + 18} r="4" fill={zoneStatusColor(status)} />
            </g>
          );
        })}

        {/* Ground floor zones */}
        {[
          { id: 'parking', label: 'PARKING', x: 50, w: 100 },
          { id: 'lobby', label: 'LOBBY', x: 160, w: 200 },
          { id: 'pool', label: 'POOL', x: 370, w: 160 },
          { id: 'kitchen', label: 'KITCHEN', x: 540, w: 180 },
        ].map((area) => {
          const zone = zones.find((z) => z.id === area.id);
          const status = zone?.status || 'clear';
          const pin = getIncidentPin(area.id);

          return (
            <g key={area.id} onClick={() => zone && onZoneClick?.(zone)} style={{ cursor: 'pointer' }}>
              <rect x={area.x} y={462} width={area.w} height="36" rx="2"
                fill={highlightZone === area.id ? 'rgba(29,158,117,0.2)' : zoneStatusFill(status)}
                stroke={zoneStatusColor(status)} strokeWidth="1" />
              <text x={area.x + area.w / 2} y={478} textAnchor="middle"
                fill={zoneStatusColor(status)} fontSize="10"
                fontFamily="'JetBrains Mono', monospace" fontWeight="600">
                {area.label}
              </text>
              <text x={area.x + area.w / 2} y={492} textAnchor="middle"
                fill="#8B949E" fontSize="9" fontFamily="'JetBrains Mono', monospace">
                {zone ? `${zone.guestCount}` : '0'}
              </text>

              {pin && (
                <g>
                  <circle cx={area.x + area.w - 12} cy={472} r="7"
                    fill={pin.severity === 'P1' ? '#E24B4A' : '#EF9F27'}
                    className={pin.severity === 'P1' ? 'incident-pin-pulse' : ''} />
                  <text x={area.x + area.w - 12} y={476} textAnchor="middle" fill="#fff" fontSize="7"
                    fontFamily="'JetBrains Mono', monospace" fontWeight="700">!</text>
                </g>
              )}
            </g>
          );
        })}

        {/* Ground floor label */}
        <text x="385" y="458" textAnchor="middle" fill="#64748b" fontSize="9"
          fontFamily="'JetBrains Mono', monospace">— GROUND LEVEL —</text>

        {/* Floor divider */}
        <line x1="50" y1="288" x2="720" y2="288"
          stroke="rgba(15, 23, 42, 0.1)" strokeWidth="1" strokeDasharray="4 4" />
        <text x="385" y="284" textAnchor="middle" fill="#64748b" fontSize="8"
          fontFamily="'JetBrains Mono', monospace">— LOWER FLOORS —</text>

        {/* Legend */}
        <g transform="translate(50, 5)">
          <circle cx="0" cy="5" r="3" fill="#10b981" />
          <text x="8" y="8" fill="#64748b" fontSize="8" fontFamily="'JetBrains Mono', monospace">CLEAR</text>
          <circle cx="55" cy="5" r="3" fill="#f59e0b" />
          <text x="63" y="8" fill="#64748b" fontSize="8" fontFamily="'JetBrains Mono', monospace">ALERT</text>
          <circle cx="110" cy="5" r="3" fill="#ef4444" />
          <text x="118" y="8" fill="#64748b" fontSize="8" fontFamily="'JetBrains Mono', monospace">ACTIVE</text>
        </g>
      </svg>
    </div>
  );
}
