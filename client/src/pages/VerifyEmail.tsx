import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";

export default function VerifyEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");

    if (type === "signup" || type === "email") {
      setStatus("success");
      setMessage("Email vérifié avec succès. Vous pouvez maintenant vous connecter.");
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      const errorDescription = searchParams.get("error_description");
      
      if (errorDescription) {
        setStatus("error");
        setMessage(errorDescription);
      } else {
        setStatus("success");
        setMessage("Email vérifié avec succès. Vous pouvez maintenant vous connecter.");
      }
    }
  }, []);

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
