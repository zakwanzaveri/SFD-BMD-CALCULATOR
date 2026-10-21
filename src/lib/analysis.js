// Beam analysis engine (SI units internally).
//
// Sign conventions:
//   - x increases to the right, y upwards.
//   - Downward loads are positive magnitudes.
//   - Bending moment is sagging-positive (tension on the underside).
//   - Applied concentrated moments are counter-clockwise (CCW) positive.

function resolveSupports(beam) {
  const { beamType, length, fixedEnd, supports } = beam;
  if (beamType === "cantilever") {
    const right = fixedEnd === "right";
    return { kind: "fixed", fixed: right ? length : 0, side: right ? "right" : "left" };
  }
  if (beamType === "overhang") {
    return { kind: "two", a: supports.a, b: supports.b };
  }
  return { kind: "two", a: 0, b: length };
}

const RAD = Math.PI / 180;

// Point-load inclination, degrees from the +x axis (0=right, 90=down, 180=left).
// A missing angle means straight down, preserving vertical-only behaviour.
function pointAngle(load) {
  return (load.angle == null ? 90 : load.angle) * RAD;
}

// Total downward (vertical) force of a load.
function loadForce(load) {
  switch (load.type) {
    case "point":
      return load.value * Math.sin(pointAngle(load));
    case "udl":
      return load.value * (load.end - load.start);
    case "uvl":
      return 0.5 * (load.startValue + load.endValue) * (load.end - load.start);
    default:
      return 0; // concentrated moment
  }
}

// Total horizontal force of a load, positive to the right.
function loadHorizontal(load) {
  if (load.type === "point") return load.value * Math.cos(pointAngle(load));
  return 0;
}

// Moment of a load about a pivot, CCW positive.
function loadMomentAbout(load, pivot) {
  switch (load.type) {
    case "point":
      return -loadForce(load) * (load.position - pivot);
    case "udl": {
      const s = load.start;
      const e = load.end;
      const integral = 0.5 * ((e - pivot) ** 2 - (s - pivot) ** 2);
      return -load.value * integral;
    }
    case "uvl": {
      const { start: s, end: e, startValue: w1, endValue: w2 } = load;
      const span = e - s;
      const A = w1;
      const B = (w2 - w1) / span;
      const d = s - pivot;
      const integral = A * (d * span + (span * span) / 2) + B * ((d * span * span) / 2 + span ** 3 / 3);
      return -integral;
    }
    case "moment":
      return load.value;
    default:
      return 0;
  }
}

export function solveReactions(beam, loads) {
  const support = resolveSupports(beam);
  const totalDown = loads.reduce((sum, l) => sum + loadForce(l), 0);
  const totalRight = loads.reduce((sum, l) => sum + loadHorizontal(l), 0);

  if (support.kind === "fixed") {
    const f = support.fixed;
    const sumM = loads.reduce((sum, l) => sum + loadMomentAbout(l, f), 0);
    return {
      kind: "fixed",
      fixed: f,
      side: support.side,
      force: totalDown,
      moment: -sumM,
      H: -totalRight,
    };
  }

  const { a, b } = support;
  const span = b - a;
  if (Math.abs(span) < 1e-9) return null;
  const sumMA = loads.reduce((sum, l) => sum + loadMomentAbout(l, a), 0);
  const Rb = -sumMA / span;
  const Ra = totalDown - Rb;
  return { kind: "two", a, b, Ra, Rb, Ha: -totalRight };
}

// `right` selects the right-hand limit at a discontinuity (value just past x).
function inSegment(pos, x, right) {
  return right ? pos <= x + 1e-12 : pos < x - 1e-12;
}

function shearAt(loads, reactions, x, right = true) {
  let V = 0;
  if (reactions.kind === "fixed") {
    if (inSegment(reactions.fixed, x, right)) V += reactions.force;
  } else {
    if (inSegment(reactions.a, x, right)) V += reactions.Ra;
    if (inSegment(reactions.b, x, right)) V += reactions.Rb;
  }

  for (const l of loads) {
    if (l.type === "point") {
      if (inSegment(l.position, x, right)) V -= loadForce(l);
    } else if (l.type === "udl") {
      const m = Math.min(x, l.end);
      if (m > l.start) V -= l.value * (m - l.start);
    } else if (l.type === "uvl") {
      const m = Math.min(x, l.end);
      if (m > l.start) {
        const span = l.end - l.start;
        const B = (l.endValue - l.startValue) / span;
        const u = m - l.start;
        V -= l.startValue * u + 0.5 * B * u * u;
      }
    }
  }
  return V;
}

function momentAt(loads, reactions, x, right = true) {
  let M = 0;

  if (reactions.kind === "fixed") {
    if (reactions.side === "left") {
      // The clamp sits at the left end, so it always belongs to the left-hand
      // free body: M = R(x - s) - M_fixed.  Including it at the clamp itself
      // keeps the interior value, so the diagram has no step at the clamped
      // end (the value beyond the clamp does not exist).
      M += reactions.force * (x - reactions.fixed);
      M += -reactions.moment;
    }
    // A clamp at the right end never lies in the left-hand free body, so it
    // contributes nothing here: the loads already give the interior value.
  } else {
    if (inSegment(reactions.a, x, right)) M += reactions.Ra * (x - reactions.a);
    if (inSegment(reactions.b, x, right)) M += reactions.Rb * (x - reactions.b);
  }

  for (const l of loads) {
    if (l.type === "point") {
      if (inSegment(l.position, x, right)) M -= loadForce(l) * (x - l.position);
    } else if (l.type === "moment") {
      if (inSegment(l.position, x, right)) M -= l.value;
    } else if (l.type === "udl" || l.type === "uvl") {
      const { start: s, end: e } = l;
      const m = Math.min(x, e);
      if (m > s) {
        let A;
        let B;
        if (l.type === "udl") {
          A = l.value;
          B = 0;
        } else {
          A = l.startValue;
          B = (l.endValue - l.startValue) / (e - s);
        }
        const X = x - s;
        const u = m - s;
        const integral = A * (X * u - (u * u) / 2) + B * ((X * u * u) / 2 - u ** 3 / 3);
        M -= integral;
      }
    }
  }
  return M;
}

export function sampleDiagrams(beam, loads, reactions, opts = {}) {
  const L = beam.length;
  const perSeg = opts.perSeg ?? 24;
  if (reactions == null || L <= 0) return [];

  const events = new Set([0, L]);
  const support = resolveSupports(beam);
  if (support.kind === "fixed") {
    events.add(support.fixed);
  } else {
    events.add(support.a);
    events.add(support.b);
  }
  for (const l of loads) {
    if (l.type === "point" || l.type === "moment") events.add(l.position);
    else {
      events.add(l.start);
      events.add(l.end);
    }
  }

  const sorted = [...events]
    .map((v) => Math.min(Math.max(v, 0), L))
    .filter((v) => v >= -1e-9 && v <= L + 1e-9)
    .sort((p, q) => p - q);

  const unique = [];
  for (const e of sorted) {
    if (unique.length === 0 || Math.abs(e - unique[unique.length - 1]) > 1e-9) unique.push(e);
  }

  const nodes = [];
  const push = (x, right) => {
    nodes.push({ x, V: shearAt(loads, reactions, x, right), M: momentAt(loads, reactions, x, right) });
  };

  for (let i = 0; i < unique.length; i++) {
    const e = unique[i];
    push(e, false);
    push(e, true);
    if (i < unique.length - 1) {
      const next = unique[i + 1];
      for (let k = 1; k < perSeg; k++) {
        push(e + ((next - e) * k) / perSeg, false);
      }
    }
  }

  const cleaned = [];
  for (const n of nodes) {
    const last = cleaned[cleaned.length - 1];
    if (last && Math.abs(last.x - n.x) < 1e-12 && Math.abs(last.V - n.V) < 1e-9 && Math.abs(last.M - n.M) < 1e-9) {
      continue;
    }
    cleaned.push(n);
  }
  return cleaned;
}

function scanExtreme(nodes, key, wantMax) {
  let best = { value: wantMax ? -Infinity : Infinity, x: 0 };
  for (const n of nodes) {
    const v = n[key];
    if (wantMax ? v > best.value : v < best.value) best = { value: v, x: n.x };
  }
  return isFinite(best.value) ? best : { value: 0, x: 0 };
}

export function findExtrema(nodes, L) {
  if (!nodes.length) {
    return { Vmax: { value: 0, x: 0 }, Vmin: { value: 0, x: 0 }, Mmax: { value: 0, x: 0 }, Mmin: { value: 0, x: 0 } };
  }
  const Vmax = scanExtreme(nodes, "V", true);
  const Vmin = scanExtreme(nodes, "V", false);
  const Mmax = scanExtreme(nodes, "M", true);
  const Mmin = scanExtreme(nodes, "M", false);
  const absV = Math.max(Math.abs(Vmax.value), Math.abs(Vmin.value));
  const absM = Math.max(Math.abs(Mmax.value), Math.abs(Mmin.value));
  return { Vmax, Vmin, Mmax, Mmin, absV, absM, L };
}
