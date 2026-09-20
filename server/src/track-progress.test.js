import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACK_CONFIG } from '@folkrejs/shared/vehicle';
import { createTrackProgress, resetCurrentLap, updateTrackProgress } from './track-progress.js';

function leave(progress) {
  updateTrackProgress(progress, { x: 0, z: 0 });
}

function enter(progress, id) {
  leave(progress);
  const checkpoint = TRACK_CONFIG.checkpoints.find((item) => item.id === id);
  return updateTrackProgress(progress, checkpoint);
}

test('räknar bara varv efter alla kontroller i rätt ordning', () => {
  const progress = createTrackProgress();
  assert.deepEqual(enter(progress, 'finish'), []);
  assert.deepEqual(enter(progress, 'west'), []);
  assert.equal(progress.completedLaps, 0);

  enter(progress, 'east');
  enter(progress, 'north');
  enter(progress, 'west');
  assert.deepEqual(enter(progress, 'finish'), [{ type: 'lap-completed', lap: 1 }]);
  assert.equal(progress.completedLaps, 1);
});

test('fem korrekta varv ger målgång', () => {
  const progress = createTrackProgress();
  let events = [];
  for (let lap = 0; lap < TRACK_CONFIG.laps; lap += 1) {
    for (const id of ['east', 'north', 'west', 'finish']) events = enter(progress, id);
  }
  assert.equal(progress.finished, true);
  assert.deepEqual(events, [
    { type: 'lap-completed', lap: 5 },
    { type: 'race-finished' }
  ]);
});

test('återställning ogiltigförklarar ett påbörjat varv', () => {
  const progress = createTrackProgress(2);
  enter(progress, 'east');
  enter(progress, 'north');
  resetCurrentLap(progress);
  enter(progress, 'west');
  enter(progress, 'finish');
  assert.equal(progress.completedLaps, 2);
});
