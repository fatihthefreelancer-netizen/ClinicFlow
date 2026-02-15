import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function Login() {
  const { isAuthenticated, isLoading, login, isLoggingIn, loginError } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <div className="md:w-1/2 bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/10 z-0"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary p-2 rounded-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold">ClinicFlow</h1>
          </div>
          
          <div className="space-y-6 max-w-md">
            <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight">
              Gestion de votre clinique simplifiée.
            </h2>
            <p className="text-slate-400 text-lg">
              Suivi des patients en temps réel, synchronisation instantanée et analyses pour votre clinique.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex gap-8 text-sm text-slate-500 font-medium flex-wrap">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Accès Sécurisé
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Temps Réel
          </div>
        </div>
      </div>

      <div className="md:w-1/2 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl font-bold" data-testid="text-login-title">Connexion</CardTitle>
            <CardDescription data-testid="text-login-description">Connectez-vous pour accéder à votre espace</CardDescription>
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
              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe"
                    required
                    className="pr-10"
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              {loginError && (
                <p className="text-sm text-red-500 text-center" data-testid="text-login-error">
                  {loginError}
                </p>
              )}

              <Button 
                type="submit"
                className="w-full h-12 text-base rounded-xl bg-primary shadow-lg shadow-blue-500/20 transition-all"
                disabled={isLoggingIn}
                data-testid="button-login-submit"
              >
                {isLoggingIn ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Se connecter"
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <Link href="/forgot-password" className="text-primary hover:underline" data-testid="link-forgot-password">
                  Mot de passe oublié ?
                </Link>
                <Link href="/signup" className="text-primary hover:underline" data-testid="link-signup">
                  Créer un compte
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
