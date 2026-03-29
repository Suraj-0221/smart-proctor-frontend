/**
 * CalibrationData.js
 * Collects 45 frames of stable face data to establish a personal baseline.
 * Used to validate that subsequent head movements are within normal range.
 */

const CALIBRATION_FRAMES = 45;

class CalibrationData {
  constructor() {
    this._frames = [];
    this._baseline = null;
    this._tolerances = null;
  }

  /**
   * Record one frame of detection data.
   * @param {Array} detections  - Array of MediaPipe face detections
   * @param {number} frameCount - Current frame index (informational)
   */
  recordFrame(detections, frameCount) {
    if (this.isCalibrationComplete()) return;
    if (!detections || detections.length === 0) return;

    const face = detections[0];
    if (!face || !face.boundingBox) return;

    const { originX, originY, width, height } = face.boundingBox;
    const pose = face.headPose || { yaw: 0, pitch: 0, roll: 0 };

    this._frames.push({
      width,
      height,
      cx: originX + width / 2,
      cy: originY + height / 2,
      yaw: pose.yaw,
      pitch: pose.pitch,
      roll: pose.roll,
    });

    if (this._frames.length >= CALIBRATION_FRAMES) {
      this._computeBaseline();
    }
  }

  isCalibrationComplete() {
    return this._frames.length >= CALIBRATION_FRAMES && this._baseline !== null;
  }

  getProgress() {
    return Math.min(this._frames.length / CALIBRATION_FRAMES, 1.0);
  }

  /**
   * Returns the computed baseline averages.
   * @returns {{ size: {w, h}, position: {cx, cy}, pose: {yaw, pitch, roll} } | null}
   */
  getBaseline() {
    return this._baseline;
  }

  /**
   * Returns allowed deviation from baseline before flagging.
   * @returns {{ sizeDeviation, positionDeviation, poseDeviation } | null}
   */
  getTolerances() {
    return this._tolerances;
  }

  _avg(arr, key) {
    return arr.reduce((s, f) => s + f[key], 0) / arr.length;
  }

  _std(arr, key, mean) {
    const variance = arr.reduce((s, f) => s + Math.pow(f[key] - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }

  _computeBaseline() {
    const f = this._frames;

    const avgW   = this._avg(f, 'width');
    const avgH   = this._avg(f, 'height');
    const avgCx  = this._avg(f, 'cx');
    const avgCy  = this._avg(f, 'cy');
    const avgYaw = this._avg(f, 'yaw');
    const avgPit = this._avg(f, 'pitch');
    const avgRol = this._avg(f, 'roll');

    // Tolerances: 2 standard deviations + generous minimum
    const stdW   = this._std(f, 'width',  avgW);
    const stdCx  = this._std(f, 'cx',     avgCx);
    const stdYaw = this._std(f, 'yaw',    avgYaw);

    this._baseline = {
      size:     { w: avgW, h: avgH },
      position: { cx: avgCx, cy: avgCy },
      pose:     { yaw: avgYaw, pitch: avgPit, roll: avgRol },
    };

    this._tolerances = {
      sizeDeviation:     Math.max(stdW * 2, avgW * 0.25),
      positionDeviation: Math.max(stdCx * 2, 80),
      poseDeviation:     Math.max(stdYaw * 2, 30),
    };
  }

  reset() {
    this._frames = [];
    this._baseline = null;
    this._tolerances = null;
  }
}

// Singleton
const calibrationData = new CalibrationData();
export default calibrationData;
export { CalibrationData, CALIBRATION_FRAMES };
