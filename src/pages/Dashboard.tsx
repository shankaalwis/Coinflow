import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, TrendingUp, LogOut, Wallet, EllipsisVertical, Pencil, Trash2, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCashbookContext } from "@/context/CashbookContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";


const formatTransactionDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });





const Dashboard = () => {
  const [cashbookName, setCashbookName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCashbookId, setEditCashbookId] = useState<string | null>(null);
  const [editCashbookName, setEditCashbookName] = useState("");
  const [cashbookToDelete, setCashbookToDelete] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const { cashbooks, createCashbook, updateCashbook, deleteCashbook, transactions, primaryCurrency } = useCashbookContext();

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: primaryCurrency,
      }),
    [primaryCurrency],
  );

  const formatCurrency = useMemo(
    () => (amount: number) => currencyFormatter.format(amount),
    [currencyFormatter],
  );

  const hasCashbooks = cashbooks.length > 0;
  const transactionsByCashbook = useMemo(() => {
    const grouped = new Map<string, typeof transactions>();
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    sorted.forEach((transaction) => {
      if (!grouped.has(transaction.cashbookId)) {
        grouped.set(transaction.cashbookId, []);
      }
      grouped.get(transaction.cashbookId)!.push(transaction);
    });

    return grouped;
  }, [transactions]);

  const getLastActivityLabel = (isoDate: string | null) => {
    if (!isoDate) {
      return "No activity yet";
    }

    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return "No activity yet";
    }

    return formatDistanceToNow(date, { addSuffix: true });
  };

  const handleCreateCashbook = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = cashbookName.trim();

    if (trimmed) {
      const cashbook = createCashbook(trimmed);
      toast({
        title: "Cashbook created",
        description: `"${cashbook.name}" has been created successfully.`,
      });
      setCashbookName("");
      setIsCreateDialogOpen(false);
    }
  };

  const handleEditCashbook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCashbookId) {
      return;
    }

    const trimmed = editCashbookName.trim();
    if (!trimmed) {
      return;
    }

    updateCashbook(editCashbookId, { name: trimmed });
    toast({ title: "Cashbook updated", description: `Cashbook renamed to "${trimmed}".` });
    setIsEditDialogOpen(false);
    setEditCashbookId(null);
    setEditCashbookName("");
  };

  const handleConfirmDelete = () => {
    if (!cashbookToDelete) {
      return;
    }

    deleteCashbook(cashbookToDelete.id);
    toast({ title: "Cashbook removed", description: `"${cashbookToDelete.name}" has been deleted.` });
    setCashbookToDelete(null);
  };

  const handleLogout = async () => {
    const didSignOut = await signOut();
    if (didSignOut) {
      toast({ title: "Signed out", description: "You have been signed out of Coinflow." });
      navigate("/login", { replace: true });
    }
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
                <h1 className="text-2xl font-bold text-foreground">Coinflow</h1>
                <p className="text-sm text-muted-foreground">Financial Management Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={() => navigate("/reports")}>Reports</Button>
              <Button variant="outline" onClick={() => navigate("/settings")}>Settings</Button>
              <Button variant="outline" onClick={() => navigate("/account")}>
                <SettingsIcon className="h-4 w-4 mr-2" />
                Account
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

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Cashbook</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cashbooks Grid */}
        {hasCashbooks ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cashbooks.map((cashbook) => {
              const recentTransactions = transactionsByCashbook.get(cashbook.id)?.slice(0, 10) ?? [];

              return (
                <Card
                  key={cashbook.id}
                  className="shadow-card hover:shadow-elevated transition-all duration-200 group cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/cashbook/${cashbook.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/cashbook/${cashbook.id}`);
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-xl leading-tight">{cashbook.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Last activity: {getLastActivityLabel(cashbook.lastActivity)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditCashbookId(cashbook.id);
                              setEditCashbookName(cashbook.name);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(event) => {
                              event.stopPropagation();
                              setCashbookToDelete({ id: cashbook.id, name: cashbook.name });
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                        <p
                          className={`text-3xl font-bold ${
                            cashbook.balance >= 0 ? "text-income" : "text-expense"
                          }`}
                        >
                          {formatCurrency(cashbook.balance)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Recent Activity</p>
                        {recentTransactions.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">No transactions yet.</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {recentTransactions.map((transaction) => (
                              <li key={transaction.id} className="flex items-start justify-between gap-4 text-sm">
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate">
                                    {formatTransactionDate(transaction.date)} - {transaction.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {transaction.category} - {transaction.mode}
                                  </p>
                                </div>
                                <span
                                  className={`shrink-0 font-semibold ${
                                    transaction.type === "CASH_IN" ? "text-income" : "text-expense"
                                  }`}
                                >
                                  {transaction.type === "CASH_IN" ? "+" : "-"}
                                  {formatCurrency(transaction.amount)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cashbooks yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first cashbook to start tracking your finances.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Cashbook
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Cashbook</DialogTitle>
            <DialogDescription>
              Update the name shown across your dashboard and reports.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCashbook} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Cashbook Name</Label>
              <Input
                id="editName"
                value={editCashbookName}
                onChange={(e) => setEditCashbookName(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!cashbookToDelete} onOpenChange={(open) => !open && setCashbookToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete cashbook?</AlertDialogTitle>
            <AlertDialogDescription>
              This action removes the cashbook and all of its transactions. You cannot undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;







