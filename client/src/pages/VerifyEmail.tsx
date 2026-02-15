import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";

export default function VerifyEmail() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien de vérification invalide.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email vérifié avec succès.");
        } else {
          setStatus("error");
          setMessage(data.message || "Erreur de vérification.");
        }
      } catch {
        setStatus("error");
        setMessage("Erreur de vérification.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground" data-testid="text-verify-loading">Vérification en cours...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold" data-testid="text-verify-success-title">Email vérifié</h2>
              <p className="text-muted-foreground" data-testid="text-verify-success-description">{message}</p>
              <Link href="/login">
                <Button className="w-full mt-4" data-testid="button-goto-login">
                  Se connecter
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-red-600" data-testid="text-verify-error-title">Échec de la vérification</h2>
              <p className="text-muted-foreground" data-testid="text-verify-error-description">{message}</p>
              <Link href="/login">
                <Button className="w-full mt-4" data-testid="button-goto-login">
                  Retour à la connexion
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
