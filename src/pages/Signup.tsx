import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // If email confirmation is disabled in Supabase, session is available immediately
    if (data.session) {
      navigate("/app");
    } else {
      setSuccess(true);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app` },
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[hsl(248_20%_8%)] flex flex-col items-center justify-center px-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-accent mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Check your inbox</h1>
        <p className="text-white/50 max-w-xs">
          We sent a confirmation link to <span className="text-white">{email}</span>.
          Click it to activate your account and start playing.
        </p>
        <Link to="/login" className="mt-6 text-sm text-primary hover:text-primary/80 transition-colors">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(248_20%_8%)] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 font-bold text-white mb-10">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-black text-white">
          FPL
        </span>
        <span className="text-lg">FPLedge</span>
      </Link>

      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/4 p-8">
        <h1 className="text-xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-sm text-white/40 mb-6">Free to start — no card needed</p>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2.5 text-sm mb-5">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-white/70 text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/6 border-white/12 text-white placeholder:text-white/25 focus-visible:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-white/70 text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/6 border-white/12 text-white placeholder:text-white/25 focus-visible:ring-primary"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-10 mt-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <Separator className="flex-1 bg-white/10" />
          <span className="text-xs text-white/30">or</span>
          <Separator className="flex-1 bg-white/10" />
        </div>

        <Button
          variant="outline"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          className="w-full border-white/15 bg-white/6 text-white hover:bg-white/12 h-10"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        <p className="text-center text-sm text-white/40 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Log in
          </Link>
        </p>
      </div>

      <p className="mt-6 text-xs text-white/20 text-center max-w-xs">
        By signing up you agree to our{" "}
        <a href="#" className="underline hover:text-white/40">Terms</a> and{" "}
        <a href="#" className="underline hover:text-white/40">Privacy Policy</a>.
      </p>
    </div>
  );
}
