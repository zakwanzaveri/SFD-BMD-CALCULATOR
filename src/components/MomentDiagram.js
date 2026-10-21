import { ValueDiagram } from "./DiagramFrame";

export default function MomentDiagram({ nodes, length, u }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Bending Moment Diagram (BMD)</h3>
        <span className="font-mono text-[11px] text-muted">+ sag &nbsp;·&nbsp; − hog</span>
      </div>
      <ValueDiagram nodes={nodes} length={length} valueKey="M" color="var(--moment)" unit={u.moment} lengthUnit={u.length} />
    </section>
  );
}
