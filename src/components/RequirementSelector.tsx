type Props = { 
  value: "required" | "optional" | "hidden"; 
  onChange: (v: Props["value"]) => void; 
  compact?: boolean;
};

export default function RequirementSelector({ value, onChange, compact }: Props) {
  const opts = [
    { v: "required", label: "Pflicht" },
    { v: "optional", label: "Optional" },
    { v: "hidden", label: "Nicht anfordern" },
  ] as const;

  return (
    <div className={`inline-flex rounded-xl border ${compact ? "text-xs" : "text-sm"}`}>
      {opts.map(o => (
        <button 
          key={o.v}
          type="button"
          onClick={() => onChange(o.v as any)}
          className={
            "px-3 py-1.5 first:rounded-l-xl last:rounded-r-xl transition-colors " + 
            (value === o.v ? "bg-black text-white" : "bg-transparent hover:bg-muted")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}