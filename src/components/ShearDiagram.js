import { ValueDiagram } from "./DiagramFrame";

export default function ShearDiagram({ nodes, length, u }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Shear Force Diagram (SFD)</h3>
        <span className="font-mono text-[11px] text-muted">positive shear plotted up</span>
      </div>
      <ValueDiagram nodes={nodes} length={length} valueKey="V" color="var(--shear)" unit={u.force} lengthUnit={u.length} />
    </section>
  );
}
