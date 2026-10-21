// Shared chart geometry so the beam, SFD and BMD share one horizontal scale.

export const CHART = {
  W: 760,
  PLOT_L: 64,
  PLOT_R: 736,
  PLOT_T: 24,
};

const PLOT_W = CHART.PLOT_R - CHART.PLOT_L;

export function xToPx(x, length) {
  if (!(length > 0)) return CHART.PLOT_L;
  return CHART.PLOT_L + (x / length) * PLOT_W;
}

// "Nice" axis tick values covering [min, max].
export function niceTicks(min, max, count = 5) {
  if (!isFinite(min) || !isFinite(max)) return [0];
  if (min === max) return [min || 0];
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  let step;
  if (norm < 1.5) step = 1;
  else if (norm < 3) step = 2;
  else if (norm < 7) step = 5;
  else step = 10;
  step *= mag;
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + step * 1e-9; v += step) {
    ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  }
  return ticks;
}
