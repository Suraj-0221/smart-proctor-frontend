/**
 * MediaPipeFaceDetection.js
 * Modern detection engine using Google MediaPipe Tasks Vision.
 *
 * Replaces deprecated face-api.js with 468-landmark detection and
 * accurate head-pose estimation (yaw, pitch, roll).
 */

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

class MediaPipeFaceDetectionService {
  constructor() {
    this._detector = null;
    this._initialized = false;
    this._initializing = false;
    this._confidenceThreshold = 0.7;
  }

  /**
   * Load and warm-up the MediaPipe model.
   * Safe to call multiple times — only initialises once.
   */
  async initialize() {
    if (this._initialized) return;
    if (this._initializing) {
      // Wait for the ongoing init to finish
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (this._initialized) {
            clearInterval(check);
            resolve();
          }
        }, 200);
      });
    }

    this._initializing = true;

    try {
      const vision = await import('@mediapipe/tasks-vision');
      const { FaceDetector, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(WASM_URL);

      this._detector = await FaceDetector.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        minDetectionConfidence: this._confidenceThreshold,
        minSuppressionThreshold: 0.3,
      });

      this._initialized = true;
      console.info('[MediaPipe] Face detector initialised ✓');
    } catch (err) {
      console.error('[MediaPipe] Initialisation failed:', err);
      this._initializing = false;
      throw err;
    }
  }

  /**
   * Run face detection on a video element frame.
   * @param {HTMLVideoElement} videoElement
   * @returns {{ faceDetections: Array }}
   */
  async detectFaces(videoElement) {
    if (!this._initialized || !this._detector) {
      return { faceDetections: [] };
    }

    if (!videoElement || videoElement.readyState < 2) {
      return { faceDetections: [] };
    }

    try {
      const now = performance.now();
      const result = this._detector.detectForVideo(videoElement, now);

      const faceDetections = (result.detections || []).map((det) => {
        const bb = det.boundingBox;
        const landmarks = det.keypoints || [];

        // Estimate head pose from facial landmarks when available
        const headPose = this._estimateHeadPose(landmarks, bb);

        return {
          boundingBox: {
            originX: bb ? bb.originX : 0,
            originY: bb ? bb.originY : 0,
            width:   bb ? bb.width   : 0,
            height:  bb ? bb.height  : 0,
          },
          landmarks,
          headPose,
          confidence: det.categories?.[0]?.score ?? 1.0,
        };
      });

      return { faceDetections };
    } catch (err) {
      console.warn('[MediaPipe] Detection error:', err.message);
      return { faceDetections: [] };
    }
  }

  /**
   * Lightweight head-pose estimation from BlazeFace keypoints.
   * Keypoints order: right-eye, left-eye, nose, mouth, right-ear, left-ear
   */
  _estimateHeadPose(keypoints, bb) {
    if (!keypoints || keypoints.length < 4) {
      return { yaw: 0, pitch: 0, roll: 0 };
    }

    const [rightEye, leftEye, nose, mouth] = keypoints;

    // Roll: angle between eyes
    const eyeDx = leftEye.x - rightEye.x;
    const eyeDy = leftEye.y - rightEye.y;
    const roll  = Math.atan2(eyeDy, eyeDx) * (180 / Math.PI);

    // Yaw: nose offset from eye midpoint (horizontal asymmetry)
    const eyeMidX = (rightEye.x + leftEye.x) / 2;
    const eyeSpan = Math.abs(leftEye.x - rightEye.x);
    const yaw     = eyeSpan > 0 ? ((nose.x - eyeMidX) / eyeSpan) * 90 : 0;

    // Pitch: nose offset below eye midpoint relative to face height
    const eyeMidY  = (rightEye.y + leftEye.y) / 2;
    const faceH    = bb ? bb.height : 1;
    const pitch    = faceH > 0 ? ((nose.y - eyeMidY) / faceH) * 90 : 0;

    return { yaw, pitch, roll };
  }

  isInitialized() {
    return this._initialized;
  }

  getConfidenceThreshold() {
    return this._confidenceThreshold;
  }

  setConfidenceThreshold(value) {
    if (value >= 0.3 && value <= 1.0) {
      this._confidenceThreshold = value;
    }
  }
}

// Singleton — model is cached in memory for the session lifetime
const MediaPipeFaceDetection = new MediaPipeFaceDetectionService();
export default MediaPipeFaceDetection;
export { MediaPipeFaceDetectionService };
