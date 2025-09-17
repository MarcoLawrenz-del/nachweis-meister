import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/auth/AuthContext";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const { loginWithPassword, isAuthenticated } = useAuthContext();
  const nav = useNavigate();
  const location = useLocation() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      nav("/app", { replace: true });
    }
  }, [isAuthenticated, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await loginWithPassword(email.trim(), password);
      const to = location.state?.from?.pathname || "/app";
      nav(to, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anmeldung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
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
                placeholder="demo@subfix.app"
                className="w-full outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Passwort</label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border px-3 py-2">
              <Lock className="h-4 w-4 text-neutral-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ihr Passwort"
                className="w-full outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-600 text-white py-2.5 font-medium hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Anmelden..." : "Anmelden"}
          </button>

          <div className="text-xs text-neutral-500 text-center space-y-1">
            <p><strong>Demo-Zugang:</strong></p>
            <p>demo@subfix.app / Subfix!2024</p>
            <p className="mt-2">Demo-Login speichert den Nutzer lokal im Browser.</p>
          </div>
        </form>
      </div>
    </div>
  );
}