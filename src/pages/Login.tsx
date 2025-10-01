import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, UserPlus, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const featureHighlights = [
  "Real-time balance tracking across every cashbook",
  "Insightful reports without juggling spreadsheets",
  "Secure multi-device sync powered by Supabase",
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }

    setIsLoading(false);
  };

  const toggleAuthMode = () => setIsSignUp((prev) => !prev);

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-primary/90 to-primary" />
          <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-white/80">
                <CheckCircle2 className="h-4 w-4" />
                Coinflow
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-white">Stay ahead of your cash flow.</h1>
              <p className="max-w-md text-base text-white/90">Consolidate personal and business finances, understand trends, and act faster with a single source of truth.</p>
            </div>
            <div className="space-y-4">
              {featureHighlights.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl bg-white/15 p-4 backdrop-blur">
                  <span className="rounded-full bg-white/30 p-1 text-slate-900">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-medium text-white">{item}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/75">Tip: you can switch between light and dark themes from the dashboard at any time.</p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-12 sm:px-8">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-3 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3">
                <picture>
                  <img src="/logo.svg" alt="Coinflow logo" className="h-12 w-12" />
                </picture>
                <p className="text-sm font-semibold text-primary">Coinflow</p>
              </div>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">{isSignUp ? "Create your account" : "Welcome back"}</h2>
              <p className="text-sm text-foreground/85 sm:text-base">
                {isSignUp
                  ? "Sign up to start tracking your cash flow in minutes."
                  : "Sign in to continue managing your cashbooks."}
              </p>
            </div>

            <Card className="border border-border/70 shadow-lg shadow-primary/5">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardDescription className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                      {isSignUp ? "Create account" : "Sign in"}
                    </CardDescription>
                    <CardTitle className="text-2xl text-foreground">{isSignUp ? "Join Coinflow" : "Sign in to Coinflow"}</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary hover:text-primary"
                    onClick={toggleAuthMode}
                    type="button"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {isSignUp ? "Sign in instead" : "Create account"}
                  </Button>
                </div>
                <p className="text-sm text-foreground/75">
                  {isSignUp
                    ? "Use a work or personal email address and a secure password to get started."
                    : "Enter your credentials to access your cashbooks and reports."}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter a secure password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full text-base font-semibold" disabled={isLoading}>
                    {isLoading
                      ? isSignUp
                        ? "Creating account..."
                        : "Signing in..."
                      : isSignUp
                        ? "Create account"
                        : "Sign in"}
                  </Button>
                </form>
                <p className="mt-6 text-center text-xs text-foreground/70">By continuing you agree to keep your workspace secure.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
