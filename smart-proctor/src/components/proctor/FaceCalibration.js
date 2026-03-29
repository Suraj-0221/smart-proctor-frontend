import React, { useEffect, useRef, useState, useCallback } from 'react';
import MediaPipeFaceDetection from '../../services/MediaPipeFaceDetection';
import calibrationData, { CALIBRATION_FRAMES } from '../../services/CalibrationData';

const DETECTION_INTERVAL = 100; // ms (~10fps during calibration)

export default function FaceCalibration({ onComplete }) {
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const intervalRef = useRef(null);

  const [frameCount, setFrameCount]   = useState(0);
  const [faceFound,  setFaceFound]    = useState(false);
  const [error,      setError]        = useState(null);
  const [phase,      setPhase]        = useState('starting'); // starting | calibrating | complete

  const progress = Math.min(frameCount / CALIBRATION_FRAMES, 1);
  const pct      = Math.round(progress * 100);

  // --- Webcam ---
  useEffect(() => {
    let active = true;

    const startCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        streamRef.current = stream;
        if (videoRef.current && active) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setPhase('calibrating');
        }
      } catch (err) {
        setError('Camera access denied. Please allow camera permission and reload.');
      }
    };

    startCam();
    return () => {
      active = false;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // --- Calibration loop ---
  const runCalibration = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;

    const { faceDetections } = await MediaPipeFaceDetection.detectFaces(videoRef.current);
    const found = faceDetections.length > 0;
    setFaceFound(found);

    if (found) {
      setFrameCount(prev => {
        const next = prev + 1;
        calibrationData.recordFrame(faceDetections, next);

        if (next >= CALIBRATION_FRAMES && calibrationData.isCalibrationComplete()) {
          clearInterval(intervalRef.current);
          setPhase('complete');
          if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
          setTimeout(() => onComplete(calibrationData.getBaseline()), 600);
        }
        return next;
      });
    }
  }, [onComplete]);

  useEffect(() => {
    if (phase !== 'calibrating') return;
    intervalRef.current = setInterval(runCalibration, DETECTION_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [phase, runCalibration]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.tag}>CALIBRATION</span>
        <h2 style={styles.title}>Establishing Baseline</h2>
        <p style={styles.subtitle}>
          Look directly at the camera, keep your face centred and relaxed.
        </p>
      </div>

      {error ? (
        <div style={styles.errorBox}>{error}</div>
      ) : (
        <div style={styles.videoContainer}>
          {/* Corner brackets */}
          <div style={{ ...styles.corner, top: 8, left: 8, borderRight: 'none', borderBottom: 'none' }} />
          <div style={{ ...styles.corner, top: 8, right: 8, borderLeft: 'none', borderBottom: 'none' }} />
          <div style={{ ...styles.corner, bottom: 8, left: 8, borderRight: 'none', borderTop: 'none' }} />
          <div style={{ ...styles.corner, bottom: 8, right: 8, borderLeft: 'none', borderTop: 'none' }} />

          <video
            ref={videoRef}
            style={styles.video}
            muted
            playsInline
          />

          {/* Face-found indicator */}
          <div style={{ ...styles.faceIndicator, borderColor: faceFound ? 'var(--cyan)' : 'var(--red)' }}>
            <span style={styles.faceStatus}>
              {faceFound ? '✓ FACE DETECTED' : '⚠ SEARCHING…'}
            </span>
          </div>

          {/* Progress bar overlay */}
          {phase === 'complete' && (
            <div style={styles.completeOverlay}>
              <span style={styles.completeText}>✓ CALIBRATION COMPLETE</span>
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      <div style={styles.progressSection}>
        <div style={styles.progressMeta}>
          <span style={styles.progressLabel}>Frames collected</span>
          <span style={styles.progressValue}>
            {Math.min(frameCount, CALIBRATION_FRAMES)} / {CALIBRATION_FRAMES}
          </span>
        </div>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${pct}%`,
              background: phase === 'complete'
                ? 'var(--green)'
                : `linear-gradient(90deg, var(--cyan-dim), var(--cyan))`,
            }}
          />
        </div>
        <div style={styles.progressHint}>
          {phase === 'starting'    && 'Starting camera…'}
          {phase === 'calibrating' && !faceFound && 'Position your face within the frame'}
          {phase === 'calibrating' && faceFound  && `Recording… ${pct}%`}
          {phase === 'complete'    && 'Baseline saved — launching exam'}
        </div>
      </div>

      {/* Instruction steps */}
      <div style={styles.steps}>
        {[
          { n: '01', text: 'Sit in your normal exam position' },
          { n: '02', text: 'Look directly at the camera' },
          { n: '03', text: 'Keep your face inside the frame' },
        ].map(step => (
          <div key={step.n} style={styles.step}>
            <span style={styles.stepN}>{step.n}</span>
            <span style={styles.stepText}>{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 32,
    padding: '40px 24px',
    maxWidth: 680,
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.15em',
    color: 'var(--cyan)',
    background: 'var(--cyan-glow)',
    padding: '4px 12px',
    borderRadius: 20,
    border: '1px solid rgba(0,229,255,0.3)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  errorBox: {
    background: 'var(--red-glow)',
    border: '1px solid rgba(255,59,92,0.4)',
    borderRadius: 8,
    padding: '16px 24px',
    color: 'var(--red)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 480,
  },
  videoContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: '#000',
    width: '100%',
    maxWidth: 560,
  },
  video: {
    width: '100%',
    display: 'block',
    transform: 'scaleX(-1)',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    border: '2px solid var(--cyan)',
    zIndex: 10,
    opacity: 0.8,
  },
  faceIndicator: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    border: '1px solid',
    borderRadius: 4,
    padding: '4px 12px',
    background: 'rgba(8,12,23,0.8)',
    backdropFilter: 'blur(4px)',
  },
  faceStatus: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.1em',
    color: 'var(--text-primary)',
  },
  completeOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,230,118,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(2px)',
  },
  completeText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--green)',
    letterSpacing: '0.1em',
  },
  progressSection: {
    width: '100%',
    maxWidth: 560,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  progressMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  progressLabel: {},
  progressValue: { color: 'var(--cyan)' },
  progressTrack: {
    height: 6,
    background: 'var(--bg-secondary)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  progressHint: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-muted)',
    textAlign: 'center',
    letterSpacing: '0.05em',
  },
  steps: {
    display: 'flex',
    gap: 12,
    width: '100%',
    maxWidth: 560,
  },
  step: {
    flex: 1,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  stepN: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--cyan)',
    letterSpacing: '0.1em',
  },
  stepText: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
};
