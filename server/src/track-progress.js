import { TRACK_CONFIG } from '@folkrejs/shared/vehicle';

export function createTrackProgress(completedLaps = 0) {
  return {
    completedLaps,
    nextCheckpointIndex: 0,
    insideCheckpointId: 'finish',
    finished: completedLaps >= TRACK_CONFIG.laps
  };
}

export function resetCurrentLap(progress) {
  progress.nextCheckpointIndex = 0;
  progress.insideCheckpointId = 'finish';
}

export function updateTrackProgress(progress, position) {
  const entered = TRACK_CONFIG.checkpoints.find((checkpoint) => (
    Math.hypot(position.x - checkpoint.x, position.z - checkpoint.z)
      <= TRACK_CONFIG.checkpointRadius
  ));

  if (!entered) {
    progress.insideCheckpointId = null;
    return [];
  }
  if (entered.id === progress.insideCheckpointId || progress.finished) return [];
  progress.insideCheckpointId = entered.id;

  const expected = TRACK_CONFIG.checkpoints[progress.nextCheckpointIndex];
  if (entered.id !== expected.id) return [];

  if (!expected.finish) {
    progress.nextCheckpointIndex += 1;
    return [{ type: 'checkpoint-passed', checkpointId: expected.id }];
  }

  progress.completedLaps += 1;
  progress.nextCheckpointIndex = 0;
  progress.finished = progress.completedLaps >= TRACK_CONFIG.laps;
  const events = [{ type: 'lap-completed', lap: progress.completedLaps }];
  if (progress.finished) events.push({ type: 'race-finished' });
  return events;
}

export function trackProgressSnapshot(progress) {
  return {
    completedLaps: progress.completedLaps,
    currentLap: Math.min(progress.completedLaps + 1, TRACK_CONFIG.laps),
    totalLaps: TRACK_CONFIG.laps,
    nextCheckpoint: progress.finished
      ? null
      : TRACK_CONFIG.checkpoints[progress.nextCheckpointIndex].id,
    finished: progress.finished
  };
}
