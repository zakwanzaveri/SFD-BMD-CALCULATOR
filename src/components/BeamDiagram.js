import { CHART, xToPx } from "@/lib/scale";
import { fmt } from "@/lib/units";

const LOAD_COLORS = {
  point: "var(--primary)",
  dist: "var(--shear)",
  moment: "var(--load-moment)",
};

function LoadArrow({ x, y1, y2, color, head = 6 }) {
  const hw = head * 0.65;
  return (
    <g>
      <line x1={x} x2={x} y1={y1} y2={y2 - head} strokeWidth="1.6" style={{ stroke: color }} />
      <polygon points={`${x - hw},${y2 - head} ${x + hw},${y2 - head} ${x},${y2}`} style={{ fill: color }} />
    </g>
  );
}

// Arrow pointing at (x, y) from direction `angle` (degrees from +x, 90 = down).
function InclinedArrow({ x, y, angle, len = 64, color, head = 11 }) {
  const rad = (angle * Math.PI) / 180;
  const ux = Math.cos(rad);
  const uy = Math.sin(rad);
  const tx = x - ux * len;
  const ty = y - uy * len;
  const sx = x - ux * head;
  const sy = y - uy * head;
  const hw = head * 0.65;
  const nx = -uy;
  const ny = ux;
  return (
    <g>
      <line x1={tx} y1={ty} x2={sx} y2={sy} strokeWidth="1.6" style={{ stroke: color }} />
      <polygon
        points={`${sx + nx * hw},${sy + ny * hw} ${sx - nx * hw},${sy - ny * hw} ${x},${y}`}
        style={{ fill: color }}
      />
    </g>
  );
}

function PinSupport({ x, y, color }) {
  return <polygon points={`${x},${y} ${x - 10},${y + 18} ${x + 10},${y + 18}`} style={{ fill: color }} />;
}

function RollerSupport({ x, y, color }) {
  return (
    <g>
      <polygon points={`${x},${y} ${x - 10},${y + 15} ${x + 10},${y + 15}`} style={{ fill: color }} />
      <circle cx={x - 5} cy={y + 19} r="3.2" fill="none" strokeWidth="1.6" style={{ stroke: color }} />
      <circle cx={x + 5} cy={y + 19} r="3.2" fill="none" strokeWidth="1.6" style={{ stroke: color }} />
    </g>
  );
}

function FixedSupport({ x, y, side, color }) {
  const dir = side === "left" ? -1 : 1;
  const hatch = [];
  for (let i = 0; i <= 6; i++) {
    const yy = y - 18 + i * 6;
    hatch.push(<line key={i} x1={x} y1={yy} x2={x + dir * 10} y2={yy + 6} strokeWidth="1.3" style={{ stroke: color }} />);
  }
  return (
    <g>
      <line x1={x} y1={y - 20} x2={x} y2={y + 20} strokeWidth="3.5" style={{ stroke: color }} />
      {hatch}
    </g>
  );
}

function overlapX(a, b) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 4;
}
function overlapY(a, b) {
  return Math.abs(a.y - b.y) < (a.size + b.size) / 2 + 3;
}

function layoutLabels(labels) {
  const placed = [];
  const order = [...labels].sort((a, b) => a.x - b.x);
  for (const lab of order) {
    lab.w = lab.text.length * lab.size * 0.62;
    let changed = true;
    let guard = 0;
    while (changed && guard++ < 100) {
      changed = false;
      for (const p of placed) {
        if (overlapX(lab, p) && overlapY(lab, p)) {
          lab.y = p.y - (lab.size + 6);
          changed = true;
        }
      }
    }
    placed.push(lab);
  }
  return labels;
}

function layoutLabelsDown(labels) {
  const placed = [];
  const order = [...labels].sort((a, b) => a.x - b.x);
  for (const lab of order) {
    lab.w = lab.text.length * lab.size * 0.62;
    let changed = true;
    let guard = 0;
    while (changed && guard++ < 100) {
      changed = false;
      for (const p of placed) {
        if (overlapX(lab, p) && overlapY(lab, p)) {
          lab.y = p.y + (lab.size + 6);
          changed = true;
        }
      }
    }
    placed.push(lab);
  }
  return labels;
}

function LabelChip({ lab }) {
  return (
    <g>
      <rect
        x={lab.x - lab.w / 2 - 4}
        y={lab.y - lab.size - 2}
        width={lab.w + 8}
        height={lab.size + 7}
        rx="3"
        style={{ fill: "var(--background)" }}
      />
      <text x={lab.x} y={lab.y} textAnchor="middle" fontSize={lab.size} className="font-mono" style={{ fill: lab.color }}>
        {lab.text}
      </text>
    </g>
  );
}

function LegendItem({ color, label, symbol }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: color }} />
      <span>
        {label} <span className="font-mono text-foreground">{symbol}</span>
      </span>
    </span>
  );
}

export default function BeamDiagram({ beam, loads, u }) {
  const L = beam.length;
  const height = 222;
  const beamY = 108;
  const chainY = 166;
  const totalY = height - 16;
  const color = "var(--beam)";

  const toPx = (x) => xToPx(x, L);

  const support =
    beam.beamType === "cantilever"
      ? { kind: "fixed", fixed: beam.fixedEnd === "right" ? L : 0 }
      : beam.beamType === "overhang"
        ? { kind: "two", a: beam.supports.a, b: beam.supports.b }
        : { kind: "two", a: 0, b: L };

  const supports = [];
  if (support.kind === "fixed") {
    supports.push(<FixedSupport key="f" x={toPx(support.fixed)} y={beamY} side={beam.fixedEnd === "right" ? "right" : "left"} color={color} />);
  } else {
    supports.push(<PinSupport key="a" x={toPx(support.a)} y={beamY} color={color} />);
    supports.push(<RollerSupport key="b" x={toPx(support.b)} y={beamY} color={color} />);
  }

  const rendered = [];
  const labels = [];
  const momentLabels = [];
  const breakpoints = [0, L];

  loads.forEach((l, idx) => {
    const px = (x) => toPx(x);
    if (l.type === "point") {
      const angle = l.angle == null ? 90 : l.angle;
      const len = 64;
      const rad = (angle * Math.PI) / 180;
      const tailX = px(l.position) - Math.cos(rad) * len;
      const tailY = beamY - Math.sin(rad) * len;
      rendered.push(<InclinedArrow key={idx} x={px(l.position)} y={beamY} angle={angle} color={LOAD_COLORS.point} head={11} />);
      labels.push({
        x: tailX,
        y: tailY - 8,
        size: 11,
        color: LOAD_COLORS.point,
        text: Math.abs(angle - 90) < 1e-9 ? `P = ${fmt(l.value, 4)} ${u.force}` : `P = ${fmt(l.value, 4)} ${u.force} @ ${fmt(angle, 3)}°`,
      });
      breakpoints.push(l.position);
    } else if (l.type === "udl") {
      const h = 34;
      const x1 = px(l.start);
      const x2 = px(l.end);
      const yTop = beamY - h;
      const arrows = [];
      const n = Math.max(2, Math.round((x2 - x1) / 34));
      for (let i = 0; i <= n; i++) {
        const xx = x1 + ((x2 - x1) * i) / n;
        arrows.push(<LoadArrow key={i} x={xx} y1={yTop} y2={beamY} color={LOAD_COLORS.dist} head={5} />);
      }
      rendered.push(
        <g key={idx}>
          <rect x={x1} y={yTop} width={Math.max(0, x2 - x1)} height={h} fillOpacity="0.12" style={{ fill: LOAD_COLORS.dist }} />
          <line x1={x1} x2={x2} y1={yTop} y2={yTop} strokeWidth="2" style={{ stroke: LOAD_COLORS.dist }} />
          {arrows}
        </g>
      );
      labels.push({
        x: (x1 + x2) / 2,
        y: yTop - 6,
        size: 11,
        color: LOAD_COLORS.dist,
        text: `w = ${fmt(l.value, 4)} ${u.distLoad}`,
      });
      breakpoints.push(l.start, l.end);
    } else if (l.type === "uvl") {
      const x1 = px(l.start);
      const x2 = px(l.end);
      const maxV = Math.max(Math.abs(l.startValue), Math.abs(l.endValue)) || 1;
      const h1 = (Math.abs(l.startValue) / maxV) * 34;
      const h2 = (Math.abs(l.endValue) / maxV) * 34;
      const yTop1 = beamY - h1;
      const yTop2 = beamY - h2;
      rendered.push(
        <g key={idx}>
          <polygon points={`${x1},${beamY} ${x1},${yTop1} ${x2},${yTop2} ${x2},${beamY}`} fillOpacity="0.12" strokeWidth="1.5" style={{ fill: LOAD_COLORS.dist, stroke: LOAD_COLORS.dist }} />
          <LoadArrow x={x1} y1={yTop1} y2={beamY} color={LOAD_COLORS.dist} head={5} />
          <LoadArrow x={x2} y1={yTop2} y2={beamY} color={LOAD_COLORS.dist} head={5} />
        </g>
      );
      if (Math.abs(l.startValue) > 1e-9) {
        labels.push({ x: x1, y: yTop1 - 6, size: 10.5, color: LOAD_COLORS.dist, text: `w₁ = ${fmt(l.startValue, 3)} ${u.distLoad}` });
      }
      if (Math.abs(l.endValue) > 1e-9) {
        labels.push({ x: x2, y: yTop2 - 6, size: 10.5, color: LOAD_COLORS.dist, text: `w₂ = ${fmt(l.endValue, 3)} ${u.distLoad}` });
      }
      breakpoints.push(l.start, l.end);
    } else if (l.type === "moment") {
      const pxm = px(l.position);
      const r = 16;
      const ccw = l.value >= 0;
      rendered.push(
        <g key={idx}>
          <path
            d={`M ${pxm - r} ${beamY} A ${r} ${r} 0 1 ${ccw ? 0 : 1} ${pxm + r} ${beamY}`}
            fill="none"
            strokeWidth="2"
            style={{ stroke: LOAD_COLORS.moment }}
          />
          <polygon
            points={ccw ? `${pxm - r},${beamY} ${pxm - r + 8},${beamY - 5} ${pxm - r + 8},${beamY + 5}` : `${pxm + r},${beamY} ${pxm + r - 8},${beamY - 5} ${pxm + r - 8},${beamY + 5}`}
            style={{ fill: LOAD_COLORS.moment }}
          />
        </g>
      );
      momentLabels.push({ x: pxm, y: beamY + 24, size: 11, color: LOAD_COLORS.moment, text: `M = ${fmt(l.value, 4)} ${u.moment}` });
      breakpoints.push(l.position);
    }
  });

  layoutLabels(labels);
  layoutLabelsDown(momentLabels);

  // chain dimensions (style A): distances between consecutive load edges, from x=0
  const eps = 1e-6 * Math.max(1, L);
  const stops = [];
  breakpoints
    .map((v) => Math.max(0, Math.min(L, v)))
    .sort((a, b) => a - b)
    .forEach((v) => {
      if (stops.length === 0 || Math.abs(v - stops[stops.length - 1]) > eps) stops.push(v);
    });

  const chainTicks = stops.map((s, i) => (
    <line key={i} x1={toPx(s)} x2={toPx(s)} y1={chainY - 5} y2={chainY + 5} strokeWidth="1" style={{ stroke: "var(--muted)" }} />
  ));
  const dimLabels = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const d = stops[i + 1] - stops[i];
    if (d <= eps) continue;
    dimLabels.push({
      x: toPx((stops[i] + stops[i + 1]) / 2),
      y: chainY - 5,
      size: 10,
      color: "var(--muted)",
      text: `${fmt(d, 4)} ${u.length}`,
    });
  }
  layoutLabels(dimLabels);

  const chain = (
    <g>
      <line x1={toPx(stops[0])} x2={toPx(stops[stops.length - 1])} y1={chainY} y2={chainY} strokeWidth="1" style={{ stroke: "var(--muted)" }} />
      {chainTicks}
    </g>
  );

  const total = (
    <g>
      <line x1={toPx(0)} x2={toPx(L)} y1={totalY} y2={totalY} strokeWidth="1" style={{ stroke: "var(--muted)" }} />
      <line x1={toPx(0)} x2={toPx(0)} y1={totalY - 5} y2={totalY + 5} strokeWidth="1" style={{ stroke: "var(--muted)" }} />
      <line x1={toPx(L)} x2={toPx(L)} y1={totalY - 5} y2={totalY + 5} strokeWidth="1" style={{ stroke: "var(--muted)" }} />
      <text x={toPx(L / 2)} y={totalY - 5} textAnchor="middle" fontSize="10.5" className="font-mono" style={{ fill: "var(--muted)" }}>
        {fmt(L, 4)} {u.length}
      </text>
    </g>
  );

  return (
    <div>
      <svg viewBox={`0 0 ${CHART.W} ${height}`} className="w-full" style={{ height: "auto" }} role="img">
        <line x1={CHART.PLOT_L} x2={CHART.PLOT_R} y1={beamY} y2={beamY} strokeWidth="7" strokeLinecap="round" style={{ stroke: color }} />
        {rendered}
        {supports}
        {chain}
        {dimLabels.map((lab, i) => (
          <LabelChip key={i} lab={lab} />
        ))}
        {total}
        {momentLabels.map((lab, i) => (
          <LabelChip key={i} lab={lab} />
        ))}
        {labels.map((lab, i) => (
          <LabelChip key={i} lab={lab} />
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted">
        <span className="font-medium uppercase tracking-wide">Loads</span>
        <LegendItem color={LOAD_COLORS.point} label="Point" symbol="P" />
        <LegendItem color={LOAD_COLORS.dist} label="UDL" symbol="w" />
        <LegendItem color={LOAD_COLORS.dist} label="UVL" symbol="w₁ → w₂" />
        <LegendItem color={LOAD_COLORS.moment} label="Moment" symbol="M" />
      </div>
    </div>
  );
}
