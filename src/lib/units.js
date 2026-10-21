const UNIT_SYSTEMS = {
  metric: {
    id: "metric",
    label: "Metric",
    length: "m",
    force: "kN",
    distLoad: "kN/m",
    moment: "kN·m",
  },
  imperial: {
    id: "imperial",
    label: "Imperial",
    length: "ft",
    force: "kip",
    distLoad: "kip/ft",
    moment: "kip·ft",
  },
};

// Imperial -> SI conversion factors (single source of truth). Metric is SI.
const IMPERIAL_TO_SI = {
  length: 0.3048,
  force: 4.4482216153,
  distLoad: 14.5939029372,
  moment: 1.3558179483,
};

const FACTORS = {
  metric: { length: 1, force: 1, distLoad: 1, moment: 1 },
  imperial: IMPERIAL_TO_SI,
};

function factorFor(system, qty) {
  return (FACTORS[system] || FACTORS.metric)[qty];
}

export function toSI(value, qty, system) {
  return value * factorFor(system, qty);
}

export function fromSI(value, qty, system) {
  return value / factorFor(system, qty);
}

// Convert a displayed value when switching systems.
export function convert(value, qty, fromSystem, toSystem) {
  return (value * factorFor(fromSystem, qty)) / factorFor(toSystem, qty);
}

export function unitsFor(system) {
  return UNIT_SYSTEMS[system] || UNIT_SYSTEMS.metric;
}

// Compact, engineering-friendly formatting (significant figures).
export function fmt(value, sig = 4) {
  if (value == null || !isFinite(value)) return "—";
  if (Math.abs(value) < 1e-9) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-3) return value.toExponential(2);
  const digits = Math.max(0, sig - Math.floor(Math.log10(abs)) - 1);
  return Number(value.toFixed(Math.min(digits, 6))).toString();
}
