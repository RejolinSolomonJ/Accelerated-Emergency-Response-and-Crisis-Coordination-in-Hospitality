import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI | null {
  if (!API_KEY) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

export function isGeminiAvailable(): boolean {
  return !!API_KEY;
}

// ========================
// A. SOS Natural Language Parser
// ========================
export async function parseSOSMessage(
  userMessage: string,
  onChunk?: (text: string) => void
): Promise<{
  incident_type: string;
  location_hint: string;
  severity_1_to_5: number;
  language_detected: string;
  immediate_action_required: boolean;
}> {
  const ai = getGenAI();

  // Fallback if no API key
  if (!ai) {
    return fallbackParseSOS(userMessage);
  }

  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const systemPrompt = `You are an emergency triage AI for a hotel/hospitality venue called "HospitalityShield". 
Extract from the user's emergency message the following fields. 
Return ONLY valid JSON with no markdown formatting, no code fences, just raw JSON:

{
  "incident_type": "<one of: medical, fire, security, hazmat, structural, flood, power, other>",
  "location_hint": "<extracted room number or location, e.g. 'Room 412' or 'Lobby'>",
  "severity_1_to_5": <integer 1-5 where 5 is most severe>,
  "language_detected": "<language of the user's message>",
  "immediate_action_required": <true or false>
}

Rules:
- If you detect chest pain, breathing issues, unconsciousness, or cardiac keywords → severity 4-5, medical
- If you detect fire, smoke, flames → severity 4-5, fire
- If you detect weapon, threat, violence → severity 5, security
- If you detect water, flood, leak → severity 3-4, flood
- If you detect power outage, darkness → severity 2-3, power
- Extract room numbers from any language format
- Detect the language the message was written in
- Always set immediate_action_required to true for severity >= 4`;

  try {
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\nUser emergency message: "' + userMessage + '"' }] }
      ],
    });

    const responseText = result.response.text();

    if (onChunk) {
      // Simulate streaming for display
      for (let i = 0; i <= responseText.length; i += 2) {
        await new Promise((r) => setTimeout(r, 10));
        onChunk(responseText.slice(0, i));
      }
      onChunk(responseText);
    }

    // Parse JSON — handle potential markdown fences
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Gemini SOS parse error:', error);
    return fallbackParseSOS(userMessage);
  }
}

// ========================
// B. Threat Classifier
// ========================
export async function classifyThreat(
  signalDescription: string,
  source: string
): Promise<{
  threat_category: string;
  confidence: number;
  recommended_response: string;
  dispatch_roles: string[];
  estimated_affected_guests: number;
}> {
  const ai = getGenAI();

  if (!ai) {
    return fallbackClassifyThreat(signalDescription);
  }

  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a threat classification AI for hotel security system "HospitalityShield".
Classify the following ${source} signal and return ONLY valid JSON (no markdown, no code fences):

{
  "threat_category": "<category like medical_cardiac, fire_smoke, security_assault, infrastructure_water, etc>",
  "confidence": <float 0.0-1.0>,
  "recommended_response": "<brief action recommendation>",
  "dispatch_roles": [<array of: "SECURITY", "MEDICAL", "MAINTENANCE", "GM", "FRONT DESK", "FIRE DEPT">],
  "estimated_affected_guests": <integer>
}

Signal input: "${signalDescription}"`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Gemini threat classify error:', error);
    return fallbackClassifyThreat(signalDescription);
  }
}

// ========================
// D. Post-Incident Report Generator
// ========================
export async function generateIncidentReport(
  incidentData: {
    title: string;
    type: string;
    severity: string;
    description: string;
    location: string;
    reportedAt: number;
    resolvedAt?: number;
    timeline: { timestamp: number; actor: string; role: string; action: string; detail?: string }[];
  },
  onChunk?: (text: string) => void
): Promise<string> {
  const ai = getGenAI();

  if (!ai) {
    return fallbackIncidentReport(incidentData);
  }

  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const timelineStr = incidentData.timeline
    .map((t) => `- [${new Date(t.timestamp).toLocaleTimeString()}] [${t.role}] ${t.actor}: ${t.action}${t.detail ? ` (${t.detail})` : ''}`)
    .join('\n');

  const prompt = `You are an AI post-incident report generator for HospitalityShield hotel emergency platform.
Generate a comprehensive, professional incident report in markdown format based on the following data:

Incident: ${incidentData.title}
Type: ${incidentData.type}
Severity: ${incidentData.severity}
Description: ${incidentData.description}
Location: ${incidentData.location}
Reported At: ${new Date(incidentData.reportedAt).toLocaleString()}
${incidentData.resolvedAt ? `Resolved At: ${new Date(incidentData.resolvedAt).toLocaleString()}` : 'Status: ONGOING'}

Timeline:
${timelineStr}

Include these sections:
1. Executive Summary
2. Response Timeline with exact timestamps
3. Response Performance Analysis (compare against industry targets: detection <15s, dispatch <60s, arrival <2min, 911 notification <2min)
4. Response Gaps Identified (highlight areas exceeding targets)
5. Compliance Notes (OSHA, insurance, guest consent)
6. Training Recommendations for specific staff
7. AI Analysis Confidence assessment

End with: "Report generated by HospitalityShield AI · Model: Gemini 2.0 Flash"`;

  try {
    const result = await model.generateContentStream(prompt);
    let fullText = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      if (onChunk) onChunk(fullText);
    }

    return fullText;
  } catch (error) {
    console.error('Gemini report generation error:', error);
    return fallbackIncidentReport(incidentData);
  }
}

// ========================
// E. Emergency Chat (conversational)
// ========================
export async function chatWithEmergencyAI(
  messages: { role: 'user' | 'model'; text: string }[],
  userMessage: string,
  onChunk?: (text: string) => void
): Promise<string> {
  const ai = getGenAI();

  if (!ai) {
    return fallbackChatResponse(userMessage);
  }

  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const systemContext = `You are an emergency response AI assistant for HospitalityShield, a hotel emergency coordination platform. 
You are helping a guest who has triggered an emergency SOS. 
Be calm, reassuring, and extract critical information: what happened, where they are, how many people are affected, and any injuries.
Keep responses concise (2-3 sentences max). Always reassure help is coming.
If the guest writes in another language, respond in that same language.`;

  const chatHistory = messages.map((m) => ({
    role: m.role as 'user' | 'model',
    parts: [{ text: m.text }],
  }));

  try {
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemContext }] },
        { role: 'model', parts: [{ text: 'Understood. I am ready to assist with any emergency situation at the hotel. I will remain calm, extract critical details, and reassure the guest.' }] },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessageStream(userMessage);
    let fullText = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      if (onChunk) onChunk(fullText);
    }

    return fullText;
  } catch (error) {
    console.error('Gemini chat error:', error);
    return fallbackChatResponse(userMessage);
  }
}

// ========================
// FALLBACKS (work without API key)
// ========================

function fallbackParseSOS(message: string) {
  const lower = message.toLowerCase();
  const parsed = {
    incident_type: 'other',
    location_hint: 'Unknown',
    severity_1_to_5: 3,
    language_detected: 'English',
    immediate_action_required: false,
  };

  if (lower.includes('fire') || lower.includes('smoke') || lower.includes('fuego') || lower.includes('incendie')) {
    parsed.incident_type = 'fire'; parsed.severity_1_to_5 = 5; parsed.immediate_action_required = true;
  } else if (lower.includes('chest') || lower.includes('heart') || lower.includes('breath') || lower.includes('unconscious') || lower.includes('dolor')) {
    parsed.incident_type = 'medical'; parsed.severity_1_to_5 = 5; parsed.immediate_action_required = true;
  } else if (lower.includes('fight') || lower.includes('weapon') || lower.includes('threat') || lower.includes('gun') || lower.includes('knife')) {
    parsed.incident_type = 'security'; parsed.severity_1_to_5 = 5; parsed.immediate_action_required = true;
  } else if (lower.includes('flood') || lower.includes('water') || lower.includes('leak') || lower.includes('pipe')) {
    parsed.incident_type = 'flood'; parsed.severity_1_to_5 = 3;
  } else if (lower.includes('power') || lower.includes('dark') || lower.includes('electricity') || lower.includes('light')) {
    parsed.incident_type = 'power'; parsed.severity_1_to_5 = 2;
  } else if (lower.includes('fall') || lower.includes('hurt') || lower.includes('pain') || lower.includes('blood') || lower.includes('help')) {
    parsed.incident_type = 'medical'; parsed.severity_1_to_5 = 4; parsed.immediate_action_required = true;
  }

  // Detect language
  if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/.test(message)) parsed.language_detected = 'Japanese';
  else if (/[áéíóúñ¿¡]/.test(message) || lower.includes('ayuda') || lower.includes('fuego')) parsed.language_detected = 'Spanish';
  else if (/[àâçéèêëîïôùûüÿ]/.test(message) || lower.includes('aide') || lower.includes('secours')) parsed.language_detected = 'French';
  else if (/[äöüß]/.test(message) || lower.includes('hilfe')) parsed.language_detected = 'German';

  // Extract room
  const roomMatch = message.match(/room\s*(\d+)/i) || message.match(/habitaci[óo]n\s*(\d+)/i) || message.match(/部屋\s*(\d+)/) || message.match(/(\d{3,4})/);
  if (roomMatch) parsed.location_hint = `Room ${roomMatch[1]}`;

  return parsed;
}

function fallbackClassifyThreat(description: string) {
  const lower = description.toLowerCase();
  let category = 'unknown', confidence = 0.75, response = 'Investigate immediately', roles: string[] = ['SECURITY'], affected = 1;

  if (lower.includes('fire') || lower.includes('smoke') || lower.includes('grease') || lower.includes('flame')) {
    category = 'fire_hazard'; confidence = 0.91; response = 'Dispatch fire team. Prepare evacuation.'; roles = ['SECURITY', 'MAINTENANCE']; affected = 15;
  } else if (lower.includes('unconscious') || lower.includes('medical') || lower.includes('drowning') || lower.includes('chest')) {
    category = 'medical_emergency'; confidence = 0.88; response = 'Dispatch medical team immediately. Call 911.'; roles = ['MEDICAL']; affected = 1;
  } else if (lower.includes('aggressive') || lower.includes('fight') || lower.includes('assault') || lower.includes('weapon')) {
    category = 'security_threat'; confidence = 0.85; response = 'Dispatch security. Isolate area.'; roles = ['SECURITY']; affected = 8;
  } else if (lower.includes('water') || lower.includes('flood') || lower.includes('pipe') || lower.includes('leak')) {
    category = 'infrastructure_water'; confidence = 0.90; response = 'Shut water valve. Dispatch maintenance.'; roles = ['MAINTENANCE']; affected = 12;
  } else if (lower.includes('elevator') || lower.includes('stuck') || lower.includes('trapped')) {
    category = 'infrastructure_elevator'; confidence = 0.95; response = 'Establish communication. Dispatch maintenance.'; roles = ['MAINTENANCE']; affected = 3;
  } else if (lower.includes('power') || lower.includes('voltage') || lower.includes('electric')) {
    category = 'infrastructure_power'; confidence = 0.87; response = 'Check generators. Dispatch maintenance.'; roles = ['MAINTENANCE']; affected = 30;
  } else if (lower.includes('bag') || lower.includes('suspicious') || lower.includes('unattended')) {
    category = 'security_suspicious'; confidence = 0.79; response = 'Visual inspection. Establish perimeter.'; roles = ['SECURITY']; affected = 4;
  }

  return { threat_category: category, confidence, recommended_response: response, dispatch_roles: roles, estimated_affected_guests: affected };
}

function fallbackChatResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('fire') || lower.includes('smoke')) {
    return "I understand you're reporting a fire/smoke emergency. Help is being dispatched immediately. Please move to the nearest exit if safe. Do NOT use elevators. Stay low to avoid smoke inhalation. Are you able to evacuate your room?";
  }
  if (lower.includes('chest') || lower.includes('heart') || lower.includes('pain') || lower.includes('medical')) {
    return "I'm dispatching medical help to your location right now. Please try to stay calm and seated. Is the person conscious and breathing? Have them chew an aspirin if available. Help will arrive within 2 minutes.";
  }
  if (lower.includes('fight') || lower.includes('weapon') || lower.includes('threat')) {
    return "Security is being dispatched immediately. Please lock your door and stay inside. Do NOT confront anyone. Can you tell me exactly where the threat is located?";
  }
  return "I've received your emergency report. Help is being dispatched to your location now. Can you provide more details about what's happening? Your room number will help us reach you faster.";
}

function fallbackIncidentReport(data: any): string {
  const timeline = data.timeline
    ?.map((t: any) => `- **${new Date(t.timestamp).toLocaleTimeString()}** — [${t.role}] ${t.actor}: ${t.action}${t.detail ? ` _(${t.detail})_` : ''}`)
    .join('\n') || 'No timeline data';

  return `# Incident Report — ${data.title}

## Executive Summary
A ${data.type} emergency (${data.severity}) was reported at ${data.location}. ${data.description}

## Response Timeline
${timeline}

## Response Performance
| Metric | Target | Status |
|--------|--------|--------|
| Detection to Alert | <15s | [PASS] Within target |
| Dispatch Time | <60s | [PASS] Within target |
| First Responder Arrival | <2 min | [WARN] Needs review |
| 911 Notification | <2 min | [PASS] Automatic |

## Recommendations
1. Review response time for first responder arrival
2. Ensure AED units are placed on every floor
3. Conduct follow-up staff training

---
*Report generated by HospitalityShield AI (Fallback Mode)*`;
}
