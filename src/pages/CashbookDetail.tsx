import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Download,
  Pencil,
  Trash2,
  BarChart3,
  Wallet, Settings as SettingsIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCashbookContext } from "@/context/CashbookContext";
import { ThemeToggle } from "@/components/theme-toggle";

type TransactionFormState = {
  type: "CASH_IN" | "CASH_OUT";
  amount: string;
  description: string;
  category: string;
  mode: string;
  date: string;
};

type DialogMode = "create" | "edit";

type PendingDeletion = {
  id: string;
  description: string;
};

const CashbookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    getCashbookById,
    getTransactionsForCashbook,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    categories,
    paymentModes,
  } = useCashbookContext();

  const cashbook = id ? getCashbookById(id) : undefined;

  const transactions = useMemo(
    () => (id ? getTransactionsForCashbook(id) : []),
    [getTransactionsForCashbook, id],
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionForm, setTransactionForm] = useState<TransactionFormState>(() => ({
    type: "CASH_IN",
    amount: "",
    description: "",
    category: categories[0]?.name ?? "",
    mode: paymentModes[0]?.name ?? "",
    date: new Date().toISOString().slice(0, 16),
  }));
  const [transactionToDelete, setTransactionToDelete] = useState<PendingDeletion | null>(null);

  useEffect(() => {
    setTransactionForm((prev) => ({
      ...prev,
      category: prev.category || categories[0]?.name || "",
      mode: prev.mode || paymentModes[0]?.name || "",
    }));
  }, [categories, paymentModes]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return transactions;
    }

    return transactions.filter((transaction) => {
      const haystack = `${transaction.description} ${transaction.category} ${transaction.mode}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [transactions, searchQuery]);

  const cashInTotal = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.type === "CASH_IN")
        .reduce((total, transaction) => total + transaction.amount, 0),
    [transactions],
  );

  const cashOutTotal = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.type === "CASH_OUT")
        .reduce((total, transaction) => total + transaction.amount, 0),
    [transactions],
  );

  const netCashFlow = useMemo(() => cashInTotal - cashOutTotal, [cashInTotal, cashOutTotal]);

  const lastActivityLabel = () => {
    if (!cashbook?.lastActivity) {
      return "No activity yet";
    }

    const parsed = new Date(cashbook.lastActivity);
    if (Number.isNaN(parsed.getTime())) {
      return "No activity yet";
    }

    return formatDistanceToNow(parsed, { addSuffix: true });
  };

  const resetForm = () => {
    setTransactionForm({
      type: "CASH_IN",
      amount: "",
      description: "",
      category: categories[0]?.name ?? "",
      mode: paymentModes[0]?.name ?? "",
      date: new Date().toISOString().slice(0, 16),
    });
    setEditingTransactionId(null);
    setDialogMode("create");
  };

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cashbook) {
      toast({ title: "Cashbook not found", description: "Please select a valid cashbook." });
      return;
    }

    const amountValue = Number(transactionForm.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast({ title: "Invalid amount", description: "Enter an amount greater than zero." });
      return;
    }

    const isoDate = new Date(transactionForm.date).toISOString();

    if (dialogMode === "edit" && editingTransactionId) {
      updateTransaction(editingTransactionId, {
        type: transactionForm.type,
        amount: amountValue,
        description: transactionForm.description.trim(),
        category: transactionForm.category,
        mode: transactionForm.mode,
        date: isoDate,
      });
      toast({
        title: "Transaction updated",
        description: `${transactionForm.type === "CASH_IN" ? "Income" : "Expense"} updated successfully.`,
      });
    } else {
      addTransaction(cashbook.id, {
        type: transactionForm.type,
        amount: amountValue,
        description: transactionForm.description.trim(),
        category: transactionForm.category,
        mode: transactionForm.mode,
        date: isoDate,
      });
      toast({
        title: "Transaction added",
        description: `${transactionForm.type === "CASH_IN" ? "Income" : "Expense"} of ${formatCurrency(amountValue)} recorded for "${cashbook.name}".`,
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEditTransaction = (transactionId: string) => {
    const transaction = transactions.find((item) => item.id === transactionId);
    if (!transaction) {
      return;
    }

    setEditingTransactionId(transaction.id);
    setDialogMode("edit");
    setTransactionForm({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category,
      mode: transaction.mode,
      date: new Date(transaction.date).toISOString().slice(0, 16),
    });
    setIsDialogOpen(true);
  };

  const handleExportTransactions = () => {
    if (!cashbook) {
      return;
    }

    if (transactions.length === 0) {
      toast({ title: "No data", description: "Add a transaction before exporting." });
      return;
    }

    const header = ["Date", "Type", "Description", "Category", "Mode", "Amount"];
    const rows = transactions.map((transaction) => [
      new Date(transaction.date).toISOString(),
      transaction.type === "CASH_IN" ? "Cash In" : "Cash Out",
      transaction.description,
      transaction.category,
      transaction.mode,
      transaction.amount.toFixed(2),
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((value) => JSON.stringify(value ?? "")).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = cashbook.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    link.href = url;
    link.download = `${safeName || "cashbook"}-transactions.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!cashbook) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md shadow-card text-center">
          <CardHeader>
            <CardTitle>Cashbook not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              The cashbook you are trying to view does not exist or was removed.
            </p>
            <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{cashbook.name}</h1>
                <p className="text-sm text-muted-foreground">Cashbook Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/account")}>
                <SettingsIcon className="h-4 w-4 mr-2" />
                Account
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
                  <p className={`text-4xl font-bold ${cashbook.balance >= 0 ? "text-income" : "text-expense"}`}>
                    {formatCurrency(cashbook.balance)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Updated {lastActivityLabel()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={handleExportTransactions}>
                    <Download className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                  <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (!open) {
                        resetForm();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="lg"
                        className="gap-2"
                        onClick={() => {
                          setDialogMode("create");
                          resetForm();
                        }}
                      >
                        <Plus className="h-5 w-5" />
                        Add Transaction
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl sm:max-w-5xl">
                      <DialogHeader>
                        <DialogTitle>
                          {dialogMode === "edit" ? "Update Transaction" : "Add New Transaction"}
                        </DialogTitle>
                        <DialogDescription>
                          Record income or expense activity for this cashbook.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
                        <div className="rounded-lg border bg-muted/40 p-3 md:p-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-gradient-primary/80 p-3">
                              <BarChart3 className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Net position after save</p>
                              <p className="text-lg font-semibold">
                                {formatCurrency(
                                  dialogMode === "edit"
                                    ? cashbook.balance
                                    : transactionForm.type === "CASH_IN"
                                    ? cashbook.balance + Number(transactionForm.amount || "0")
                                    : cashbook.balance - Number(transactionForm.amount || "0"),
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="rounded-lg border bg-background p-3">
                              <p className="text-xs text-muted-foreground">Total Cash In</p>
                              <p className="text-base font-semibold text-income">{formatCurrency(cashInTotal)}</p>
                            </div>
                            <div className="rounded-lg border bg-background p-3">
                              <p className="text-xs text-muted-foreground">Total Cash Out</p>
                              <p className="text-base font-semibold text-expense">{formatCurrency(cashOutTotal)}</p>
                            </div>
                          </div>
                        </div>
                        <form onSubmit={handleSubmitTransaction} className="space-y-3">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="type">Transaction Type</Label>
                              <Select
                                value={transactionForm.type}
                                onValueChange={(value) =>
                                  setTransactionForm((prev) => ({ ...prev, type: value as TransactionFormState["type"] }))
                                }
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CASH_IN">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-income" />
                                      Cash In (Income)
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="CASH_OUT">
                                    <div className="flex items-center gap-2">
                                      <TrendingDown className="h-4 w-4 text-expense" />
                                      Cash Out (Expense)
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="amount">Amount</Label>
                              <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={transactionForm.amount}
                                onChange={(e) =>
                                  setTransactionForm((prev) => ({ ...prev, amount: e.target.value }))
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              placeholder="Transaction description"
                              value={transactionForm.description}
                              onChange={(e) =>
                                setTransactionForm((prev) => ({ ...prev, description: e.target.value }))
                              }
                              required
                            />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="category">Category</Label>
                              <Select
                                value={transactionForm.category}
                                onValueChange={(value) =>
                                  setTransactionForm((prev) => ({ ...prev, category: value }))
                                }
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.name}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="mode">Payment Mode</Label>
                              <Select
                                value={transactionForm.mode}
                                onValueChange={(value) =>
                                  setTransactionForm((prev) => ({ ...prev, mode: value }))
                                }
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                  {paymentModes.map((mode) => (
                                    <SelectItem key={mode.id} value={mode.name}>
                                      {mode.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="date">Date & Time</Label>
                            <Input
                              id="date"
                              type="datetime-local"
                              value={transactionForm.date}
                              onChange={(e) =>
                                setTransactionForm((prev) => ({ ...prev, date: e.target.value }))
                              }
                              required
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsDialogOpen(false);
                                resetForm();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">
                              {dialogMode === "edit" ? "Save Changes" : "Add Transaction"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4">
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cash In</p>
                    <p className="text-2xl font-bold text-income">{formatCurrency(cashInTotal)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-income">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cash Out</p>
                    <p className="text-2xl font-bold text-expense">{formatCurrency(cashOutTotal)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-expense">
                    <TrendingDown className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                    <p className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-income" : "text-expense"}`}>
                      {formatCurrency(netCashFlow)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-primary">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transactions Section */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Cash In</TableHead>
                  <TableHead className="text-right">Cash Out</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {transactions.length === 0
                        ? "No transactions recorded yet. Start by adding one."
                        : "No transactions match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {formatDateTime(transaction.date)}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{transaction.mode}</TableCell>
                      <TableCell className="text-right">
                        {transaction.type === "CASH_IN" && (
                          <span className="font-semibold text-income">
                            {formatCurrency(transaction.amount)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.type === "CASH_OUT" && (
                          <span className="font-semibold text-expense">
                            {formatCurrency(transaction.amount)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit"
                            onClick={() => handleEditTransaction(transaction.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete"
                            onClick={() =>
                              setTransactionToDelete({ id: transaction.id, description: transaction.description })
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <AlertDialog
        open={!!transactionToDelete}
        onOpenChange={(open) => !open && setTransactionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{transactionToDelete?.description ?? ""}" from this cashbook permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (transactionToDelete) {
                  deleteTransaction(transactionToDelete.id);
                  toast({ title: "Transaction deleted", description: "The transaction has been removed." });
                  setTransactionToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CashbookDetail;


