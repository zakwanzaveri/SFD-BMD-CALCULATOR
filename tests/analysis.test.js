import test from "node:test";
import assert from "node:assert/strict";
import { solveReactions, sampleDiagrams, findExtrema } from "../src/lib/analysis.js";

const simple = (length = 10) => ({
  beamType: "simple",
  length,
  fixedEnd: "left",
  supports: { a: 0, b: length },
});

const cantilever = (fixedEnd, length = 10) => ({
  beamType: "cantilever",
  length,
  fixedEnd,
  supports: { a: 0, b: length },
});

const overhang = (a, b, length = 10) => ({
  beamType: "overhang",
  length,
  fixedEnd: "left",
  supports: { a, b },
});

const point = (value, position, angle = 90) => ({ id: 1, type: "point", value, position, angle });

function analyse(beam, loads) {
  const reactions = solveReactions(beam, loads);
  const nodes = sampleDiagrams(beam, loads, reactions);
  return { reactions, nodes, extrema: findExtrema(nodes, beam.length) };
}

// The two one-sided limits sampled at the same abscissa: a genuine
// discontinuity shows up here, a continuous diagram does not.
function limitsAt(nodes, key) {
  const grouped = new Map();
  for (const n of nodes) {
    const k = n.x.toFixed(9);
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k).push(n[key]);
  }
  return [...grouped.values()];
}

function maxStepAtSameX(nodes, key) {
  let worst = 0;
  for (const values of limitsAt(nodes, key)) {
    if (values.length < 2) continue;
    worst = Math.max(worst, Math.abs(values[0] - values[1]));
  }
  return worst;
}

test("simply supported beam with a central point load", () => {
  const { reactions, nodes, extrema } = analyse(simple(), [point(10, 5)]);
  assert.equal(reactions.Ra, 5);
  assert.equal(reactions.Rb, 5);
  assert.equal(extrema.Mmax.value, 25);
  assert.equal(extrema.Mmax.x, 5);
  assert.equal(nodes[0].M, 0, "moment is zero at the left support");
  assert.equal(nodes[nodes.length - 1].M, 0, "moment is zero at the right support");
  assert.equal(maxStepAtSameX(nodes, "M"), 0, "moment is continuous across the supports");
  assert.equal(maxStepAtSameX(nodes, "V"), 10, "shear jumps by the load at midspan");
});

test("cantilever fixed at the left with a tip load", () => {
  const { reactions, nodes, extrema } = analyse(cantilever("left"), [point(10, 10)]);
  assert.equal(reactions.force, 10);
  assert.equal(extrema.Mmin.value, -100, "hogging moment of P*L at the clamp");
  assert.equal(extrema.Mmin.x, 0);
  assert.equal(nodes[nodes.length - 1].M, 0, "moment is zero at the free end");
  assert.equal(maxStepAtSameX(nodes, "M"), 0, "no spurious step at the clamped end");
});

test("cantilever fixed at the right with a tip load", () => {
  const { reactions, nodes, extrema } = analyse(cantilever("right"), [point(10, 0)]);
  assert.equal(reactions.force, 10);
  assert.equal(extrema.Mmin.value, -100, "hogging moment of P*L at the clamp");
  assert.equal(extrema.Mmin.x, 10);
  assert.equal(nodes[0].M, 0, "moment is zero at the free end");
  assert.equal(maxStepAtSameX(nodes, "M"), 0, "no spurious step at the clamped end");
});

test("cantilever fixed at the right with an interior load", () => {
  const { extrema } = analyse(cantilever("right"), [point(10, 4)]);
  assert.equal(extrema.Mmin.value, -60, "hogging moment of P*(L - x)");
  assert.equal(extrema.Mmin.x, 10);
});

test("overhanging beam", () => {
  const { reactions } = analyse(overhang(2, 7), [point(10, 10)]);
  assert.equal(reactions.Rb, 16);
  assert.equal(reactions.Ra, -6, "the far support lifts off");
});

test("uniformly distributed load over the full span", () => {
  const loads = [{ id: 1, type: "udl", value: 5, start: 0, end: 10 }];
  const { reactions, extrema } = analyse(simple(), loads);
  assert.equal(reactions.Ra, 25);
  assert.equal(reactions.Rb, 25);
  assert.equal(extrema.Mmax.value, 62.5);
  assert.equal(extrema.Mmax.x, 5);
});

test("triangular (UVL) load over the full span", () => {
  const loads = [{ id: 1, type: "uvl", startValue: 0, endValue: 10, start: 0, end: 10 }];
  const { reactions, extrema } = analyse(simple(), loads);
  assert.ok(Math.abs(reactions.Ra - 50 / 3) < 1e-9, "w*L/6");
  assert.ok(Math.abs(reactions.Rb - 100 / 3) < 1e-9, "w*L/3");
  // Exact peak of a triangular load: w0*L^2/(9*sqrt(3)) at x = L/sqrt(3).
  assert.ok(Math.abs(extrema.Mmax.value - (10 * 100) / (9 * Math.sqrt(3))) < 0.1);
  assert.ok(Math.abs(extrema.Mmax.x - 10 / Math.sqrt(3)) < 0.2);
});

test("applied counter-clockwise couple at midspan", () => {
  const loads = [{ id: 1, type: "moment", value: 20, position: 5 }];
  const { reactions, extrema } = analyse(simple(), loads);
  assert.equal(reactions.Ra, 2);
  assert.equal(reactions.Rb, -2);
  assert.equal(extrema.Mmax.value, 10);
  assert.equal(extrema.Mmin.value, -10);
});

test("inclined point load", () => {
  const { reactions } = analyse(simple(), [point(10, 5, 45)]);
  assert.ok(Math.abs(reactions.Ra + reactions.Rb - 10 * Math.sin(Math.PI / 4)) < 1e-12);
  assert.ok(Math.abs(reactions.Ha + 10 * Math.cos(Math.PI / 4)) < 1e-12);
});
