import { CHART, xToPx, niceTicks } from "@/lib/scale";
import { fmt } from "@/lib/units";

const BOTTOM = 30;

export function ValueDiagram({ nodes, length, valueKey, color, unit, lengthUnit }) {
  const height = 210;
  const plotBottom = height - BOTTOM;

  if (!nodes || nodes.length === 0 || !(length > 0)) {
    return (
      <svg viewBox={`0 0 ${CHART.W} ${height}`} className="w-full" style={{ height: "auto" }}>
        <text x={CHART.W / 2} y={height / 2} textAnchor="middle" fontSize="13" style={{ fill: "var(--muted)" }}>
          No data — add a load to see the diagram
        </text>
      </svg>
    );
  }

  const values = nodes.map((n) => n[valueKey]);
  let lo = Math.min(0, ...values);
  let hi = Math.max(0, ...values);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const span = hi - lo;
  lo -= span * 0.1;
  hi += span * 0.1;

  const yToPx = (v) => CHART.PLOT_T + ((hi - v) / (hi - lo)) * (plotBottom - CHART.PLOT_T);
  const yZero = yToPx(0);

  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  let line = `M ${xToPx(first.x, length).toFixed(1)} ${yToPx(first[valueKey]).toFixed(1)}`;
  for (let i = 1; i < nodes.length; i++) {
    line += ` L ${xToPx(nodes[i].x, length).toFixed(1)} ${yToPx(nodes[i][valueKey]).toFixed(1)}`;
  }
  const area = `${line} L ${xToPx(last.x, length).toFixed(1)} ${yZero.toFixed(1)} L ${xToPx(
    first.x,
    length
  ).toFixed(1)} ${yZero.toFixed(1)} Z`;

  const ticks = niceTicks(lo, hi);

  let maxNode = nodes[0];
  let minNode = nodes[0];
  for (const n of nodes) {
    if (n[valueKey] > maxNode[valueKey]) maxNode = n;
    if (n[valueKey] < minNode[valueKey]) minNode = n;
  }

  const markers = [];
  if (Math.abs(maxNode[valueKey]) > 1e-6) markers.push({ node: maxNode, value: maxNode[valueKey] });
  if (Math.abs(minNode[valueKey]) > 1e-6 && Math.abs(minNode[valueKey] - maxNode[valueKey]) > 1e-6) {
    markers.push({ node: minNode, value: minNode[valueKey] });
  }

  return (
    <svg viewBox={`0 0 ${CHART.W} ${height}`} className="w-full" style={{ height: "auto" }} role="img">
      {/* grid + value-axis ticks */}
      {ticks.map((t, i) => {
        const y = yToPx(t);
        return (
          <g key={i}>
            <line
              x1={CHART.PLOT_L}
              x2={CHART.PLOT_R}
              y1={y}
              y2={y}
              strokeWidth="1"
              strokeDasharray={t === 0 ? "0" : "2 4"}
              style={{ stroke: "var(--border)" }}
            />
            <text x={CHART.PLOT_L - 8} y={y + 4} textAnchor="end" fontSize="10" className="font-mono" style={{ fill: "var(--muted)" }}>
              {fmt(t, 3)}
            </text>
          </g>
        );
      })}

      {/* area + curve */}
      <path d={area} fillOpacity="0.16" style={{ fill: color }} />
      <path d={line} fill="none" strokeWidth="2" strokeLinejoin="round" style={{ stroke: color }} />

      {/* zero line */}
      <line x1={CHART.PLOT_L} x2={CHART.PLOT_R} y1={yZero} y2={yZero} strokeWidth="1.5" style={{ stroke: "var(--beam)" }} />

      {/* extent labels */}
      {markers.map((m, i) => {
        const px = xToPx(m.node.x, length);
        const py = yToPx(m.value);
        const size = 10.5;
        const text = `${fmt(m.value, 4)} ${unit}`;
        const w = text.length * size * 0.62;

        // edge-aware anchoring: keep the label inside the plot so it never
        // spills into the y-axis tick column (left) or off the right edge
        let anchor = "middle";
        let tx = px;
        if (px - w / 2 < CHART.PLOT_L) {
          anchor = "start";
          tx = CHART.PLOT_L + 3;
        } else if (px + w / 2 > CHART.PLOT_R) {
          anchor = "end";
          tx = CHART.PLOT_R - 3;
        }

        // vertical clearance: keep label off the top axis and the x-axis labels
        let ty = m.value >= 0 ? py - 7 : py + 14;
        if (ty < CHART.PLOT_T + 8) ty = py + 14;
        if (ty > plotBottom - 2) ty = py - 7;

        const chipX = anchor === "start" ? tx - 4 : anchor === "end" ? tx - w - 4 : tx - w / 2 - 4;
        return (
          <g key={i}>
            <circle cx={px} cy={py} r="3" style={{ fill: color }} />
            <rect x={chipX} y={ty - size - 2} width={w + 8} height={size + 7} rx="3" style={{ fill: "var(--background)" }} />
            <text x={tx} y={ty} textAnchor={anchor} fontSize={size} className="font-mono" style={{ fill: "var(--foreground)" }}>
              {text}
            </text>
          </g>
        );
      })}

      {/* x-axis */}
      <line x1={CHART.PLOT_L} x2={CHART.PLOT_R} y1={plotBottom} y2={plotBottom} strokeWidth="1" style={{ stroke: "var(--border)" }} />
      {[0, length].map((xv, i) => (
        <text
          key={i}
          x={xToPx(xv, length)}
          y={plotBottom + 15}
          textAnchor={i === 0 ? "start" : "end"}
          fontSize="10"
          className="font-mono"
          style={{ fill: "var(--muted)" }}
        >
          {fmt(xv, 3)} {lengthUnit}
        </text>
      ))}

      <text x={CHART.PLOT_L - 8} y={CHART.PLOT_T - 8} textAnchor="end" fontSize="10" style={{ fill: "var(--muted)" }}>
        {unit}
      </text>
    </svg>
  );
}
