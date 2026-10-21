"use client";

import { useMemo, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { SegmentedControl } from "./ui";
import InputPanel from "./InputPanel";
import BeamDiagram from "./BeamDiagram";
import ShearDiagram from "./ShearDiagram";
import MomentDiagram from "./MomentDiagram";
import ResultsTable from "./ResultsTable";
import { unitsFor, toSI, fromSI, convert } from "@/lib/units";
import { solveReactions, sampleDiagrams, findExtrema } from "@/lib/analysis";

const UNIT_OPTIONS = [
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" },
];

const INITIAL_BEAM = {
  beamType: "simple",
  length: 10,
  fixedEnd: "left",
  supports: { a: 1, b: 9 },
};

const INITIAL_LOADS = [{ id: 1, type: "point", value: 10, position: 5 }];

function buildSI(units, beam, loads) {
  const siBeam = {
    beamType: beam.beamType,
    length: toSI(beam.length, "length", units),
    fixedEnd: beam.fixedEnd,
    supports: {
      a: toSI(beam.supports.a, "length", units),
      b: toSI(beam.supports.b, "length", units),
    },
  };
  const siLoads = loads.map((l) => {
    switch (l.type) {
      case "point":
        return { type: "point", value: toSI(l.value, "force", units), position: toSI(l.position, "length", units), angle: l.angle == null ? 90 : l.angle };
      case "udl":
        return {
          type: "udl",
          value: toSI(l.value, "distLoad", units),
          start: toSI(l.start, "length", units),
          end: toSI(l.end, "length", units),
        };
      case "uvl":
        return {
          type: "uvl",
          startValue: toSI(l.startValue, "distLoad", units),
          endValue: toSI(l.endValue, "distLoad", units),
          start: toSI(l.start, "length", units),
          end: toSI(l.end, "length", units),
        };
      case "moment":
        return {
          type: "moment",
          value: toSI(l.value, "moment", units),
          position: toSI(l.position, "length", units),
        };
      default:
        return l;
    }
  });
  return { siBeam, siLoads };
}

export default function BeamCalculator() {
  const [units, setUnits] = useState("metric");
  const [beam, setBeam] = useState(INITIAL_BEAM);
  const [loads, setLoads] = useState(INITIAL_LOADS);
  const nextId = useRef(2);

  const u = unitsFor(units);

  const setBeamField = (field, value) => setBeam((prev) => ({ ...prev, [field]: value }));

  const addLoad = (type) => {
    const L = beam.length;
    const base = { id: nextId.current++, type };
    let load;
    if (type === "point") load = { ...base, value: 10, position: L / 2, angle: 90 };
    else if (type === "udl") load = { ...base, value: 5, start: 0, end: L };
    else if (type === "uvl") load = { ...base, startValue: 0, endValue: 5, start: 0, end: L };
    else load = { ...base, value: 5, position: L / 2 };
    setLoads((prev) => [...prev, load]);
  };

  const updateLoad = (id, patch) => setLoads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const removeLoad = (id) => setLoads((prev) => prev.filter((l) => l.id !== id));

  const reset = () => {
    setBeam(INITIAL_BEAM);
    setLoads(INITIAL_LOADS.map((l) => ({ ...l })));
    nextId.current = 2;
  };

  const changeUnits = (next) => {
    if (next === units) return;
    setUnits(next);
    setBeam((prev) => ({
      ...prev,
      length: convert(prev.length, "length", units, next),
      supports: {
        a: convert(prev.supports.a, "length", units, next),
        b: convert(prev.supports.b, "length", units, next),
      },
    }));
    setLoads((prev) =>
      prev.map((l) => {
        const c = (v, qty) => convert(v, qty, units, next);
        switch (l.type) {
          case "point":
            return { ...l, value: c(l.value, "force"), position: c(l.position, "length") };
          case "udl":
            return { ...l, value: c(l.value, "distLoad"), start: c(l.start, "length"), end: c(l.end, "length") };
          case "uvl":
            return {
              ...l,
              startValue: c(l.startValue, "distLoad"),
              endValue: c(l.endValue, "distLoad"),
              start: c(l.start, "length"),
              end: c(l.end, "length"),
            };
          case "moment":
            return { ...l, value: c(l.value, "moment"), position: c(l.position, "length") };
          default:
            return l;
        }
      })
    );
  };

  const errors = useMemo(() => {
    const e = {};
    const L = beam.length;
    if (!(L > 0)) e.length = "Must be greater than 0";
    if (beam.beamType === "overhang") {
      if (!(beam.supports.a >= 0 && beam.supports.a <= L)) e.supportA = "Within span";
      if (!(beam.supports.b >= 0 && beam.supports.b <= L)) e.supportB = "Within span";
      else if (!(beam.supports.b > beam.supports.a)) e.supportB = "Must be right of A";
    }
    loads.forEach((l) => {
      if (l.type === "point" || l.type === "moment") {
        if (!(l.position >= 0 && l.position <= L)) e[l.id] = `Within 0–${L}`;
        if (l.type === "point" && !(l.angle >= 0 && l.angle <= 180)) e[`${l.id}:angle`] = "0–180°";
      } else {
        if (!(l.start >= 0 && l.start <= L) || !(l.end >= 0 && l.end <= L)) e[l.id] = "Within span";
        if (!(l.end > l.start)) e[`${l.id}:end`] = "End must exceed start";
      }
    });
    return e;
  }, [beam, loads]);

  const hasErrors = Object.keys(errors).length > 0;

  const { reactions, nodes, extrema } = useMemo(() => {
    const empty = { reactions: null, nodes: [], extrema: null };
    if (hasErrors) return empty;
    const { siBeam, siLoads } = buildSI(units, beam, loads);
    const r = solveReactions(siBeam, siLoads);
    if (!r) return empty;

    const siNodes = sampleDiagrams(siBeam, siLoads, r);
    const nodesOut = siNodes.map((n) => ({
      x: fromSI(n.x, "length", units),
      V: fromSI(n.V, "force", units),
      M: fromSI(n.M, "moment", units),
    }));

    const ex = findExtrema(siNodes, siBeam.length);
    const extremaOut = {
      Vmax: { value: fromSI(ex.Vmax.value, "force", units), x: fromSI(ex.Vmax.x, "length", units) },
      Vmin: { value: fromSI(ex.Vmin.value, "force", units), x: fromSI(ex.Vmin.x, "length", units) },
      Mmax: { value: fromSI(ex.Mmax.value, "moment", units), x: fromSI(ex.Mmax.x, "length", units) },
      Mmin: { value: fromSI(ex.Mmin.value, "moment", units), x: fromSI(ex.Mmin.x, "length", units) },
    };

    const dispReactions =
      r.kind === "two"
        ? { kind: "two", Ra: fromSI(r.Ra, "force", units), Rb: fromSI(r.Rb, "force", units), Ha: fromSI(r.Ha, "force", units) }
        : {
            kind: "fixed",
            force: fromSI(r.force, "force", units),
            moment: fromSI(r.moment, "moment", units),
            H: fromSI(r.H, "force", units),
          };

    return { reactions: dispReactions, nodes: nodesOut, extrema: extremaOut };
  }, [units, beam, loads, hasErrors]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            SFD &amp; BMD Calculator
          </h1>
          <p className="mt-0.5 text-sm text-muted">Shear force and bending moment diagrams for beams</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle />
          <SegmentedControl options={UNIT_OPTIONS} value={units} onChange={changeUnits} ariaLabel="Unit system" />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <InputPanel
            beam={beam}
            setBeamField={setBeamField}
            loads={loads}
            u={u}
            errors={errors}
            onAdd={addLoad}
            onUpdate={updateLoad}
            onRemove={removeLoad}
            onReset={reset}
          />
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-foreground">Beam &amp; loading</h3>
            <BeamDiagram beam={{ ...beam }} loads={loads} u={u} />
          </section>

          <ResultsTable reactions={reactions} extrema={extrema} u={u} />
          <ShearDiagram nodes={nodes} length={beam.length} u={u} />
          <MomentDiagram nodes={nodes} length={beam.length} u={u} />
        </div>
      </div>
    </div>
  );
}
