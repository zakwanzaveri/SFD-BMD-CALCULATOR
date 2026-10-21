"use client";

import { fmt } from "@/lib/units";

function Metric({ label, value, unit, x, lengthUnit, accent }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-mono text-base font-semibold" style={{ color: accent }}>
        {fmt(value, 4)} <span className="text-xs font-normal text-muted">{unit}</span>
      </div>
      <div className="font-mono text-[11px] text-muted">
        at x = {fmt(x, 4)} {lengthUnit}
      </div>
    </div>
  );
}

export default function ResultsTable({ reactions, extrema, u }) {
  if (!reactions || !extrema) {
    return (
      <section className="rounded-xl border border-border bg-surface p-4 text-sm text-muted shadow-sm">
        Enter valid geometry and loads to see reactions.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Support reactions</h3>
      <div className="mb-4 flex flex-wrap gap-2">
        {reactions.kind === "two" ? (
          <>
            <span className="rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 font-mono text-sm">
              R<sub>A</sub> = {fmt(reactions.Ra, 4)} {u.force}
            </span>
            <span className="rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 font-mono text-sm">
              R<sub>B</sub> = {fmt(reactions.Rb, 4)} {u.force}
            </span>
            <span className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-sm">
              H<sub>A</sub> = {fmt(reactions.Ha, 4)} {u.force}
            </span>
          </>
        ) : (
          <>
            <span className="rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 font-mono text-sm">
              R = {fmt(reactions.force, 4)} {u.force}
            </span>
            <span className="rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 font-mono text-sm">
              M<sub>fixed</sub> = {fmt(reactions.moment, 4)} {u.moment}
            </span>
            <span className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-sm">
              H = {fmt(reactions.H, 4)} {u.force}
            </span>
          </>
        )}
      </div>

      <h3 className="mb-3 text-sm font-semibold text-foreground">Extremes</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="V max" value={extrema.Vmax.value} unit={u.force} x={extrema.Vmax.x} lengthUnit={u.length} accent="var(--shear)" />
        <Metric label="V min" value={extrema.Vmin.value} unit={u.force} x={extrema.Vmin.x} lengthUnit={u.length} accent="var(--shear)" />
        <Metric label="M max (+sag)" value={extrema.Mmax.value} unit={u.moment} x={extrema.Mmax.x} lengthUnit={u.length} accent="var(--moment)" />
        <Metric label="M min (−hog)" value={extrema.Mmin.value} unit={u.moment} x={extrema.Mmin.x} lengthUnit={u.length} accent="var(--moment)" />
      </div>
    </section>
  );
}
