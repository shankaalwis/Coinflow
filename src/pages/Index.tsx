import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-primary px-4 py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center text-white space-y-10">
        <div className="space-y-4">
          <picture className="mx-auto flex justify-center">
            <img src="/logo.svg" alt="Coinflow logo" className="h-16 w-16" />
          </picture>
          <p className="text-sm uppercase tracking-[0.35em] text-white/70">Coinflow</p>
          <h1 className="text-5xl font-bold leading-tight">Your cash flow, organised.</h1>
          <p className="text-lg text-white/85">A modern financial cockpit for tracking cash across every account you care about.</p>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
            onClick={() => navigate("/login")}
          >
            Get started
          </Button>
          <Button
            variant="ghost"
            className="text-white/90 hover:bg-white/10"
            onClick={() => navigate("/login")}
          >
            Already use Coinflow? Sign in
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
