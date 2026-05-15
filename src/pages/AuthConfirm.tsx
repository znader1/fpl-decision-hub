import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as "invite" | "signup" | "magiclink" | "recovery" | null;

    if (!token_hash || !type) {
      setError("Invalid confirmation link.");
      return;
    }

    supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
      if (error) {
        setError(error.message);
      } else {
        navigate("/app", { replace: true });
      }
    });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <p className="text-destructive font-medium">Link error: {error}</p>
          <a href="/auth" className="text-primary underline text-sm">Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground text-sm">Confirming your account…</p>
    </div>
  );
}
