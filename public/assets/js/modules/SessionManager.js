export class SessionManager {
    constructor(config, onSessionEnded, onTick, onTimeUp) {
        this.timerDuration = config.timer ?? 90;
        this.timeLeft = this.timerDuration;
        this.timer = null;
        this.active = true;
        this.lastChance = false;
        this.onSessionEnded = onSessionEnded;
        this.onTick = onTick;
        this.onTimeUp = onTimeUp;
    }
    start() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            if (this.onTick) this.onTick(this.timeLeft);
            if (this.timeLeft <= 0) {
                if (this.onTimeUp) this.onTimeUp();
                this.endSession();
            }
        }, 1000);
    }
    endSession() {
        clearInterval(this.timer);
        this.active = false;
        this.lastChance = true;
        if (this.onSessionEnded) {
            this.onSessionEnded();
        }
    }
    getTimeLeft() {
        return this.timeLeft;
    }
    formatTime() {
        const m = Math.floor(Math.max(0, this.timeLeft) / 60);
        const s = Math.max(0, this.timeLeft) % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    isActive() {
        return this.active;
    }
    isLastChance() {
        return this.lastChance;
    }
    reset(newDuration) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.timeLeft = newDuration ?? this.timerDuration;
        this.active = true;
        this.lastChance = false;
        this.start();
    }
    destroy() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
