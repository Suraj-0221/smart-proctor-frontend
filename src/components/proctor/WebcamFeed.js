import React, { useEffect, useRef, useState, useCallback } from 'react';
import MediaPipeFaceDetection from '../../services/MediaPipeFaceDetection';
import detectionBuffer from '../../services/DetectionBuffer';

const DETECTION_INTERVAL = 33; // ~30 fps

const RISK_PENALTIES = {
  NO_FACE:        0.15,
  MULTIPLE_FACES: 0.20,
  HEAD_MOVEMENT:  0.0,   // Never penalise natural movement
};

export default function WebcamFeed({ baseline, onViolation, onFaceCountChange }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef  = useRef(null);

  const [faceCount,    setFaceCount]    = useState(1);
  const [isReady,      setIsReady]      = useState(false);
  const [headPose,     setHeadPose]     = useState({ yaw: 0, pitch: 0, roll: 0 });
  const [stability,    setStability]    = useState(0);
  const [fps,          setFps]          = useState(0);

  const fpsRef     = useRef(0);
  const fpsTimer   = useRef(Date.now());

  // --- Webcam start ---
  useEffect(() => {
    let active = true;
    detectionBuffer.reset();

    const startCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
        streamRef.current = stream;
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch (err) {
        console.error('[WebcamFeed] Camera error:', err);
      }
    };

    startCam();
    return () => {
      active = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // --- Detection loop ---
  const processFrame = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;

    const { faceDetections } = await MediaPipeFaceDetection.detectFaces(videoRef.current);
    const count = faceDetections.length;

    // Update buffer
    detectionBuffer.updateBuffer(count);
    setFaceCount(count);
    setStability(Math.round(detectionBuffer.getStabilityRatio() * 100));

    // Head pose (no penalty — informational only)
    if (faceDetections[0]?.headPose) {
      setHeadPose(faceDetections[0].headPose);
    }

    // Draw overlay
    drawOverlay(faceDetections);

    // Report stable violations
    if (detectionBuffer.shouldReport()) {
      const stable = detectionBuffer.getStableCount();
      onFaceCountChange?.(stable);

      if (stable === 0) {
        onViolation?.({ type: 'NO_FACE', penalty: RISK_PENALTIES.NO_FACE, count: stable });
      } else if (stable >= 2) {
        onViolation?.({ type: 'MULTIPLE_FACES', penalty: RISK_PENALTIES.MULTIPLE_FACES, count: stable });
      }
    }

    // FPS counter
    fpsRef.current += 1;
    const now = Date.now();
    if (now - fpsTimer.current >= 1000) {
      setFps(fpsRef.current);
      fpsRef.current = 0;
      fpsTimer.current = now;
    }
  }, [onViolation, onFaceCountChange]);

  useEffect(() => {
    if (!isReady) return;
    timerRef.current = setInterval(processFrame, DETECTION_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [isReady, processFrame]);

  // --- Canvas overlay ---
  const drawOverlay = (detections) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width  / (video.videoWidth  || 640);
    const scaleY = canvas.height / (video.videoHeight || 480);

    detections.forEach((det, idx) => {
      const { originX, originY, width, height } = det.boundingBox;
      const x = (canvas.width - (originX + width) * scaleX); // mirror
      const y = originY * scaleY;
      const w = width  * scaleX;
      const h = height * scaleY;

      const isFirst = idx === 0;
      const color = isFirst ? '#00e5ff' : '#ff3b5c';

      // Bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      ctx.strokeRect(x, y, w, h);

      // Corner accents
      const cs = 12;
      ctx.lineWidth = 3;
      [[x, y, cs, 0, 0, cs], [x+w, y, -cs, 0, 0, cs],
       [x, y+h, cs, 0, 0, -cs], [x+w, y+h, -cs, 0, 0, -cs]].forEach(([cx, cy, dx, dy, ex, ey]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx, cy + dy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + ex, cy + ey);
        ctx.stroke();
      });

      // Label
      ctx.fillStyle = color;
      ctx.font = '10px Space Mono, monospace';
      ctx.fillText(isFirst ? `CANDIDATE  ${Math.round(det.confidence * 100)}%` : `FACE ${idx + 1}`, x + 4, y - 6);
    });
  };

  const faceStatusColor = faceCount === 0 ? 'var(--red)' : faceCount === 1 ? 'var(--cyan)' : 'var(--amber)';
  const faceStatusText  = faceCount === 0 ? 'NO FACE'
    : faceCount === 1 ? '1 FACE'
    : `${faceCount} FACES`;

  return (
    <div style={styles.wrapper}>
      <div style={styles.videoWrapper}>
        {/* Corner brackets */}
        {['tl','tr','bl','br'].map(pos => (
          <div key={pos} style={{ ...styles.corner, ...cornerPos(pos) }} />
        ))}

        <video ref={videoRef} style={styles.video} muted playsInline />
        <canvas ref={canvasRef} style={styles.canvas} />

        {/* HUD bottom bar */}
        <div style={styles.hud}>
          <span style={{ ...styles.hudItem, color: faceStatusColor }}>
            <span style={{ ...styles.dot, background: faceStatusColor, boxShadow: `0 0 6px ${faceStatusColor}` }} />
            {faceStatusText}
          </span>
          <span style={styles.hudItem}>
            STABILITY {stability}%
          </span>
          <span style={styles.hudItem}>
            {fps} FPS
          </span>
        </div>

        {/* Not ready overlay */}
        {!isReady && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
            <span style={styles.loadingText}>INITIALISING CAMERA</span>
          </div>
        )}
      </div>

      {/* Head pose readout (info only — no penalty) */}
      <div style={styles.poseRow}>
        {[
          { label: 'YAW',   val: headPose.yaw   },
          { label: 'PITCH', val: headPose.pitch  },
          { label: 'ROLL',  val: headPose.roll   },
        ].map(({ label, val }) => (
          <div key={label} style={styles.poseItem}>
            <span style={styles.poseLabel}>{label}</span>
            <span style={styles.poseVal}>{val.toFixed(1)}°</span>
          </div>
        ))}
        <div style={styles.poseNote}>HEAD POSE — INFO ONLY, NOT SCORED</div>
      </div>
    </div>
  );
}

function cornerPos(pos) {
  const t = pos.startsWith('t');
  const l = pos.endsWith('l');
  return {
    top:          t ? 8   : undefined,
    bottom:       !t ? 8  : undefined,
    left:         l ? 8   : undefined,
    right:        !l ? 8  : undefined,
    borderTop:    !t ? 'none' : undefined,
    borderBottom: t  ? 'none' : undefined,
    borderLeft:   !l ? 'none' : undefined,
    borderRight:  l  ? 'none' : undefined,
  };
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: 8 },
  videoWrapper: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    background: '#000',
    border: '1px solid var(--border)',
  },
  video: {
    width: '100%',
    display: 'block',
    transform: 'scaleX(-1)',
  },
  canvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    transform: 'scaleX(1)', // canvas already mirrors in drawOverlay
    pointerEvents: 'none',
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    border: '2px solid var(--cyan)',
    zIndex: 10,
    opacity: 0.7,
  },
  hud: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(8,12,23,0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '6px 12px',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.08em',
    color: 'var(--text-secondary)',
    zIndex: 20,
  },
  hudItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    display: 'inline-block',
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(8,12,23,0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 30,
  },
  spinner: {
    width: 28,
    height: 28,
    border: '2px solid var(--border)',
    borderTop: '2px solid var(--cyan)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-secondary)',
    letterSpacing: '0.12em',
  },
  poseRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '6px 10px',
    background: 'var(--bg-secondary)',
    borderRadius: 6,
    border: '1px solid var(--border)',
  },
  poseItem: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  poseLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
  },
  poseVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-secondary)',
  },
  poseNote: {
    marginLeft: 'auto',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
    fontStyle: 'italic',
  },
};
