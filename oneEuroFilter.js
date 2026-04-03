/**
 * One-Euro Filter (Casiez et al.) — adaptive low-pass for jitter reduction on tracked inputs.
 */
class LowPassFilter {
  constructor(alpha) {
    this.alpha = alpha;
    this.y = null;
    this.s = null;
  }
  setAlpha(alpha) {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }
  filter(value, alpha) {
    if (alpha !== null && alpha !== undefined) this.setAlpha(alpha);
    if (this.y === null) {
      this.y = value;
      this.s = value;
    } else {
      this.y = this.alpha * value + (1 - this.alpha) * this.s;
      this.s = this.y;
    }
    return this.y;
  }
  lastValue() {
    return this.s;
  }
}

class OneEuroFilter {
  constructor(freq, minCutoff, beta, dCutoff) {
    this.freq = freq;
    this.minCutoff = minCutoff != null ? minCutoff : 1.0;
    this.beta = beta != null ? beta : 0.01;
    this.dCutoff = dCutoff != null ? dCutoff : 1.0;
    this.x = new LowPassFilter(this._alpha(this.minCutoff));
    this.dx = new LowPassFilter(this._alpha(this.dCutoff));
    this.lastTime = null;
  }
  _alpha(cutoff) {
    const te = 1.0 / this.freq;
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }
  filter(value, timestamp) {
    if (timestamp !== null && timestamp !== undefined && this.lastTime !== null) {
      const dt = (timestamp - this.lastTime) / 1000.0;
      if (dt > 0) this.freq = 1.0 / dt;
    }
    this.lastTime = timestamp;

    const prevValue = this.x.lastValue() != null ? this.x.lastValue() : value;
    const dValue =
      timestamp !== null && timestamp !== undefined ? (value - prevValue) * this.freq : 0;

    const edValue = this.dx.filter(dValue, this._alpha(this.dCutoff));
    const cutoff = this.minCutoff + this.beta * Math.abs(edValue);
    return this.x.filter(value, this._alpha(cutoff));
  }
  reset() {
    this.x = new LowPassFilter(this._alpha(this.minCutoff));
    this.dx = new LowPassFilter(this._alpha(this.dCutoff));
    this.lastTime = null;
  }
}
