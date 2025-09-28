import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="text-center text-white">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
            <TrendingUp className="h-12 w-12" />
          </div>
        </div>

        <h1 className="text-5xl font-bold mb-4">Coinflow</h1>
        <p className="text-xl text-white/90 mb-8 max-w-md mx-auto">
          A modern financial cockpit for tracking cash flow across your personal and business accounts.
        </p>

        <div className="space-y-4">
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
            onClick={() => navigate("/login")}
          >
            Get Started
          </Button>

          <div className="text-white/80 text-sm">
            Already have an account? <button
              className="underline font-medium text-white"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
