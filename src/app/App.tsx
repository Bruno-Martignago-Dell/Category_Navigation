import React, { useRef, useState, useCallback, useEffect } from "react";
import { DDSIcon } from "@dds-v3/react";

// ─── Public types ─────────────────────────────────────────────────────────────

export type CategoryItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

export type CategoryNavigationSize = "desktop" | "tablet" | "mobile";
export type CategoryNavigationMode = "scroller" | "dropdown";

export type CategoryNavigationProps = {
  mode?:        CategoryNavigationMode;
  size?:        CategoryNavigationSize;
  items?:       CategoryItem[];
  selectedId?:  string;
  onSelect?:    (id: string) => void;
  /** Dropdown only — starts open. Used by the showcase to pre-open the panel. */
  initialOpen?: boolean;
};

// ─── Size tokens ──────────────────────────────────────────────────────────────
// desktop 44 px  = 2 × --dds-spacing-md (12 px) + 20 px line-height
// tablet  52 px  = 2 × --dds-spacing-lg (16 px) + 20 px line-height
// mobile  36 px  = 2 × --dds-spacing-sm  (8 px) + 20 px line-height

const SIZE_CFG: Record<
  CategoryNavigationSize,
  { pillPadV: string; pillPadH: string; chevronPad: string }
> = {
  desktop: { pillPadV: "var(--dds-spacing-md)", pillPadH: "var(--dds-spacing-lg)", chevronPad: "var(--dds-spacing-md)" },
  tablet:  { pillPadV: "var(--dds-spacing-lg)", pillPadH: "var(--dds-spacing-xl)", chevronPad: "var(--dds-spacing-lg)" },
  mobile:  { pillPadV: "var(--dds-spacing-sm)", pillPadH: "var(--dds-spacing-lg)", chevronPad: "var(--dds-spacing-sm)" },
};

const SHADOW_TRAIL = "-2px 2px 1px var(--dds-color-background-surface-drop-shadow),-4px 4px 2px var(--dds-color-background-surface-drop-shadow),-8px 8px 4px var(--dds-color-background-surface-drop-shadow),-16px 16px 8px var(--dds-color-background-surface-drop-shadow),-32px 32px 16px var(--dds-color-background-surface-drop-shadow)";
const SHADOW_LEAD  = "2px 2px 1px var(--dds-color-background-surface-drop-shadow),4px 4px 2px var(--dds-color-background-surface-drop-shadow),8px 8px 4px var(--dds-color-background-surface-drop-shadow),16px 16px 8px var(--dds-color-background-surface-drop-shadow),32px 32px 16px var(--dds-color-background-surface-drop-shadow)";
const SHADOW_PANEL = "0 2px 1px var(--dds-color-background-surface-drop-shadow),0 4px 2px var(--dds-color-background-surface-drop-shadow),0 8px 4px var(--dds-color-background-surface-drop-shadow)";

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_ITEMS: CategoryItem[] = [
  { id: "laptops",      label: "Laptops" },
  { id: "desktops",     label: "Desktops" },
  { id: "monitors",     label: "Monitors" },
  { id: "storage",      label: "Storage" },
  { id: "networking",   label: "Networking" },
  { id: "servers",      label: "Servers" },
  { id: "workstations", label: "Workstations" },
  { id: "accessories",  label: "Accessories" },
  { id: "software",     label: "Software" },
  { id: "services",     label: "Services" },
  { id: "security",     label: "Security" },
  { id: "cloud",        label: "Cloud" },
];

// ─── Prop normaliser ──────────────────────────────────────────────────────────

function normalise(rawProps: CategoryNavigationProps) {
  const items    = Array.isArray(rawProps.items) && rawProps.items.length > 0
    ? rawProps.items : DEMO_ITEMS;
  const size     = SIZE_CFG[rawProps.size as CategoryNavigationSize]
    ? rawProps.size as CategoryNavigationSize : "desktop";
  const selected = rawProps.selectedId || items[0]?.id || "";
  const onSelect = typeof rawProps.onSelect === "function"
    ? rawProps.onSelect : (_: string) => {};
  return { items, size, selected, onSelect };
}

// ─── Scroller mode ────────────────────────────────────────────────────────────

function ScrollerMode({
  items, size, selected, onSelect,
}: {
  items: CategoryItem[]; size: CategoryNavigationSize;
  selected: string; onSelect: (id: string) => void;
}) {
  const cfg      = SIZE_CFG[size];
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    sync();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", sync); ro.disconnect(); };
  }, [sync]);

  useEffect(() => {
    (trackRef.current?.querySelector('[aria-selected="true"]') as HTMLElement | null)
      ?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [selected]);

  const scrollBy = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir === "right" ? el.clientWidth * 0.75 : -(el.clientWidth * 0.75), behavior: "smooth" });
  };

  const firstEnabled = items.find(it => !it.disabled)?.id;
  const tabOwner     = items.some(it => it.id === selected && !it.disabled) ? selected : firstEnabled;

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const enabled = items.filter(it => !it.disabled);
    const cur     = enabled.findIndex(it => it.id === items[idx]?.id);
    if (cur < 0) return;
    let next: CategoryItem | undefined;
    if      (e.key === "ArrowRight") next = enabled[(cur + 1) % enabled.length];
    else if (e.key === "ArrowLeft")  next = enabled[(cur - 1 + enabled.length) % enabled.length];
    else if (e.key === "Home")       next = enabled[0];
    else if (e.key === "End")        next = enabled[enabled.length - 1];
    if (next) {
      e.preventDefault();
      onSelect(next.id);
      (trackRef.current?.querySelector(`[data-id="${next.id}"]`) as HTMLElement | null)?.focus();
    }
  };

  const track = "var(--dds-color-background-surface-secondary,var(--dds-color-slate-10,#ebf1f6))";

  return (
    <div style={{ position: "relative", borderRadius: "var(--dds-border-radius-rounded)", overflow: "hidden", backgroundColor: track }}>
      <div
        ref={trackRef}
        role="tablist"
        aria-label="Category navigation"
        className="cat-nav-track"
        style={{
          display: "flex", alignItems: "center", gap: "var(--dds-spacing-xs)", overflowX: "auto",
          paddingLeft:  canLeft  ? `calc(${cfg.chevronPad} * 2 + 16px)` : "0",
          paddingRight: canRight ? `calc(${cfg.chevronPad} * 2 + 16px)` : "0",
          transition: "padding 120ms ease",
        }}
      >
        {items.map((item, idx) => {
          const isSel = item.id === selected;
          return (
            <button
              key={item.id} role="tab" data-id={item.id}
              aria-selected={isSel} aria-disabled={item.disabled} disabled={item.disabled}
              tabIndex={item.id === tabOwner ? 0 : -1}
              onClick={() => onSelect(item.id)} onKeyDown={e => onKey(e, idx)}
              className={`cat-nav-item dds__body-3${isSel ? "-strong" : ""}`}
              style={{
                flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
                paddingTop: cfg.pillPadV, paddingBottom: cfg.pillPadV,
                paddingLeft: cfg.pillPadH, paddingRight: cfg.pillPadH,
                borderRadius: "var(--dds-border-radius-rounded)", border: "none",
                cursor: item.disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                backgroundColor: isSel
                  ? "var(--dds-color-background-brand-base-rest,var(--dds-color-blue-60,#0672cb))"
                  : track,
                color: isSel
                  ? "var(--dds-color-text-neutral,var(--dds-color-neutral-white,#ffffff))"
                  : item.disabled
                  ? "var(--dds-color-text-inactive,var(--dds-color-gray-50,#b6b6b6))"
                  : "var(--dds-color-text-primary,var(--dds-color-slate-70,#1d2c3b))",
                opacity: item.disabled ? 0.5 : 1,
                transition: "background-color 120ms ease, color 120ms ease",
              }}
            >{item.label}</button>
          );
        })}
      </div>
      {canLeft && (
        <button aria-label="Scroll left" className="cat-nav-chevron" onClick={() => scrollBy("left")}
          style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 2,
            display: "flex", alignItems: "center", justifyContent: "center", padding: cfg.chevronPad,
            backgroundColor: track, border: "none", borderRadius: "var(--dds-border-radius-rounded)",
            cursor: "pointer", boxShadow: SHADOW_LEAD, transition: "background-color 120ms ease" }}>
          <DDSIcon name="chevron-left" size="md" type="font-icon" aria-hidden="true" />
        </button>
      )}
      {canRight && (
        <button aria-label="Scroll right" className="cat-nav-chevron" onClick={() => scrollBy("right")}
          style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 2,
            display: "flex", alignItems: "center", justifyContent: "center", padding: cfg.chevronPad,
            backgroundColor: track, border: "none", borderRadius: "var(--dds-border-radius-rounded)",
            cursor: "pointer", boxShadow: SHADOW_TRAIL, transition: "background-color 120ms ease" }}>
          <DDSIcon name="chevron-right" size="md" type="font-icon" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// ─── Dropdown mode ────────────────────────────────────────────────────────────

function DropdownMode({
  items, selected, onSelect, initialOpen = false,
}: {
  items: CategoryItem[]; selected: string;
  onSelect: (id: string) => void; initialOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef   = useRef<HTMLButtonElement>(null);
  const listRef      = useRef<HTMLDivElement>(null);
  const label = items.find(it => it.id === selected)?.label ?? items[0]?.label ?? "Select";

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [isOpen]);

  const select = (id: string) => { onSelect(id); setIsOpen(false); triggerRef.current?.focus(); };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setIsOpen(false); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); setIsOpen(true);
      requestAnimationFrame(() => {
        (listRef.current?.querySelector('[role="option"]:not([disabled])') as HTMLElement | null)?.focus();
      });
    }
  };

  const onOptionKey = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const enabled = items.filter(it => !it.disabled);
    const cur     = enabled.findIndex(it => it.id === items[idx]?.id);
    if (e.key === "Escape")  { e.preventDefault(); setIsOpen(false); triggerRef.current?.focus(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); const n = enabled[Math.min(cur+1,enabled.length-1)]; if(n)(listRef.current?.querySelector(`[data-id="${n.id}"]`) as HTMLElement|null)?.focus(); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); if(cur<=0){triggerRef.current?.focus();return;} const p=enabled[cur-1]; if(p)(listRef.current?.querySelector(`[data-id="${p.id}"]`) as HTMLElement|null)?.focus(); }
    else if (e.key === "Home")  { e.preventDefault(); (listRef.current?.querySelector('[role="option"]:not([disabled])') as HTMLElement|null)?.focus(); }
    else if (e.key === "End")   { e.preventDefault(); (Array.from(listRef.current?.querySelectorAll('[role="option"]:not([disabled])') ?? []).pop() as HTMLElement|null)?.focus(); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if(!items[idx]?.disabled) select(items[idx].id); }
  };

  const brand = "var(--dds-color-background-brand-base-rest,var(--dds-color-blue-60,#0672cb))";
  const white = "var(--dds-color-text-neutral,var(--dds-color-neutral-white,#ffffff))";

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <button ref={triggerRef} aria-haspopup="listbox" aria-expanded={isOpen}
        onClick={() => setIsOpen(o => !o)} onKeyDown={onTriggerKey}
        className="cat-nav-dropdown-trigger dds__body-3"
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "var(--dds-spacing-sm)", padding: "var(--dds-spacing-sm) var(--dds-spacing-lg)",
          backgroundColor: brand, color: white, border: "none", cursor: "pointer",
          borderRadius: isOpen
            ? "var(--dds-border-radius-xl) var(--dds-border-radius-xl) 0 0"
            : "var(--dds-border-radius-rounded)",
          transition: "border-radius 80ms ease, background-color 120ms ease",
        }}>
        <span>{label}</span>
        <DDSIcon name={isOpen ? "chevron-up" : "chevron-down"} size="md" type="font-icon" aria-hidden="true" />
      </button>
      {isOpen && (
        <div ref={listRef} role="listbox" aria-label="Category list"
          style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
            backgroundColor: "var(--dds-color-background-surface-primary,#ffffff)",
            borderRadius: "var(--dds-border-radius-xs) var(--dds-border-radius-xs) var(--dds-border-radius-xl) var(--dds-border-radius-xl)",
            border: "var(--dds-border-width-xs) solid var(--dds-color-border-neutral-pale,var(--dds-color-gray-30,#e1e1e1))",
            borderTop: "none", boxShadow: SHADOW_PANEL,
            overflow: "hidden", maxHeight: "240px", overflowY: "auto",
            paddingTop: "var(--dds-spacing-xs)", paddingBottom: "var(--dds-spacing-xs)",
          }}>
          {items.map((item, idx) => {
            const isSel = item.id === selected;
            return (
              <button key={item.id} role="option" data-id={item.id}
                aria-selected={isSel} aria-disabled={item.disabled} disabled={item.disabled}
                tabIndex={0} onClick={() => !item.disabled && select(item.id)}
                onKeyDown={e => onOptionKey(e, idx)}
                className="cat-nav-menu-item dds__body-3"
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  padding: "var(--dds-spacing-sm) var(--dds-spacing-md)",
                  border: "none", textAlign: "left", cursor: item.disabled ? "not-allowed" : "pointer",
                  backgroundColor: isSel
                    ? "var(--dds-color-background-brand-subtle-hover,var(--dds-color-blue-20,#94dcf7))"
                    : "var(--dds-color-background-surface-primary,#ffffff)",
                  color: isSel
                    ? "var(--dds-color-text-brand-hover,var(--dds-color-blue-80,#00468b))"
                    : item.disabled
                    ? "var(--dds-color-text-inactive,var(--dds-color-gray-50,#b6b6b6))"
                    : "var(--dds-color-text-secondary,var(--dds-color-gray-80,#636363))",
                  opacity: item.disabled ? 0.5 : 1,
                  transition: "background-color 120ms ease",
                }}>{item.label}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Showcase helpers ─────────────────────────────────────────────────────────

function ShowSection({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "var(--dds-spacing-4xl)" }}>
      <h2 className="dds__heading-6" style={{ color: "var(--dds-color-text-primary)", marginBottom: sub ? "var(--dds-spacing-xs)" : "var(--dds-spacing-lg)" }}>
        {title}
      </h2>
      {sub && <p className="dds__body-4" style={{ color: "var(--dds-color-text-secondary)", marginBottom: "var(--dds-spacing-lg)" }}>{sub}</p>}
      {children}
    </section>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="dds__body-4" style={{
      display: "inline-block", padding: "2px var(--dds-spacing-sm)",
      backgroundColor: "var(--dds-color-background-surface-secondary)",
      borderRadius: "var(--dds-border-radius-sm)",
      color: "var(--dds-color-text-tertiary)",
      marginBottom: "var(--dds-spacing-sm)",
    }}>{label}</span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: "var(--dds-color-background-surface-secondary)",
      borderRadius: "var(--dds-border-radius-lg)",
      padding: "var(--dds-spacing-xl)", ...style,
    }}>{children}</div>
  );
}

function Hr() {
  return <div style={{ height: 1, backgroundColor: "var(--dds-color-border-neutral-pale)", margin: "var(--dds-spacing-4xl) 0" }} />;
}

function FrozenPill({ label, state, size = "desktop" }: {
  label: string; state: "selected"|"default"|"hover"|"focus-visible"|"disabled"; size?: CategoryNavigationSize;
}) {
  const cfg   = SIZE_CFG[size];
  const track = "var(--dds-color-background-surface-secondary)";
  return (
    <span className={`dds__body-3${state === "selected" ? "-strong" : ""}`} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      paddingTop: cfg.pillPadV, paddingBottom: cfg.pillPadV,
      paddingLeft: cfg.pillPadH, paddingRight: cfg.pillPadH,
      borderRadius: "var(--dds-border-radius-rounded)", whiteSpace: "nowrap",
      backgroundColor: state === "selected" ? "var(--dds-color-background-brand-base-rest,#0672cb)"
        : state === "hover" ? "var(--dds-color-background-neutral-subtle-hover)" : track,
      color: state === "selected"  ? "var(--dds-color-text-neutral,#ffffff)"
           : state === "disabled"  ? "var(--dds-color-text-inactive)"
           : "var(--dds-color-text-primary)",
      opacity: state === "disabled" ? 0.5 : 1,
      outline: state === "focus-visible" ? "2px solid var(--dds-color-border-focus-ring2)" : "none",
      outlineOffset: state === "focus-visible" ? "2px" : undefined,
      boxShadow: state === "focus-visible"
        ? "0 0 0 4px var(--dds-color-border-focus-ring1),0 0 0 6px var(--dds-color-border-focus-ring2)" : "none",
    }}>{label}</span>
  );
}

function FrozenChevron({ dir, state }: { dir: "leading"|"trailing"; state: "default"|"hover"|"focus-visible" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "var(--dds-spacing-md)", borderRadius: "var(--dds-border-radius-rounded)",
      backgroundColor: state === "hover" ? "var(--dds-color-background-neutral-subtle-hover)"
        : "var(--dds-color-background-surface-secondary)",
      boxShadow: dir === "trailing" ? SHADOW_TRAIL : SHADOW_LEAD,
      outline: state === "focus-visible" ? "2px solid var(--dds-color-border-focus-ring2)" : "none",
      outlineOffset: "2px",
    }}>
      <DDSIcon name={dir === "trailing" ? "chevron-right" : "chevron-left"} size="md" type="font-icon" aria-hidden="true" />
    </span>
  );
}

function FrozenRow({ label, state }: { label: string; state: "default"|"hover"|"focus-visible"|"selected"|"disabled" }) {
  return (
    <span className="dds__body-3" style={{
      display: "flex", alignItems: "center",
      padding: "var(--dds-spacing-sm) var(--dds-spacing-md)", whiteSpace: "nowrap",
      backgroundColor: state === "selected" ? "var(--dds-color-background-brand-subtle-hover,#94dcf7)"
        : (state === "hover" || state === "focus-visible") ? "var(--dds-color-background-brand-subtle-rest)"
        : "var(--dds-color-background-surface-primary,#fff)",
      color: state === "selected"  ? "var(--dds-color-text-brand-hover,#00468b)"
           : state === "disabled"  ? "var(--dds-color-text-inactive)"
           : "var(--dds-color-text-secondary)",
      opacity: state === "disabled" ? 0.5 : 1,
      outline: state === "focus-visible" ? "2px solid var(--dds-color-border-focus-ring2)" : "none",
      outlineOffset: "-2px",
    }}>{label}</span>
  );
}

function StateCell({ stateLabel, children }: { stateLabel: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--dds-spacing-sm)" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "var(--dds-color-background-surface-primary)",
        borderRadius: "var(--dds-border-radius-md)",
        border: "1px solid var(--dds-color-border-neutral-pale)",
        padding: "var(--dds-spacing-md)", minHeight: "60px", width: "100%",
      }}>{children}</div>
      <span className="dds__body-4" style={{ color: "var(--dds-color-text-tertiary)", textAlign: "center", textTransform: "capitalize" }}>
        {stateLabel.replace("-", "‑")}
      </span>
    </div>
  );
}

// ─── Full component showcase ──────────────────────────────────────────────────

function Showcase() {
  const [dSel,  setDSel]  = useState("laptops");
  const [tSel,  setTSel]  = useState("monitors");
  const [mSel,  setMSel]  = useState("servers");
  const [ddSel, setDdSel] = useState("laptops");

  const PILL_STATES  = ["selected","default","hover","focus-visible","disabled"] as const;
  const CHEV_STATES  = ["default","hover","focus-visible"] as const;
  const ROW_STATES   = ["default","hover","focus-visible","selected","disabled"] as const;
  const SIZES: CategoryNavigationSize[] = ["desktop","tablet","mobile"];
  const gc = (n: number) => `repeat(${n}, 1fr)`;

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--dds-color-background-surface-primary)",
      fontFamily: "var(--dds-typography-font-family-base)",
      padding: "var(--dds-spacing-4xl) var(--dds-spacing-2xl)",
    }}>
      <div style={{ maxWidth: "1024px", margin: "0 auto" }}>

        <div style={{ marginBottom: "var(--dds-spacing-5xl)" }}>
          <h1 className="dds__heading-4" style={{ color: "var(--dds-color-text-primary)", marginBottom: "var(--dds-spacing-sm)" }}>
            Category Navigation
          </h1>
          <p className="dds__body-3" style={{ color: "var(--dds-color-text-secondary)", maxWidth: "600px" }}>
            Lets users switch between related views or categories.
            Two modes: <strong>scroller</strong> (horizontal pill row) and <strong>dropdown</strong> (compact trigger + listbox).
            All variants below are interactive.
          </p>
        </div>

        <ShowSection title="Scroller mode" sub="Click any pill to select. Resize to trigger overflow chevrons.">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--dds-spacing-2xl)" }}>
            <div><Tag label="desktop · 44 px" /><CategoryNavigation mode="scroller" size="desktop" items={DEMO_ITEMS} selectedId={dSel} onSelect={setDSel} /></div>
            <div><Tag label="tablet · 52 px" /><CategoryNavigation mode="scroller" size="tablet" items={DEMO_ITEMS} selectedId={tSel} onSelect={setTSel} /></div>
            <div><Tag label="mobile · 36 px" /><div style={{ maxWidth: "440px" }}><CategoryNavigation mode="scroller" size="mobile" items={DEMO_ITEMS} selectedId={mSel} onSelect={setMSel} /></div></div>
          </div>
        </ShowSection>

        <Hr />

        <ShowSection title="Pill states" sub="Every state frozen per size — browsable without interaction.">
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: `80px ${gc(PILL_STATES.length)}`, gap: "var(--dds-spacing-sm)", marginBottom: "var(--dds-spacing-md)", alignItems: "end" }}>
              <span />
              {PILL_STATES.map(s => <span key={s} className="dds__body-4" style={{ color: "var(--dds-color-text-tertiary)", textAlign: "center", textTransform: "capitalize" }}>{s.replace("-","‑")}</span>)}
            </div>
            {SIZES.map(sz => (
              <div key={sz} style={{ display: "grid", gridTemplateColumns: `80px ${gc(PILL_STATES.length)}`, gap: "var(--dds-spacing-sm)", marginBottom: "var(--dds-spacing-sm)", alignItems: "center" }}>
                <span className="dds__body-4" style={{ color: "var(--dds-color-text-secondary)", textTransform: "capitalize" }}>{sz}</span>
                {PILL_STATES.map(st => (
                  <div key={st} style={{ display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "var(--dds-color-background-surface-primary)", borderRadius: "var(--dds-border-radius-md)", border: "1px solid var(--dds-color-border-neutral-pale)", padding: "var(--dds-spacing-md)", minHeight: "56px" }}>
                    <FrozenPill label={st === "selected" ? "Selected" : st === "disabled" ? "Disabled" : "Category"} state={st} size={sz} />
                  </div>
                ))}
              </div>
            ))}
          </Card>
        </ShowSection>

        <Hr />

        <ShowSection title="Overflow controls" sub="Chevrons appear only when content overflows in that direction.">
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: `100px ${gc(CHEV_STATES.length)}`, gap: "var(--dds-spacing-md)", alignItems: "center" }}>
              <span />
              {CHEV_STATES.map(s => <span key={s} className="dds__body-4" style={{ color: "var(--dds-color-text-tertiary)", textAlign: "center", textTransform: "capitalize" }}>{s.replace("-","‑")}</span>)}
              <span className="dds__body-4" style={{ color: "var(--dds-color-text-secondary)" }}>Trailing →</span>
              {CHEV_STATES.map(st => <div key={"t"+st} style={{ display: "flex", justifyContent: "center", backgroundColor: "var(--dds-color-background-surface-primary)", borderRadius: "var(--dds-border-radius-md)", border: "1px solid var(--dds-color-border-neutral-pale)", padding: "var(--dds-spacing-md)" }}><FrozenChevron dir="trailing" state={st} /></div>)}
              <span className="dds__body-4" style={{ color: "var(--dds-color-text-secondary)" }}>← Leading</span>
              {CHEV_STATES.map(st => <div key={"l"+st} style={{ display: "flex", justifyContent: "center", backgroundColor: "var(--dds-color-background-surface-primary)", borderRadius: "var(--dds-border-radius-md)", border: "1px solid var(--dds-color-border-neutral-pale)", padding: "var(--dds-spacing-md)" }}><FrozenChevron dir="leading" state={st} /></div>)}
              <span className="dds__body-4" style={{ color: "var(--dds-color-text-secondary)" }}>Hidden</span>
              {CHEV_STATES.map((_,i) => <div key={"h"+i} style={{ display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "var(--dds-color-background-surface-primary)", borderRadius: "var(--dds-border-radius-md)", border: "1px solid var(--dds-color-border-neutral-pale)", padding: "var(--dds-spacing-md)", minHeight: "56px" }}><span className="dds__body-4" style={{ color: "var(--dds-color-text-tertiary)" }}>{i === 0 ? "Not mounted" : "—"}</span></div>)}
            </div>
          </Card>
        </ShowSection>

        <Hr />

        <ShowSection title="Dropdown mode" sub="Click the trigger to open/close. Selecting a row closes the panel.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--dds-spacing-3xl)", alignItems: "start" }}>
            <div><Tag label="Closed" /><div style={{ maxWidth: "320px" }}><CategoryNavigation mode="dropdown" items={DEMO_ITEMS} selectedId={ddSel} onSelect={setDdSel} initialOpen={false} /></div></div>
            <div style={{ position: "relative", zIndex: 10 }}><Tag label="Open (pre-opened)" /><div style={{ maxWidth: "320px" }}><CategoryNavigation mode="dropdown" items={DEMO_ITEMS} selectedId={ddSel} onSelect={setDdSel} initialOpen={true} /></div></div>
          </div>
        </ShowSection>

        <Hr />

        <ShowSection title="Dropdown row states" sub="Each menu row state frozen — browsable without interaction.">
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${ROW_STATES.length}, 1fr)`, gap: "var(--dds-spacing-md)" }}>
            {ROW_STATES.map(st => (
              <StateCell key={st} stateLabel={st}>
                <FrozenRow label={st === "selected" ? "Selected item" : "Action item"} state={st} />
              </StateCell>
            ))}
          </div>
        </ShowSection>

      </div>
    </div>
  );
}

// ─── CategoryNavigation (public API) ─────────────────────────────────────────
//
// When no `items` prop is provided (Figma Make renders the component in
// isolation), the full Showcase renders so the canvas always shows all variants.
// When called with real items, the single component renders normally.

export function CategoryNavigation(rawProps: CategoryNavigationProps) {
  const hasItems = Array.isArray(rawProps.items) && rawProps.items.length > 0;
  if (!hasItems) return <Showcase />;

  const { items, size, selected, onSelect } = normalise(rawProps);
  const mode        = rawProps.mode || "scroller";
  const initialOpen = rawProps.initialOpen ?? false;

  if (mode === "dropdown") {
    return <DropdownMode items={items} selected={selected} onSelect={onSelect} initialOpen={initialOpen} />;
  }
  return <ScrollerMode items={items} size={size} selected={selected} onSelect={onSelect} />;
}

export default function App() {
  return <Showcase />;
}
