import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold" data-testid="text-forgot-success-title">Email envoyé</h2>
            <p className="text-muted-foreground" data-testid="text-forgot-success-description">
              Si un compte existe avec l'adresse <strong>{email}</strong>, 
              vous recevrez un lien de réinitialisation par email.
            </p>
            <Link href="/login">
              <Button className="w-full mt-4" data-testid="button-back-to-login">
                Retour à la connexion
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-primary p-2 rounded-lg">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">ClinicFlow</span>
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-forgot-title">Mot de passe oublié</CardTitle>
          <CardDescription data-testid="text-forgot-description">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                data-testid="input-email"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center" data-testid="text-forgot-error">
                {error}
              </p>
            )}

            <Button 
              type="submit"
              className="w-full h-12 text-base rounded-xl bg-primary shadow-lg shadow-blue-500/20 transition-all"
              disabled={isSubmitting}
              data-testid="button-forgot-submit"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Envoyer le lien"
              )}
            </Button>

            <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-primary hover:underline" data-testid="link-back-login">
              <ArrowLeft className="h-3 w-3" />
              Retour à la connexion
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
