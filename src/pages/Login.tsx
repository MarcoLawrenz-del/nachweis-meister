import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/auth/AuthContext";
import { Mail, LogIn } from "lucide-react";

export default function Login() {
  const { signIn } = useAuthContext();
  const nav = useNavigate();
  const location = useLocation() as any;
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email.trim(), name.trim() || undefined);
    const to = location.state?.from?.pathname || "/app";
    nav(to, { replace: true });
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <LogIn className="h-5 w-5 text-orange-600" />
          </div>
          <h1 className="text-xl font-semibold">Anmelden</h1>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium">E-Mail</label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border px-3 py-2">
              <Mail className="h-4 w-4 text-neutral-400" />
              <input
                type="email"
                placeholder="ich@firma.de"
                className="w-full outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Name (optional)</label>
            <input
              type="text"
              placeholder="Max Mustermann"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-orange-600 text-white py-2.5 font-medium hover:bg-orange-700 transition"
          >
            Weiter
          </button>

          <p className="text-xs text-neutral-500 text-center">
            Demo-Login speichert den Nutzer lokal im Browser.
          </p>
        </form>
      </div>
    </div>
  );
}