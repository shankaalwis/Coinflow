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
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-secondary" />
          <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white">
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-white/70">Coinflow</span>
              <h1 className="mt-8 text-4xl font-bold leading-tight">Stay ahead of your cash flow.</h1>
              <p className="mt-4 max-w-md text-lg text-white/85">Consolidate personal and business finances, understand trends, and act faster with a single source of truth.</p>
            </div>
            <div className="space-y-4">
              {featureHighlights.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="rounded-full bg-white/20 p-1">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <p className="text-white/85">{item}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/60">Tip: you can switch between light and dark themes from the dashboard at any time.</p>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-md space-y-8">
            <div>
              <p className="text-sm font-medium text-primary">Coinflow</p>
              <h2 className="mt-2 text-3xl font-bold text-foreground">{isSignUp ? "Create your account" : "Welcome back"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isSignUp
                  ? "Sign up to start tracking your cash flow in minutes."
                  : "Sign in to continue managing your cashbooks."}
              </p>
            </div>

            <Card className="border border-border/60 shadow-xl">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardDescription className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                      {isSignUp ? "Create account" : "Sign in"}
                    </CardDescription>
                    <CardTitle className="text-2xl">{isSignUp ? "Join Coinflow" : "Sign in to Coinflow"}</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary" onClick={toggleAuthMode} type="button">
                    <UserPlus className="mr-2 h-4 w-4" />
                    {isSignUp ? "Sign in instead" : "Create account"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading
                      ? isSignUp
                        ? "Creating account..."
                        : "Signing in..."
                      : isSignUp
                        ? "Create account"
                        : "Sign in"}
                  </Button>
                </form>
                <p className="mt-6 text-center text-xs text-muted-foreground">By continuing you agree to keep your workspace secure.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
