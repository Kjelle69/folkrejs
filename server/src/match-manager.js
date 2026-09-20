export const MATCH_PHASE = Object.freeze({
  WARMUP: 'warmup',
  COUNTDOWN: 'countdown',
  RACING: 'racing',
  RESULTS: 'results'
});

export class MatchManager {
  constructor({
    now = () => Date.now(),
    laps = 5,
    countdownMs = 3000,
    resultsMs = 10000,
    maxPlayers = 4
  } = {}) {
    this.now = now;
    this.laps = laps;
    this.countdownMs = countdownMs;
    this.resultsMs = resultsMs;
    this.maxPlayers = maxPlayers;
    this.phase = MATCH_PHASE.WARMUP;
    this.phaseStartedAt = this.now();
    this.raceStartedAt = null;
    this.heatNumber = 0;
    this.participants = new Map();
    this.results = [];
  }

  join(id, name) {
    if (this.participants.has(id)) return { accepted: true, participant: this.participants.get(id) };
    if (this.participants.size >= this.maxPlayers) return { accepted: false, reason: 'full' };

    const participant = {
      id,
      name,
      status: this.phase === MATCH_PHASE.WARMUP ? 'active' : 'waiting',
      completedLaps: 0,
      finishTimeMs: null
    };
    this.participants.set(id, participant);
    return { accepted: true, participant };
  }

  leave(id) {
    this.participants.delete(id);
    this.finishHeatIfResolved();
  }

  beginCountdown() {
    if (this.phase !== MATCH_PHASE.WARMUP || this.activeParticipants().length === 0) return false;
    this.phase = MATCH_PHASE.COUNTDOWN;
    this.phaseStartedAt = this.now();
    return true;
  }

  update() {
    const elapsed = this.now() - this.phaseStartedAt;
    if (this.phase === MATCH_PHASE.COUNTDOWN && elapsed >= this.countdownMs) this.startRace();
    if (this.phase === MATCH_PHASE.RESULTS && elapsed >= this.resultsMs) this.prepareWarmup();
  }

  recordLap(id) {
    if (this.phase !== MATCH_PHASE.RACING) return false;
    const participant = this.participants.get(id);
    if (!participant || participant.status !== 'active') return false;

    participant.completedLaps = Math.min(participant.completedLaps + 1, this.laps);
    if (participant.completedLaps >= this.laps) {
      participant.status = 'finished';
      participant.finishTimeMs = this.now() - this.raceStartedAt;
      this.finishHeatIfResolved();
    }
    return true;
  }

  knockOut(id) {
    if (this.phase !== MATCH_PHASE.RACING) return false;
    const participant = this.participants.get(id);
    if (!participant || participant.status !== 'active') return false;
    participant.status = 'knockedOut';
    this.finishHeatIfResolved();
    return true;
  }

  snapshot() {
    const duration = this.phase === MATCH_PHASE.COUNTDOWN ? this.countdownMs
      : this.phase === MATCH_PHASE.RESULTS ? this.resultsMs : 0;
    const remainingMs = duration > 0
      ? Math.max(0, duration - (this.now() - this.phaseStartedAt))
      : 0;
    return {
      phase: this.phase,
      heatNumber: this.heatNumber,
      laps: this.laps,
      remainingMs,
      participants: [...this.participants.values()].map((participant) => ({ ...participant })),
      results: this.results.map((result) => ({ ...result }))
    };
  }

  activeParticipants() {
    return [...this.participants.values()].filter(({ status }) => status === 'active');
  }

  startRace() {
    this.phase = MATCH_PHASE.RACING;
    this.phaseStartedAt = this.now();
    this.raceStartedAt = this.phaseStartedAt;
    this.heatNumber += 1;
    this.results = [];
  }

  finishHeatIfResolved() {
    if (this.phase !== MATCH_PHASE.RACING || this.activeParticipants().length > 0) return;
    const resolved = [...this.participants.values()]
      .filter(({ status }) => status === 'finished' || status === 'knockedOut');
    if (resolved.length === 0) return;

    this.results = resolved
      .map((participant) => ({ ...participant }))
      .sort((a, b) => {
        if (a.status === 'finished' && b.status !== 'finished') return -1;
        if (b.status === 'finished' && a.status !== 'finished') return 1;
        if (a.status === 'finished') return a.finishTimeMs - b.finishTimeMs;
        return b.completedLaps - a.completedLaps;
      });
    this.phase = MATCH_PHASE.RESULTS;
    this.phaseStartedAt = this.now();
  }

  prepareWarmup() {
    this.phase = MATCH_PHASE.WARMUP;
    this.phaseStartedAt = this.now();
    this.raceStartedAt = null;
    this.results = [];
    for (const participant of this.participants.values()) {
      participant.status = 'active';
      participant.completedLaps = 0;
      participant.finishTimeMs = null;
    }
  }
}
