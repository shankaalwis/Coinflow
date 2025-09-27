import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, TrendingUp, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SmartCash Ledger</h1>
          <p className="text-white/80">Your financial tracking companion</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elevated border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isSignUp ? "Create Account" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {isSignUp ? "Sign up for a new account" : "Sign in to your account to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading 
                  ? (isSignUp ? "Creating account..." : "Signing in...") 
                  : (isSignUp ? "Create Account" : "Sign in")
                }
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                className="text-sm"
                onClick={() => setIsSignUp(!isSignUp)}
                type="button"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;