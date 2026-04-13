/**
 * Face Authentication Service
 * Handles face detection, embedding generation, and face matching
 * Uses MediaPipe for robust face detection and embedding
 */

import {
  FaceDetector,
  FilesetResolver
} from '@mediapipe/tasks-vision';

let faceDetector = null;
let isInitialized = false;

/**
 * Initialize MediaPipe FaceDetector
 */
export const initializeFaceDetector = async () => {
  if (isInitialized) return faceDetector;

  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
    );
    
    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'
      },
      runningMode: 'IMAGE',
      minConfidenceThreshold: 0.7
    });

    isInitialized = true;
    console.log('[FaceAuth] FaceDetector initialized');
    return faceDetector;
  } catch (error) {
    console.error('[FaceAuth] Failed to initialize FaceDetector:', error);
    throw error;
  }
};

/**
 * Generate face embedding from image source
 * Can be Canvas, HTMLImageElement, or Blob
 */
export const generateFaceEmbedding = async (imageSource) => {
  try {
    if (!faceDetector) {
      await initializeFaceDetector();
    }

    // Convert various image sources to proper format
    let source = imageSource;
    if (typeof imageSource === 'string') {
      // URL string - convert to HTMLImageElement
      source = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageSource;
      });
    }

    // Detect faces
    const results = faceDetector.detect(source);

    if (!results.detections || results.detections.length === 0) {
      return null;
    }

    // Get the first (primary) face detection
    const detection = results.detections[0];
    
    // Extract bounding box and keypoints for embedding
    const embedding = {
      confidence: detection.categories[0]?.score || 0,
      boundingBox: detection.boundingBox || {},
      keypoints: detection.keypoints || []
    };

    return embedding;
  } catch (error) {
    console.error('[FaceAuth] Error generating embedding:', error);
    throw error;
  }
};

/**
 * Compare two face embeddings using Euclidean distance
 * Returns similarity score (0-1, where 1 is perfect match)
 */
export const compareFaceEmbeddings = (embedding1, embedding2) => {
  if (!embedding1 || !embedding2) {
    return 0;
  }

  try {
    const kp1 = embedding1.keypoints || [];
    const kp2 = embedding2.keypoints || [];

    if (kp1.length === 0 || kp2.length === 0) {
      return 0;
    }

    // Calculate Euclidean distance using keypoints
    let sumSquaredDiff = 0;
    const numPoints = Math.min(kp1.length, kp2.length);

    for (let i = 0; i < numPoints; i++) {
      const dx = (kp1[i].x || 0) - (kp2[i].x || 0);
      const dy = (kp1[i].y || 0) - (kp2[i].y || 0);
      sumSquaredDiff += dx * dx + dy * dy;
    }

    const euclideanDistance = Math.sqrt(sumSquaredDiff / numPoints);
    
    // Convert distance to similarity (0-1 scale)
    // Lower distance = higher similarity
    // STRICTER: Use smaller max distance (0.3 instead of 1.5 for tighter matching)
    const similarity = Math.max(0, 1 - (euclideanDistance / 0.3));

    console.log('[FaceAuth] Comparison - Distance:', euclideanDistance.toFixed(3), 'Similarity:', similarity.toFixed(3));

    return similarity;
  } catch (error) {
    console.error('[FaceAuth] Error comparing embeddings:', error);
    return 0;
  }
};

/**
 * Perform full face authentication verification
 * Compares live face from canvas with reference face image
 * @returns { match: boolean, similarity: number, confidence: number }
 */
export const performFaceAuthentication = async (liveCanvas, referenceImageUrl, threshold = 0.50) => {
  try {
    console.log('[FaceAuth] Starting authentication verification...');

    // Generate embeddings
    const liveEmbedding = await generateFaceEmbedding(liveCanvas);
    if (!liveEmbedding) {
      return {
        match: false,
        similarity: 0,
        confidence: 0,
        error: 'No face detected in live feed'
      };
    }

    console.log('[FaceAuth] Live face detected. Confidence:', liveEmbedding.confidence?.toFixed(3));

    const referenceEmbedding = await generateFaceEmbedding(referenceImageUrl);
    if (!referenceEmbedding) {
      return {
        match: false,
        similarity: 0,
        confidence: 0,
        error: 'No face detected in reference image. Please ensure reference image is a real photo.'
      };
    }

    console.log('[FaceAuth] Reference face detected. Confidence:', referenceEmbedding.confidence?.toFixed(3));

    // STRICT validation: Both must have high confidence detections
    if (referenceEmbedding.confidence < 0.7) {
      return {
        match: false,
        similarity: 0,
        confidence: referenceEmbedding.confidence || 0,
        error: 'Reference image quality too low. Contact admin to update reference photo.'
      };
    }

    // Compare embeddings
    const similarity = compareFaceEmbeddings(liveEmbedding, referenceEmbedding);
    const liveConfidence = liveEmbedding.confidence || 0;

    // MODERATE verification: 50% similarity + 70% live confidence + 70% reference confidence
    const match = similarity >= threshold && liveConfidence >= 0.70 && referenceEmbedding.confidence >= 0.7;

    console.log('[FaceAuth] Results:', {
      match,
      similarity: similarity.toFixed(3),
      liveConfidence: liveConfidence.toFixed(3),
      refConfidence: referenceEmbedding.confidence?.toFixed(3),
      threshold: threshold.toFixed(2),
      reason: !match ? `Threshold check: sim=${(similarity >= threshold)}, conf=${(liveConfidence >= 0.70)}` : 'MATCH'
    });

    return {
      match,
      similarity: similarity,
      confidence: liveConfidence,
      liveDetection: liveEmbedding,
      referenceDetection: referenceEmbedding
    };
  } catch (error) {
    console.error('[FaceAuth] Authentication error:', error);
    return {
      match: false,
      similarity: 0,
      confidence: 0,
      error: error.message
    };
  }
};

/**
 * Quick face detection check (for login phase)
 */
export const detectFace = async (imageSource) => {
  try {
    if (!faceDetector) {
      await initializeFaceDetector();
    }

    let source = imageSource;
    if (typeof imageSource === 'string') {
      source = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageSource;
      });
    }

    const results = faceDetector.detect(source);
    return {
      detected: results.detections && results.detections.length > 0,
      count: results.detections?.length || 0,
      detections: results.detections || []
    };
  } catch (error) {
    console.error('[FaceAuth] Detection error:', error);
    return {
      detected: false,
      count: 0,
      detections: [],
      error: error.message
    };
  }
};

export default {
  initializeFaceDetector,
  generateFaceEmbedding,
  compareFaceEmbeddings,
  performFaceAuthentication,
  detectFace
};
