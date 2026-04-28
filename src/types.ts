export type Severity = 'P1' | 'P2' | 'P3';
export type IncidentType = 'medical' | 'fire' | 'security' | 'hazmat' | 'structural' | 'flood' | 'power' | 'other';
export type IncidentStatus = 'active' | 'responding' | 'contained' | 'resolved';
export type ResponderRole = 'SECURITY' | 'MEDICAL' | 'GM' | 'FIRE DEPT' | 'MAINTENANCE' | 'FRONT DESK';
export type ZoneStatus = 'clear' | 'alert' | 'active';
export type GuestStatus = 'safe' | 'unaccounted' | 'evacuated';
export type DrillScenario = 'fire' | 'medical' | 'active_threat' | 'flood' | 'power_failure';

export interface Incident {
  id: string;
  type: IncidentType;
  severity: Severity;
  status: IncidentStatus;
  title: string;
  description: string;
  location: string;
  zone: string;
  roomNumber?: string;
  reportedAt: number;
  resolvedAt?: number;
  assignedResponders: string[];
  guestId?: string;
  language?: string;
  timeline: TimelineEntry[];
  chatMessages: ChatMessage[];
}

export interface TimelineEntry {
  id: string;
  timestamp: number;
  actor: string;
  role: ResponderRole | 'SYSTEM' | 'AI' | 'GUEST';
  action: string;
  detail?: string;
}

export interface ChatMessage {
  id: string;
  timestamp: number;
  sender: string;
  role: ResponderRole | 'SYSTEM' | 'AI' | 'GUEST';
  message: string;
}

export interface Responder {
  id: string;
  name: string;
  role: ResponderRole;
  status: 'available' | 'dispatched' | 'busy' | 'offline';
  currentZone: string;
  assignedIncidentId?: string;
  eta?: number;
}

export interface Guest {
  id: string;
  name: string;
  roomNumber: string;
  status: GuestStatus;
  floor: number;
  zone: string;
  checkInTime: number;
}

export interface Signal {
  id: string;
  source: 'CCTV' | 'SOS_TEXT' | 'SENSOR' | 'MANUAL';
  rawInput: string;
  aiClassification?: string;
  confidence?: number;
  assignedPriority?: Severity;
  threatCategory?: string;
  recommendedResponse?: string;
  dispatchRoles?: ResponderRole[];
  estimatedAffected?: number;
  timestamp: number;
  processed: boolean;
}

export interface Zone {
  id: string;
  name: string;
  floor: number;
  status: ZoneStatus;
  guestCount: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrillResult {
  scenario: DrillScenario;
  startedAt: number;
  endedAt?: number;
  steps: DrillStep[];
  overallScore: number;
  passed: boolean;
}

export interface DrillStep {
  id: string;
  description: string;
  expectedTime: number;
  actualTime?: number;
  completed: boolean;
  role: ResponderRole;
  passed?: boolean;
}

export interface SOSRequest {
  message: string;
  language?: string;
  parsed?: {
    incident_type: string;
    location_hint: string;
    severity_1_to_5: number;
    language_detected: string;
    immediate_action_required: boolean;
  };
}
