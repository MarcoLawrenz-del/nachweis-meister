type Props = { 
  value: "required" | "optional" | "hidden"; 
  onChange: (v: Props["value"]) => void; 
  compact?: boolean;
};

export default function RequirementSelector({ value, onChange, compact }: Props) {
  const opts = [
    { 
      v: "required", 
      label: "Pflicht",
      activeClass: "bg-amber-500 text-white border-amber-600",
      hoverClass: "hover:bg-amber-50 hover:text-amber-700"
    },
    { 
      v: "optional", 
      label: "Optional",
      activeClass: "bg-muted text-muted-foreground border-border",
      hoverClass: "hover:bg-muted/80"
    },
    { 
      v: "hidden", 
      label: "Nicht anfordern",
      activeClass: "bg-muted text-muted-foreground border-border",
      hoverClass: "hover:bg-muted/80"
    },
  ] as const;

  return (
    <div className={`inline-flex rounded-xl border ${compact ? "text-xs" : "text-sm"}`}>
      {opts.map(o => (
        <button 
          key={o.v}
          type="button"
          onClick={() => onChange(o.v as any)}
          className={
            `px-3 py-1.5 first:rounded-l-xl last:rounded-r-xl transition-colors border-r last:border-r-0 ` + 
            (value === o.v 
              ? o.activeClass
              : `bg-transparent ${o.hoverClass}`
            )
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}