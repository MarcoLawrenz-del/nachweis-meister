import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/ROUTES";

export default function RouteNotFound() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-2">Seite nicht gefunden</h1>
      <p className="mb-4">Der angeforderte Pfad existiert nicht.</p>
      <Link className="underline" to={ROUTES.dashboard}>Zurück zum Dashboard</Link>
    </div>
  );
}