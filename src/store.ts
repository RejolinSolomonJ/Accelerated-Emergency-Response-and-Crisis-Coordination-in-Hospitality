import { create } from 'zustand';
import type { Incident, Responder, Guest, Signal, Zone, DrillResult, Severity, IncidentType, ResponderRole, ChatMessage, TimelineEntry } from './types';

let _idCounter = 1000;
const genId = () => `hs-${++_idCounter}`;

const now = Date.now();

// === Pre-loaded demo data ===
const initialZones: Zone[] = [
  { id: 'lobby', name: 'Lobby', floor: 0, status: 'alert', guestCount: 18, x: 150, y: 380, width: 200, height: 80 },
  { id: 'pool', name: 'Pool Area', floor: 0, status: 'clear', guestCount: 12, x: 400, y: 380, width: 150, height: 80 },
  { id: 'kitchen', name: 'Kitchen', floor: 0, status: 'clear', guestCount: 5, x: 600, y: 380, width: 120, height: 80 },
  { id: 'parking', name: 'Parking', floor: 0, status: 'clear', guestCount: 4, x: 50, y: 380, width: 90, height: 80 },
  { id: 'floor1', name: 'Floor 1', floor: 1, status: 'clear', guestCount: 22, x: 50, y: 310, width: 670, height: 50 },
  { id: 'floor2', name: 'Floor 2', floor: 2, status: 'clear', guestCount: 26, x: 50, y: 255, width: 670, height: 50 },
  { id: 'floor3', name: 'Floor 3', floor: 3, status: 'clear', guestCount: 24, x: 50, y: 200, width: 670, height: 50 },
  { id: 'floor4', name: 'Floor 4', floor: 4, status: 'active', guestCount: 20, x: 50, y: 145, width: 670, height: 50 },
  { id: 'floor5', name: 'Floor 5', floor: 5, status: 'clear', guestCount: 28, x: 50, y: 90, width: 670, height: 50 },
  { id: 'floor6', name: 'Floor 6', floor: 6, status: 'clear', guestCount: 19, x: 50, y: 90, width: 670, height: 50 },
  { id: 'floor7', name: 'Floor 7', floor: 7, status: 'clear', guestCount: 21, x: 50, y: 90, width: 670, height: 50 },
  { id: 'floor8', name: 'Floor 8', floor: 8, status: 'clear', guestCount: 15, x: 50, y: 90, width: 670, height: 50 },
  { id: 'floor9', name: 'Floor 9', floor: 9, status: 'clear', guestCount: 17, x: 50, y: 90, width: 670, height: 50 },
  { id: 'floor10', name: 'Floor 10', floor: 10, status: 'clear', guestCount: 16, x: 50, y: 90, width: 670, height: 50 },
];

const initialResponders: Responder[] = [
  { id: 'r1', name: 'Mike Torres', role: 'SECURITY', status: 'dispatched', currentZone: 'lobby', assignedIncidentId: 'inc-2', eta: 0 },
  { id: 'r2', name: 'Sarah Chen', role: 'MEDICAL', status: 'dispatched', currentZone: 'floor4', assignedIncidentId: 'inc-1', eta: 120 },
  { id: 'r3', name: 'James Wilson', role: 'SECURITY', status: 'available', currentZone: 'floor2' },
  { id: 'r4', name: 'Lisa Park', role: 'FRONT DESK', status: 'available', currentZone: 'lobby' },
  { id: 'r5', name: 'David Kumar', role: 'MAINTENANCE', status: 'available', currentZone: 'floor1' },
  { id: 'r6', name: 'Ana Rodriguez', role: 'MEDICAL', status: 'available', currentZone: 'floor3' },
  { id: 'r7', name: 'Tom Bradley', role: 'SECURITY', status: 'available', currentZone: 'parking' },
  { id: 'r8', name: 'Kenji Sato', role: 'GM', status: 'available', currentZone: 'floor1' },
  { id: 'r9', name: 'Maria Costa', role: 'FRONT DESK', status: 'available', currentZone: 'lobby' },
  { id: 'r10', name: 'Ryan O\'Brien', role: 'MAINTENANCE', status: 'busy', currentZone: 'floor6' },
  { id: 'r11', name: 'Priya Sharma', role: 'SECURITY', status: 'available', currentZone: 'floor8' },
  { id: 'r12', name: 'Carlos Diaz', role: 'MEDICAL', status: 'available', currentZone: 'floor5' },
];

const initialIncidents: Incident[] = [
  {
    id: 'inc-1',
    type: 'medical',
    severity: 'P1',
    status: 'responding',
    title: 'Guest Chest Pain — Room 412',
    description: 'Male guest, approx. 60 years old, reporting acute chest pain and shortness of breath. Paramedics en route.',
    location: 'Room 412',
    zone: 'floor4',
    roomNumber: '412',
    reportedAt: now - 8 * 60 * 1000,
    assignedResponders: ['r2'],
    guestId: 'g-412',
    timeline: [
      { id: 't1', timestamp: now - 8 * 60 * 1000, actor: 'System', role: 'SYSTEM', action: 'SOS received from Room 412' },
      { id: 't2', timestamp: now - 7.5 * 60 * 1000, actor: 'AI Triage', role: 'AI', action: 'Classified as P1 Medical Emergency', detail: 'Confidence: 0.96' },
      { id: 't3', timestamp: now - 7 * 60 * 1000, actor: 'Sarah Chen', role: 'MEDICAL', action: 'Dispatched to Room 412', detail: 'ETA: 2 min' },
      { id: 't4', timestamp: now - 5 * 60 * 1000, actor: 'Sarah Chen', role: 'MEDICAL', action: 'Arrived at Room 412', detail: 'Guest conscious, stable vitals' },
      { id: 't5', timestamp: now - 4 * 60 * 1000, actor: 'System', role: 'SYSTEM', action: '911 notified — paramedics dispatched', detail: 'ETA: 6 min' },
      { id: 't6', timestamp: now - 1.5 * 60 * 1000, actor: 'System', role: 'SYSTEM', action: 'Paramedics en route — 3 units', detail: 'Fire Rescue Unit 7' },
    ],
    chatMessages: [
      { id: 'c1', timestamp: now - 7 * 60 * 1000, sender: 'Sarah Chen', role: 'MEDICAL', message: 'Heading to 412 now. Grabbing AED from floor 3 station.' },
      { id: 'c2', timestamp: now - 5 * 60 * 1000, sender: 'Sarah Chen', role: 'MEDICAL', message: 'On scene. Guest is conscious, complaining of pressure in chest. Pulse 110, slightly elevated. Administering aspirin.' },
      { id: 'c3', timestamp: now - 4 * 60 * 1000, sender: 'Kenji Sato', role: 'GM', message: 'Copy. 911 notified. Elevator reserved for paramedic access on floor 4.' },
      { id: 'c4', timestamp: now - 2 * 60 * 1000, sender: 'Lisa Park', role: 'FRONT DESK', message: 'Paramedics confirmed en route. I\'ll meet them at lobby entrance.' },
    ],
  },
  {
    id: 'inc-2',
    type: 'security',
    severity: 'P2',
    status: 'responding',
    title: 'Lobby Altercation',
    description: 'Two guests involved in a verbal altercation near the front desk, escalating to pushing. Security dispatched.',
    location: 'Main Lobby',
    zone: 'lobby',
    reportedAt: now - 3 * 60 * 1000,
    assignedResponders: ['r1'],
    timeline: [
      { id: 't10', timestamp: now - 3 * 60 * 1000, actor: 'CCTV System', role: 'SYSTEM', action: 'Anomaly detected: aggressive behavior in lobby' },
      { id: 't11', timestamp: now - 2.8 * 60 * 1000, actor: 'AI Triage', role: 'AI', action: 'Classified as P2 Security Incident', detail: 'Confidence: 0.88' },
      { id: 't12', timestamp: now - 2.5 * 60 * 1000, actor: 'Mike Torres', role: 'SECURITY', action: 'Dispatched to lobby' },
      { id: 't13', timestamp: now - 2 * 60 * 1000, actor: 'Mike Torres', role: 'SECURITY', action: 'On scene, de-escalating situation' },
    ],
    chatMessages: [
      { id: 'c10', timestamp: now - 2.5 * 60 * 1000, sender: 'Mike Torres', role: 'SECURITY', message: 'En route to lobby. Can see the situation on the cameras.' },
      { id: 'c11', timestamp: now - 2 * 60 * 1000, sender: 'Mike Torres', role: 'SECURITY', message: 'On scene. Two male guests, alcohol-related. De-escalating. May need backup if things go south.' },
      { id: 'c12', timestamp: now - 1 * 60 * 1000, sender: 'Kenji Sato', role: 'GM', message: 'Copy. James Wilson is on standby at floor 2 if needed. Keep situation contained.' },
    ],
  },
];

const generateGuests = (): Guest[] => {
  const guests: Guest[] = [];
  const floors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const firstNames = ['John', 'Maria', 'Chen', 'Ahmed', 'Yuki', 'Sophie', 'Raj', 'Emma', 'Carlos', 'Liam', 'Aisha', 'Hans', 'Fatima', 'Diego', 'Ava'];
  const lastNames = ['Smith', 'Garcia', 'Wang', 'Khan', 'Tanaka', 'Martin', 'Patel', 'Johnson', 'Lopez', 'Kim', 'Ali', 'Mueller', 'Hassan', 'Rivera', 'Lee'];

  for (let i = 0; i < 247; i++) {
    const floor = floors[Math.floor(Math.random() * floors.length)];
    const room = `${floor}${String(Math.floor(Math.random() * 20) + 1).padStart(2, '0')}`;
    let status: 'safe' | 'unaccounted' | 'evacuated' = 'safe';
    if (i >= 244) status = 'unaccounted';

    guests.push({
      id: `g-${room}-${i}`,
      name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      roomNumber: room,
      status,
      floor,
      zone: `floor${floor}`,
      checkInTime: now - Math.floor(Math.random() * 72) * 60 * 60 * 1000,
    });
  }
  return guests;
};

const initialSignals: Signal[] = [
  {
    id: 'sig-1',
    source: 'SOS_TEXT',
    rawInput: "Emergency! My husband is having severe chest pain in Room 412. He can't breathe well.",
    aiClassification: 'Medical Emergency — Cardiac Event',
    confidence: 0.96,
    assignedPriority: 'P1',
    threatCategory: 'medical_cardiac',
    recommendedResponse: 'Dispatch medical team + AED. Notify 911.',
    dispatchRoles: ['MEDICAL'],
    estimatedAffected: 2,
    timestamp: now - 8 * 60 * 1000,
    processed: false,
  },
  {
    id: 'sig-2',
    source: 'CCTV',
    rawInput: 'Camera LBY-03: Multiple individuals in the lobby area showing signs of physical aggression and shouting.',
    aiClassification: 'Physical Altercation — 2 Guests',
    confidence: 0.88,
    assignedPriority: 'P2',
    threatCategory: 'security_assault',
    recommendedResponse: 'Dispatch security. Monitor for weapons. Prepare to isolate area.',
    dispatchRoles: ['SECURITY'],
    estimatedAffected: 8,
    timestamp: now - 3 * 60 * 1000,
    processed: false,
  },
  {
    id: 'sig-3',
    source: 'SENSOR',
    rawInput: 'Smoke sensor Floor 7 Rm 705 — trace reading 0.02ppm, below threshold',
    aiClassification: 'Environmental — Low Smoke Trace',
    confidence: 0.72,
    assignedPriority: 'P3',
    threatCategory: 'environmental_smoke',
    recommendedResponse: 'Monitor. Likely cooking/vaping. Check at next patrol.',
    dispatchRoles: [],
    estimatedAffected: 0,
    timestamp: now - 12 * 60 * 1000,
    processed: false,
  },
];

interface StoreState {
  // Core data
  incidents: Incident[];
  responders: Responder[];
  guests: Guest[];
  signals: Signal[];
  zones: Zone[];

  // UI state
  activeScreen: string;
  selectedIncidentId: string | null;
  isDrillMode: boolean;
  drillResult: DrillResult | null;
  isOnline: boolean;
  soundEnabled: boolean;

  // Actions
  setActiveScreen: (screen: string) => void;
  selectIncident: (id: string | null) => void;
  addIncident: (incident: Incident) => void;
  updateIncidentStatus: (id: string, status: Incident['status']) => void;
  resolveIncident: (id: string) => void;
  addTimelineEntry: (incidentId: string, entry: TimelineEntry) => void;
  addChatMessage: (incidentId: string, msg: ChatMessage) => void;
  dispatchResponder: (responderId: string, incidentId: string) => void;
  updateResponderStatus: (id: string, status: Responder['status']) => void;
  addSignal: (signal: Signal) => void;
  updateSignalPriority: (id: string, priority: Severity) => void;
  processSignal: (id: string) => void;
  updateZoneStatus: (zoneId: string, status: Zone['status']) => void;
  setOnline: (online: boolean) => void;
  toggleSound: () => void;
  toggleDrillMode: () => void;
  setDrillResult: (result: DrillResult | null) => void;
  updateGuestStatus: (guestId: string, status: Guest['status']) => void;
}

export const useStore = create<StoreState>((set) => ({
  incidents: initialIncidents,
  responders: initialResponders,
  guests: generateGuests(),
  signals: initialSignals,
  zones: initialZones,
  activeScreen: 'dashboard',
  selectedIncidentId: null,
  isDrillMode: false,
  drillResult: null,
  isOnline: true,
  soundEnabled: true,

  setActiveScreen: (screen) => set({ activeScreen: screen }),
  selectIncident: (id) => set({ selectedIncidentId: id }),

  addIncident: (incident) =>
    set((state) => ({ incidents: [incident, ...state.incidents] })),

  updateIncidentStatus: (id, status) =>
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === id ? { ...inc, status } : inc
      ),
    })),

  resolveIncident: (id) =>
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === id ? { ...inc, status: 'resolved' as const, resolvedAt: Date.now() } : inc
      ),
    })),

  addTimelineEntry: (incidentId, entry) =>
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === incidentId
          ? { ...inc, timeline: [...inc.timeline, entry] }
          : inc
      ),
    })),

  addChatMessage: (incidentId, msg) =>
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === incidentId
          ? { ...inc, chatMessages: [...inc.chatMessages, msg] }
          : inc
      ),
    })),

  dispatchResponder: (responderId, incidentId) =>
    set((state) => ({
      responders: state.responders.map((r) =>
        r.id === responderId
          ? { ...r, status: 'dispatched' as const, assignedIncidentId: incidentId, eta: Math.floor(Math.random() * 180) + 60 }
          : r
      ),
      incidents: state.incidents.map((inc) =>
        inc.id === incidentId
          ? { ...inc, assignedResponders: [...inc.assignedResponders, responderId] }
          : inc
      ),
    })),

  updateResponderStatus: (id, status) =>
    set((state) => ({
      responders: state.responders.map((r) =>
        r.id === id ? { ...r, status } : r
      ),
    })),

  addSignal: (signal) =>
    set((state) => ({ signals: [signal, ...state.signals] })),

  updateSignalPriority: (id, priority) =>
    set((state) => ({
      signals: state.signals.map((s) =>
        s.id === id ? { ...s, assignedPriority: priority } : s
      ),
    })),

  processSignal: (id) => 
    set((state) => ({
      signals: state.signals.map((s) => 
        s.id === id ? { ...s, processed: true } : s
      )
    })),

  updateZoneStatus: (zoneId, status) =>
    set((state) => ({
      zones: state.zones.map((z) =>
        z.id === zoneId ? { ...z, status } : z
      ),
    })),

  setOnline: (online) => set({ isOnline: online }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  toggleDrillMode: () => set((state) => ({ isDrillMode: !state.isDrillMode })),
  setDrillResult: (result) => set({ drillResult: result }),

  updateGuestStatus: (guestId, status) =>
    set((state) => ({
      guests: state.guests.map((g) =>
        g.id === guestId ? { ...g, status } : g
      ),
    })),
}));

export { genId };
