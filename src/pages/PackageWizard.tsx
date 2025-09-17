import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/lib/ROUTES";
import { seedDocumentsForContractor } from "@/services/contractors";

const PACKAGES = [
  { id: "Standard", name: "Standard", items: ["haftpflicht","freistellungsbescheinigung","gewerbeanmeldung"] },
  { id: "Minimal",  name: "Minimal",  items: ["haftpflicht","freistellungsbescheinigung"] },
  { id: "Erweitert",name: "Erweitert",items: ["haftpflicht","freistellungsbescheinigung","gewerbeanmeldung","unbedenklichkeitsbescheinigung"] },
];

export default function PackageWizard(){
  const navigate = useNavigate();
  const { projectId, subId } = useParams();
  const [selected, setSelected] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  async function onConfirm(){
    if (!selected || !subId) return;
    setSubmitting(true);
    try{
      await seedDocumentsForContractor(subId, selected);
      // Zurück zur Detailseite des Nachunternehmers
      navigate(ROUTES.contractor(subId), { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Dokumentenpaket wählen</h1>
      <p className="text-sm text-muted-foreground">
        Projekt: {projectId ?? "demo-project"} · Nachunternehmer: {subId}
      </p>
      <div className="space-y-2">
        {PACKAGES.map(p => (
          <label key={p.id} className="flex items-start gap-3 p-3 rounded-lg border">
            <input
              type="radio"
              name="package"
              value={p.id}
              checked={selected === p.id}
              onChange={() => setSelected(p.id)}
            />
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-muted-foreground">
                {p.items.join(", ")}
              </div>
            </div>
          </label>
        ))}
      </div>
      <div className="flex gap-3">
        <button className="btn btn-outline" onClick={() => navigate(-1)}>Abbrechen</button>
        <button
          className="btn btn-primary"
          disabled={!selected || submitting}
          onClick={onConfirm}
        >
          {submitting ? "Speichere…" : "Paket zuweisen"}
        </button>
      </div>
    </div>
  );
}