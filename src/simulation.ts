import { useStore, genId } from './store';
import type { Signal, Incident, TimelineEntry, ChatMessage, Severity } from './types';
import { playP1Alert, playP2Alert } from './sounds';

const mockSignals: Omit<Signal, 'id' | 'timestamp' | 'processed'>[] = [
  {
    source: 'CCTV',
    rawInput: 'Camera PKG-01: Unattended bag detected near parking garage entrance. Stationary for 12 minutes.',
    aiClassification: 'Suspicious Package — Unattended Luggage',
    confidence: 0.79,
    assignedPriority: 'P2',
    threatCategory: 'security_suspicious',
    recommendedResponse: 'Dispatch security for visual inspection. Do not touch. Establish 30m perimeter if confirmed.',
    dispatchRoles: ['SECURITY'],
    estimatedAffected: 4,
  },
  {
    source: 'SENSOR',
    rawInput: 'Water flow sensor FL3-PIPE-07: Anomalous flow rate 42L/min (baseline 2L/min)',
    aiClassification: 'Infrastructure — Possible Pipe Burst',
    confidence: 0.91,
    assignedPriority: 'P2',
    threatCategory: 'infrastructure_water',
    recommendedResponse: 'Dispatch maintenance immediately. Shut off zone water valve. Evacuate rooms 305-310.',
    dispatchRoles: ['MAINTENANCE'],
    estimatedAffected: 12,
  },
  {
    source: 'SOS_TEXT',
    rawInput: 'There is smoke coming from under door in room next to me, room 709 I think',
    aiClassification: 'Fire Hazard — Smoke Report',
    confidence: 0.85,
    assignedPriority: 'P1',
    threatCategory: 'fire_smoke',
    recommendedResponse: 'Dispatch fire team. Alert floor 7. Prepare evacuation. Notify fire department.',
    dispatchRoles: ['SECURITY', 'MAINTENANCE'],
    estimatedAffected: 28,
  },
  {
    source: 'CCTV',
    rawInput: 'Camera POOL-02: Individual appears unconscious at pool edge. No movement for 45 seconds.',
    aiClassification: 'Medical — Possible Drowning',
    confidence: 0.82,
    assignedPriority: 'P1',
    threatCategory: 'medical_drowning',
    recommendedResponse: 'Dispatch medical + lifeguard. Begin rescue protocol. Call 911.',
    dispatchRoles: ['MEDICAL', 'SECURITY'],
    estimatedAffected: 1,
  },
  {
    source: 'SENSOR',
    rawInput: 'Elevator ELV-3: Emergency stop triggered between floors 5-6. Occupancy sensor shows 3 persons.',
    aiClassification: 'Infrastructure — Elevator Entrapment',
    confidence: 0.98,
    assignedPriority: 'P2',
    threatCategory: 'infrastructure_elevator',
    recommendedResponse: 'Dispatch maintenance. Establish communication via intercom. Notify fire dept if > 15 min.',
    dispatchRoles: ['MAINTENANCE'],
    estimatedAffected: 3,
  },
  {
    source: 'SOS_TEXT',
    rawInput: '助けて！部屋で転んで動けません。部屋820。',
    aiClassification: 'Medical — Fall Injury (Japanese)',
    confidence: 0.90,
    assignedPriority: 'P2',
    threatCategory: 'medical_fall',
    recommendedResponse: 'Dispatch medical. Guest reports inability to move after fall. Possible fracture.',
    dispatchRoles: ['MEDICAL'],
    estimatedAffected: 1,
  },
  {
    source: 'CCTV',
    rawInput: 'Camera KIT-01: Grease fire flash detected on cooking station 3. Kitchen staff responding.',
    aiClassification: 'Fire — Kitchen Grease Fire',
    confidence: 0.94,
    assignedPriority: 'P2',
    threatCategory: 'fire_kitchen',
    recommendedResponse: 'Verify staff extinguishing. Standby fire suppression. Block kitchen access.',
    dispatchRoles: ['SECURITY', 'MAINTENANCE'],
    estimatedAffected: 5,
  },
  {
    source: 'SENSOR',
    rawInput: 'Power grid monitor: Voltage drop 18% on floor 9-10 circuit. UPS engaged.',
    aiClassification: 'Infrastructure — Partial Power Failure',
    confidence: 0.87,
    assignedPriority: 'P3',
    threatCategory: 'infrastructure_power',
    recommendedResponse: 'Dispatch maintenance to electrical room. Monitor UPS capacity. Notify affected guests.',
    dispatchRoles: ['MAINTENANCE'],
    estimatedAffected: 33,
  },
];

const mockChatUpdates = [
  { role: 'SECURITY' as const, sender: 'Mike Torres', message: 'Situation de-escalated in lobby. Both parties separated. One guest requesting room change.' },
  { role: 'MEDICAL' as const, sender: 'Sarah Chen', message: 'Update Room 412: vitals stable. BP 140/90. Guest comfortable. Paramedics should arrive any moment.' },
  { role: 'GM' as const, sender: 'Kenji Sato', message: 'Copy all. I\'ve notified the guest\'s emergency contact. Insurance info on file.' },
  { role: 'FRONT DESK' as const, sender: 'Lisa Park', message: 'Paramedics just arrived at lobby. Escorting to elevator now.' },
  { role: 'SECURITY' as const, sender: 'James Wilson', message: 'Floor 2 sweep complete. All clear. Moving to floor 3.' },
  { role: 'MEDICAL' as const, sender: 'Ana Rodriguez', message: 'Medical kit restocked on floor 3. Standing by for any additional calls.' },
];

let signalIndex = 0;
let chatIndex = 0;

export function startSimulation() {
  // Inject mock signals every 8-10 seconds
  const signalInterval = setInterval(() => {
    const store = useStore.getState();
    if (!store.soundEnabled && !store.isDrillMode) {
      // Still inject signals even if sound is off
    }

    const mockSignal = mockSignals[signalIndex % mockSignals.length];
    const signal: Signal = {
      ...mockSignal,
      id: genId(),
      timestamp: Date.now(),
      processed: true,
    };

    store.addSignal(signal);

    // Play sound based on priority
    if (store.soundEnabled) {
      if (signal.assignedPriority === 'P1') {
        playP1Alert();
      } else if (signal.assignedPriority === 'P2') {
        playP2Alert();
      }
    }

    signalIndex++;
  }, 8000 + Math.random() * 2000);

  // Inject chat updates every 12-15 seconds
  const chatInterval = setInterval(() => {
    const store = useStore.getState();
    const activeIncidents = store.incidents.filter((i) => i.status !== 'resolved');
    if (activeIncidents.length === 0) return;

    const incident = activeIncidents[Math.floor(Math.random() * activeIncidents.length)];
    const mockChat = mockChatUpdates[chatIndex % mockChatUpdates.length];

    const chatMsg: ChatMessage = {
      id: genId(),
      timestamp: Date.now(),
      sender: mockChat.sender,
      role: mockChat.role,
      message: mockChat.message,
    };

    store.addChatMessage(incident.id, chatMsg);
    chatIndex++;
  }, 12000 + Math.random() * 3000);

  // Update time-sensitive zone statuses
  const zoneInterval = setInterval(() => {
    const store = useStore.getState();
    // Randomly toggle a zone between clear and alert occasionally
    const zones = store.zones.filter((z) => z.status === 'clear');
    if (zones.length > 3 && Math.random() > 0.7) {
      const randomZone = zones[Math.floor(Math.random() * zones.length)];
      store.updateZoneStatus(randomZone.id, 'alert');
      setTimeout(() => {
        store.updateZoneStatus(randomZone.id, 'clear');
      }, 15000);
    }
  }, 20000);

  return () => {
    clearInterval(signalInterval);
    clearInterval(chatInterval);
    clearInterval(zoneInterval);
  };
}
