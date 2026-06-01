export class HandDetection {
  constructor(options = {}) {
    this.enabled = false;
    this.running = false;
    this.hands = null;
    this.camera = null;
    this.videoEl = null;
    this.onDetect = options.onDetect || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onHandStateChange = options.onHandStateChange || (() => {});

    this.PALM_HOLD_TIME = options.palmHoldTime || 1200;
    this.COOLDOWN_TIME = options.cooldownTime || 3000;
    this.DETECTION_CONFIDENCE = options.detectionConfidence || 0.7;
    this.TRACKING_CONFIDENCE = options.trackingConfidence || 0.5;

    this._palmStartTime = 0;
    this._palmActive = false;
    this._cooldownUntil = 0;
    this._lastHandState = false;
    this._processFrameBound = null;
    this._destroyed = false;
    this._modelLoaded = false;
  }

  async init(videoElement) {
    if (this._destroyed) return;
    this.videoEl = videoElement;

    if (typeof Hands === 'undefined') {
      console.error('[HandDetection] MediaPipe Hands not loaded');
      return false;
    }

    this.hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: this.DETECTION_CONFIDENCE,
      minTrackingConfidence: this.TRACKING_CONFIDENCE,
    });

    this._processFrameBound = this._processFrame.bind(this);
    this.hands.onResults(this._processFrameBound);

    this._modelLoaded = false;
    this._emitStatus('loading');
    return true;
  }

  start() {
    if (!this.hands || !this.videoEl || this.running || this._destroyed) return false;
    this.enabled = true;
    this.running = true;
    this._startFrameLoop();
    this._emitStatus('running');
    return true;
  }

  stop() {
    this.running = false;
    this._palmActive = false;
    this._palmStartTime = 0;
    this._emitHandState(false);
    this._emitStatus('stopped');
  }

  pause() {
    this.running = false;
    this._palmActive = false;
    this._palmStartTime = 0;
    this._frameTimer && cancelAnimationFrame(this._frameTimer);
    this._frameTimer = null;
    this._emitHandState(false);
  }

  toggle() {
    if (this.enabled) {
      this.enabled = false;
      this.stop();
    } else {
      this.start();
    }
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }

  destroy() {
    this._destroyed = true;
    this.enabled = false;
    this.stop();
    if (this._frameTimer) {
      cancelAnimationFrame(this._frameTimer);
      this._frameTimer = null;
    }
    this.hands = null;
    this.videoEl = null;
    this._processFrameBound = null;
  }

  _startFrameLoop() {
    if (!this.running || this._destroyed) return;

    const sendFrame = async () => {
      if (!this.running || !this.videoEl || this._destroyed) return;
      if (this.videoEl.readyState >= 2 && this.hands) {
        try {
          await this.hands.send({ image: this.videoEl });
          if (!this._modelLoaded && !this._destroyed) {
            this._modelLoaded = true;
            this._emitStatus('ready');
          }
        } catch (e) {
          if (!this._destroyed) {
            console.warn('[HandDetection] Frame send error:', e.message);
          }
        }
      }
      if (this.running && !this._destroyed) {
        this._frameTimer = requestAnimationFrame(sendFrame);
      }
    };

    this._frameTimer = requestAnimationFrame(sendFrame);
  }

  _processFrame(results) {
    if (!this.running || this._destroyed) return;

    const hasHand = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;

    if (hasHand !== this._lastHandState) {
      this._lastHandState = hasHand;
      this._emitHandState(hasHand);
    }

    if (!hasHand) {
      this._palmActive = false;
      this._palmStartTime = 0;
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    const isOpenPalm = this._isOpenPalm(landmarks);

    if (!isOpenPalm) {
      this._palmActive = false;
      this._palmStartTime = 0;
      return;
    }

    if (!this._palmActive) {
      this._palmActive = true;
      this._palmStartTime = Date.now();
      return;
    }

    const heldDuration = Date.now() - this._palmStartTime;
    if (heldDuration >= this.PALM_HOLD_TIME) {
      const now = Date.now();
      if (now >= this._cooldownUntil) {
        this._cooldownUntil = now + this.COOLDOWN_TIME;
        this._palmActive = false;
        this._palmStartTime = 0;
        this.onDetect();
      }
    }
  }

  _isOpenPalm(landmarks) {
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];

    let extended = 0;
    for (let i = 0; i < tips.length; i++) {
      if (landmarks[tips[i]].y < landmarks[pips[i]].y) {
        extended++;
      }
    }

    const thumbExtended = landmarks[4].x < landmarks[3].x || landmarks[4].x > landmarks[3].x;
    const thumbOpen = Math.abs(landmarks[4].x - landmarks[2].x) > 0.04;

    return extended >= 3 && thumbOpen;
  }

  _emitStatus(status) {
    this.onStatusChange(status);
  }

  _emitHandState(detected) {
    this.onHandStateChange(detected);
  }
}