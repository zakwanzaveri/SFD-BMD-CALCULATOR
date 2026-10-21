"use client";

import { NumberField, Select } from "./ui";
import LoadEditor from "./LoadEditor";

export default function InputPanel({
  beam,
  setBeamField,
  loads,
  u,
  errors,
  onAdd,
  onUpdate,
  onRemove,
  onReset,
}) {
  const length = beam.length;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Beam configuration</h2>
        <div className="flex flex-col gap-3">
          <Select
            label="Beam type"
            value={beam.beamType}
            onChange={(v) => setBeamField("beamType", v)}
            options={[
              { value: "simple", label: "Simply supported" },
              { value: "cantilever", label: "Cantilever" },
              { value: "overhang", label: "Overhanging" },
            ]}
          />

          <NumberField
            label="Span length"
            value={length}
            onChange={(v) => setBeamField("length", v)}
            unit={u.length}
            min={0.001}
            step={0.5}
            error={errors.length}
          />

          {beam.beamType === "cantilever" ? (
            <Select
              label="Fixed end"
              value={beam.fixedEnd}
              onChange={(v) => setBeamField("fixedEnd", v)}
              options={[
                { value: "left", label: "Fixed at left" },
                { value: "right", label: "Fixed at right" },
              ]}
            />
          ) : null}

          {beam.beamType === "overhang" ? (
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Support A"
                value={beam.supports.a}
                onChange={(v) => setBeamField("supports", { ...beam.supports, a: v })}
                unit={u.length}
                min={0}
                max={length}
                step={0.1}
                error={errors.supportA}
              />
              <NumberField
                label="Support B"
                value={beam.supports.b}
                onChange={(v) => setBeamField("supports", { ...beam.supports, b: v })}
                unit={u.length}
                min={0}
                max={length}
                step={0.1}
                error={errors.supportB}
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Loads</h2>
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            Reset all
          </button>
        </div>
        <LoadEditor
          loads={loads}
          u={u}
          length={length}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onRemove={onRemove}
          errors={errors}
        />
      </section>
    </div>
  );
}
