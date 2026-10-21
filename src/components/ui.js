"use client";

import { useState } from "react";

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

export function NumberField({ label, value, onChange, unit, min, max, step = 1, error }) {
  const [text, setText] = useState(value == null ? "" : String(value));
  const [focused, setFocused] = useState(false);
  const shown = focused ? text : value == null ? "" : String(value);

  return (
    <Field label={label}>
      <div
        className={`flex items-center gap-1 rounded-lg border bg-background px-2.5 py-1.5 transition-colors focus-within:ring-2 focus-within:ring-primary/40 ${
          error ? "border-danger" : "border-border"
        }`}
      >
        <input
          type="number"
          inputMode="decimal"
          value={shown}
          min={min}
          max={max}
          step={step}
          onFocus={() => {
            setFocused(true);
            setText(value == null ? "" : String(value));
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseFloat(e.target.value);
            if (e.target.value !== "" && !isNaN(n)) onChange(n);
          }}
          className="w-full min-w-0 bg-transparent font-mono text-sm text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {unit ? <span className="shrink-0 font-mono text-[11px] text-muted">{unit}</span> : null}
      </div>
      {error ? <span className="text-[11px] text-danger">{error}</span> : null}
    </Field>
  );
}

export function SegmentedControl({ options, value, onChange, ariaLabel }) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="inline-flex rounded-lg border border-border bg-surface p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
              active ? "bg-primary text-primary-fg shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Button({ children, onClick, variant = "secondary", type = "button", className = "" }) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";
  const styles = {
    primary: "bg-primary text-primary-fg hover:opacity-90",
    secondary: "border border-border bg-background text-foreground hover:bg-surface",
    ghost: "text-muted hover:text-foreground hover:bg-surface",
    danger: "border border-border text-danger hover:bg-danger/10",
  };
  return (
    <button type={type} onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}
