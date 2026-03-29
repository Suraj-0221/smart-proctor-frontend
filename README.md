# Smart Proctor

AI-powered exam proctoring system using Google MediaPipe for real-time face detection and head pose estimation.

---

## Quick Start

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

| Layer | File | Purpose |
|---|---|---|
| Detection Engine | `src/services/MediaPipeFaceDetection.js` | MediaPipe 468-landmark detection + head pose |
| Stability Layer | `src/services/DetectionBuffer.js` | 15-frame rolling buffer, 85% voting threshold |
| Calibration | `src/services/CalibrationData.js` | 45-frame personal baseline collection |
| Exam UI | `src/pages/ExamPage.js` | Calibration → monitoring → submit flow |
| Webcam Feed | `src/components/proctor/WebcamFeed.js` | Live detection with bounding-box overlay |
| Calibration UI | `src/components/proctor/FaceCalibration.js` | Baseline collection wizard |
| Tab Monitor | `src/components/proctor/TabMonitor.js` | Window focus / tab-switch detection |
| Risk Chart | `src/components/proctor/RiskChart.js` | Recharts area chart of risk timeline |
| Warnings | `src/components/proctor/WarningBadges.js` | Violation summary badges |

---

## Risk Scoring

| Event | Penalty | Notes |
|---|---|---|
| Face leaves frame (0 faces) | +15% | After buffer stability |
| Multiple faces (2+) | +20% | After buffer stability |
| Tab switch | +10% | Immediate |
| Head movement / tilt | **0%** | Natural behaviour, never penalised |

---

## Configuration

### DetectionBuffer.js
```js
bufferSize        = 15   // frames in rolling window
stabilityThreshold = 0.85 // fraction that must agree
reportCooldown    = 2500  // ms between reports
```

### MediaPipeFaceDetection.js
```js
confidenceThreshold = 0.7  // valid: 0.5–0.8
```

---

## Performance

| Metric | Expected |
|---|---|
| Initial load | 10–15 s (CDN model) |
| Per-frame | 30–50 ms |
| FPS | 25–30 |
| Memory | 150–200 MB |

---

## Technology Stack

- **React 18** — UI framework
- **@mediapipe/tasks-vision** — 468-point face detection + head pose
- **Recharts** — Risk timeline chart
- **React Router v6** — Page routing
- **Space Mono + Syne** — Typography

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | LoginPage | Candidate sign-in |
| `/dashboard` | Dashboard | Admin session overview |
| `/exam` | ExamPage | Calibration + live exam |
| `/review` | ReviewPage | Post-session analysis |
