import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, TrendingUp, LogOut, Wallet, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data - replace with real API calls
const mockCashbooks = [
  {
    id: "1",
    name: "Personal",
    balance: 2450.75,
    lastActivity: "Today",
  },
  {
    id: "2", 
    name: "Business",
    balance: 8920.50,
    lastActivity: "2 days ago",
  },
];

const Dashboard = () => {
  const [cashbookName, setCashbookName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateCashbook = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashbookName.trim()) {
      toast({
        title: "Cashbook created",
        description: `"${cashbookName}" has been created successfully.`,
      });
      setCashbookName("");
      setIsDialogOpen(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleLogout = () => {
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">SmartCash Ledger</h1>
                <p className="text-sm text-muted-foreground">Financial Management Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/reports")}>
                Reports
              </Button>
              <Button variant="outline" onClick={() => navigate("/settings")}>
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Your Cashbooks</h2>
            <p className="text-muted-foreground">Manage your financial accounts</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Cashbook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Cashbook</DialogTitle>
                <DialogDescription>
                  Create a new cashbook to organize your financial transactions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCashbook} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Cashbook Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Personal, Business, Savings"
                    value={cashbookName}
                    onChange={(e) => setCashbookName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Cashbook</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cashbooks Grid */}
        {mockCashbooks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cashbooks yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first cashbook to start tracking your finances.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Cashbook
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockCashbooks.map((cashbook) => (
              <Card 
                key={cashbook.id} 
                className="shadow-card hover:shadow-elevated transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/cashbook/${cashbook.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{cashbook.name}</CardTitle>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                      <p className={`text-3xl font-bold ${
                        cashbook.balance >= 0 ? 'text-income' : 'text-expense'
                      }`}>
                        {formatCurrency(cashbook.balance)}
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Last activity: {cashbook.lastActivity}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {mockCashbooks.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-6">Quick Overview</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Balance</p>
                      <p className="text-2xl font-bold text-balance">
                        {formatCurrency(mockCashbooks.reduce((sum, cb) => sum + cb.balance, 0))}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-primary">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Cashbooks</p>
                      <p className="text-2xl font-bold text-foreground">{mockCashbooks.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-income">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold text-income">+$1,240</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-expense">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;