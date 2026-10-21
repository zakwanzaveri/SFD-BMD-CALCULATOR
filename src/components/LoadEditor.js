"use client";

import { NumberField, Button } from "./ui";

const TYPE_META = {
  point: { label: "Point load", cls: "bg-primary/15 text-primary" },
  udl: { label: "UDL", cls: "bg-shear/20 text-shear" },
  uvl: { label: "UVL", cls: "bg-shear/20 text-shear" },
  moment: { label: "Moment", cls: "bg-moment/20 text-moment" },
};

export default function LoadEditor({ loads, u, length, onAdd, onUpdate, onRemove, errors }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => onAdd("point")}>
          + Point load
        </Button>
        <Button variant="secondary" onClick={() => onAdd("udl")}>
          + UDL
        </Button>
        <Button variant="secondary" onClick={() => onAdd("uvl")}>
          + UVL
        </Button>
        <Button variant="secondary" onClick={() => onAdd("moment")}>
          + Moment
        </Button>
      </div>

      {loads.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted">
          No loads yet. Add one above.
        </p>
      ) : null}

      {loads.map((l) => {
        const meta = TYPE_META[l.type];
        return (
          <div key={l.id} className="rounded-xl border border-border bg-background p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.cls}`}>{meta.label}</span>
              <Button variant="ghost" onClick={() => onRemove(l.id)} aria-label="Remove load">
                Remove
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {l.type === "point" ? (
                <>
                  <NumberField
                    label="Magnitude"
                    value={l.value}
                    onChange={(v) => onUpdate(l.id, { value: v })}
                    unit={u.force}
                    error={errors[l.id]}
                  />
                  <NumberField
                    label="Position"
                    value={l.position}
                    onChange={(v) => onUpdate(l.id, { position: v })}
                    unit={u.length}
                    min={0}
                    max={length}
                    step={0.1}
                  />
                  <NumberField
                    label="Angle"
                    value={l.angle == null ? 90 : l.angle}
                    onChange={(v) => onUpdate(l.id, { angle: v })}
                    unit="°"
                    min={0}
                    max={180}
                    step={5}
                    error={errors[`${l.id}:angle`]}
                  />
                  <p className="col-span-2 -mt-1 text-[11px] leading-snug text-muted">
                    Inclination from horizontal: 0° = →, 90° = ↓, 180° = ←
                  </p>
                </>
              ) : null}

              {l.type === "udl" ? (
                <>
                  <NumberField
                    label="Intensity"
                    value={l.value}
                    onChange={(v) => onUpdate(l.id, { value: v })}
                    unit={u.distLoad}
                    error={errors[l.id]}
                  />
                  <NumberField
                    label="Start"
                    value={l.start}
                    onChange={(v) => onUpdate(l.id, { start: v })}
                    unit={u.length}
                    min={0}
                    max={length}
                    step={0.1}
                  />
                  <NumberField
                    label="End"
                    value={l.end}
                    onChange={(v) => onUpdate(l.id, { end: v })}
                    unit={u.length}
                    min={0}
                    max={length}
                    step={0.1}
                    error={errors[`${l.id}:end`]}
                  />
                </>
              ) : null}

              {l.type === "uvl" ? (
                <>
                  <NumberField
                    label="Start value"
                    value={l.startValue}
                    onChange={(v) => onUpdate(l.id, { startValue: v })}
                    unit={u.distLoad}
                  />
                  <NumberField
                    label="End value"
                    value={l.endValue}
                    onChange={(v) => onUpdate(l.id, { endValue: v })}
                    unit={u.distLoad}
                  />
                  <NumberField
                    label="Start"
                    value={l.start}
                    onChange={(v) => onUpdate(l.id, { start: v })}
                    unit={u.length}
                    min={0}
                    max={length}
                    step={0.1}
                  />
                  <NumberField
                    label="End"
                    value={l.end}
                    onChange={(v) => onUpdate(l.id, { end: v })}
                    unit={u.length}
                    min={0}
                    max={length}
                    step={0.1}
                    error={errors[`${l.id}:end`]}
                  />
                </>
              ) : null}

              {l.type === "moment" ? (
                <>
                  <NumberField
                    label="Value (+ CCW)"
                    value={l.value}
                    onChange={(v) => onUpdate(l.id, { value: v })}
                    unit={u.moment}
                    step={0.5}
                  />
                  <NumberField
                    label="Position"
                    value={l.position}
                    onChange={(v) => onUpdate(l.id, { position: v })}
                    unit={u.length}
                    min={0}
                    max={length}
                    step={0.1}
                  />
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
