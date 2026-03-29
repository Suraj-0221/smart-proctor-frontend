/**
 * DetectionBuffer.js
 * Stability layer for face detection — eliminates per-frame fluctuations.
 *
 * Maintains a 15-frame rolling buffer and applies an 85% voting threshold.
 * Only reports a change when the buffer is stable, the count has changed,
 * and the 2.5-second cooldown has elapsed.
 */

class DetectionBuffer {
  constructor() {
    this.bufferSize = 15;
    this.stabilityThreshold = 0.85;
    this.reportCooldown = 2500; // ms

    this._buffer = [];
    this._lastReportedCount = null;
    this._lastReportTime = 0;
  }

  /**
   * Push a new face count into the buffer.
   * @param {number} faceCount
   */
  updateBuffer(faceCount) {
    this._buffer.push(faceCount);
    if (this._buffer.length > this.bufferSize) {
      this._buffer.shift();
    }
  }

  /**
   * Returns true when the buffer agrees on a single value by ≥85%.
   * @returns {boolean}
   */
  isStable() {
    if (this._buffer.length < this.bufferSize) return false;

    const counts = {};
    for (const c of this._buffer) {
      counts[c] = (counts[c] || 0) + 1;
    }

    const maxCount = Math.max(...Object.values(counts));
    return maxCount / this.bufferSize >= this.stabilityThreshold;
  }

  /**
   * Returns the face count that the buffer has converged on (majority value).
   * Returns null if not yet stable.
   * @returns {number|null}
   */
  getStableCount() {
    if (!this.isStable()) return null;

    const counts = {};
    for (const c of this._buffer) {
      counts[c] = (counts[c] || 0) + 1;
    }

    let maxCount = 0;
    let stableValue = null;
    for (const [val, cnt] of Object.entries(counts)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        stableValue = Number(val);
      }
    }
    return stableValue;
  }

  /**
   * Returns true when all conditions for reporting are met:
   *   1. Buffer is stable
   *   2. Count has changed from the last reported value
   *   3. Cooldown window has passed
   * @returns {boolean}
   */
  shouldReport() {
    if (!this.isStable()) return false;

    const stable = this.getStableCount();
    if (stable === this._lastReportedCount) return false;

    const now = Date.now();
    if (now - this._lastReportTime < this.reportCooldown) return false;

    // Commit the report
    this._lastReportedCount = stable;
    this._lastReportTime = now;
    return true;
  }

  /**
   * Reset buffer state (call at session start / after exam ends).
   */
  reset() {
    this._buffer = [];
    this._lastReportedCount = null;
    this._lastReportTime = 0;
  }

  // --- Accessors for UI / debugging ---

  getBufferContents() {
    return [...this._buffer];
  }

  getLastReportedCount() {
    return this._lastReportedCount;
  }

  getStabilityRatio() {
    if (this._buffer.length === 0) return 0;
    const counts = {};
    for (const c of this._buffer) counts[c] = (counts[c] || 0) + 1;
    return Math.max(...Object.values(counts)) / this._buffer.length;
  }
}

// Singleton instance
const detectionBuffer = new DetectionBuffer();
export default detectionBuffer;
export { DetectionBuffer };
