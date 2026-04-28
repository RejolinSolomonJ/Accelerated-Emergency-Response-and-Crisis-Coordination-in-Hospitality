#  HospitalityShield
### Rapid Crisis Response & Emergency Coordination Platform

**HospitalityShield** is a premium, AI-powered command center designed for modern hospitality venues. It bridges the gap between guest emergencies and staff response times through real-time AI triage, live venue state visualization, and automated post-incident intelligence.

---

##  Key Features

### 1. **AI Triage Engine**
Analyzes incoming signals (CCTV anomalies, Guest SOS texts, Sensor triggers) using **Gemini 2.0 Flash**. 
- Automatically classifies incidents by severity (P1-P3).
- Recommends immediate response actions and necessary dispatch roles.
- Multilingual support for guest SOS messages.

### 2. **Operations Dashboard**
A unified "Command Center" view for venue staff:
- **Live Floor Plan:** SVG-based venue map with real-time status indicators for every floor.
- **Incident Queue:** Prioritized list of active emergencies.
- **Resource Management:** Live status and location of security, medical, and maintenance teams.

### 3. **Guest SOS Portal**
Mobile-optimized, QR-accessible interface for guests:
- One-tap activation button.
- **AI Emergency Chat:** Real-time chat powered by Gemini to extract location and incident details.
- Status tracking for the guest to see when help is arriving.

### 4. **Post-Incident AI Debrief**
Automated intelligence for better compliance and training:
- **Narrative Generation:** AI generates professional narrative reports of incidents.
- **Response Gap Analysis:** Compares response times against industry targets.
- **Training Recommendations:** Targeted feedback for staff based on incident performance.

---

##  Tech Stack

- **Frontend:** React 19, Vite, TypeScript
- **Styling:** Premium Light Theme (Vanilla CSS), Lucide Icons
- **AI Core:** Google Gemini 2.0 Flash (via `@google/generative-ai`)
- **State Management:** Zustand
- **Deployment:** Firebase Hosting / Google Cloud (GCP)

---

##  Getting Started

### Prerequisites
- Node.js 18+
- Google AI Studio API Key (for Gemini)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RejolinSolomonJ/-Accelerated-Emergency-Response-and-Crisis-Coordination-in-Hospitality.git
   cd "Hospital Emergency"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Run Locally:**
   ```bash
   npm run dev
   ```

---

##  Deployment

### Firebase Hosting
```bash
npm run build
npx firebase deploy
```

### GCP Cloud Run
```bash
gcloud run deploy hospitality-shield --source . --platform managed --region us-central1 --allow-unauthenticated
```

---

##  Security
- `.env` is ignored by Git to protect API keys.
- AI Triage inputs are sanitized before processing.

---
*Created for the Google Cloud / Gemini AI Hackathon.*
