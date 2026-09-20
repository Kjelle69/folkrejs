import test from 'node:test';
import assert from 'node:assert/strict';
import { MATCH_PHASE, MatchManager } from './match-manager.js';

function setup() {
  let time = 0;
  const manager = new MatchManager({ now: () => time });
  return { manager, advance: (milliseconds) => { time += milliseconds; manager.update(); } };
}

test('kör ett femvarvs soloheat och visar resultat i tio sekunder', () => {
  const { manager, advance } = setup();
  manager.join('p1', 'Kjelle');
  assert.equal(manager.beginCountdown(), true);
  advance(2999);
  assert.equal(manager.phase, MATCH_PHASE.COUNTDOWN);
  advance(1);
  assert.equal(manager.phase, MATCH_PHASE.RACING);

  advance(12345);
  for (let lap = 0; lap < 5; lap += 1) manager.recordLap('p1');
  assert.equal(manager.phase, MATCH_PHASE.RESULTS);
  assert.equal(manager.snapshot().results[0].finishTimeMs, 12345);

  advance(9999);
  assert.equal(manager.phase, MATCH_PHASE.RESULTS);
  advance(1);
  assert.equal(manager.phase, MATCH_PHASE.WARMUP);
});

test('sen anslutning väntar till nästa heat', () => {
  const { manager, advance } = setup();
  manager.join('p1', 'Ettan');
  manager.beginCountdown();
  manager.join('p2', 'Tvåan');
  assert.equal(manager.snapshot().participants.find(({ id }) => id === 'p2').status, 'waiting');
  advance(3000);
  for (let lap = 0; lap < 5; lap += 1) manager.recordLap('p1');
  advance(10000);
  assert.equal(manager.snapshot().participants.find(({ id }) => id === 'p2').status, 'active');
});

test('utslagen förare förblir utslagen under heat och resultat', () => {
  const { manager, advance } = setup();
  manager.join('p1', 'Ettan');
  manager.join('p2', 'Tvåan');
  manager.beginCountdown();
  advance(3000);
  manager.knockOut('p1');
  assert.equal(manager.snapshot().participants.find(({ id }) => id === 'p1').status, 'knockedOut');
  for (let lap = 0; lap < 5; lap += 1) manager.recordLap('p2');
  assert.equal(manager.phase, MATCH_PHASE.RESULTS);
  assert.equal(manager.snapshot().results[1].status, 'knockedOut');
});

test('accepterar högst fyra deltagare', () => {
  const { manager } = setup();
  for (let index = 1; index <= 4; index += 1) {
    assert.equal(manager.join(`p${index}`, `Förare ${index}`).accepted, true);
  }
  assert.deepEqual(manager.join('p5', 'Femman'), { accepted: false, reason: 'full' });
});
