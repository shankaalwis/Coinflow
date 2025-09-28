import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Search, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCashbookContext } from "@/context/CashbookContext";

type TransactionFormState = {
  type: "CASH_IN" | "CASH_OUT";
  amount: string;
  description: string;
  category: string;
  mode: string;
  date: string;
};

const CashbookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    getCashbookById,
    getTransactionsForCashbook,
    addTransaction,
    categories,
    paymentModes,
  } = useCashbookContext();

  const cashbook = id ? getCashbookById(id) : undefined;

  const transactions = useMemo(
    () => (id ? getTransactionsForCashbook(id) : []),
    [getTransactionsForCashbook, id],
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionForm, setTransactionForm] = useState<TransactionFormState>(() => ({
    type: "CASH_IN",
    amount: "",
    description: "",
    category: categories[0]?.name ?? "",
    mode: paymentModes[0]?.name ?? "",
    date: new Date().toISOString().slice(0, 16),
  }));

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

    setTransactionForm({
      type: "CASH_IN",
      amount: "",
      description: "",
      category: categories[0]?.name ?? "",
      mode: paymentModes[0]?.name ?? "",
      date: new Date().toISOString().slice(0, 16),
    });
    setIsDialogOpen(false);
  };

  if (!cashbook) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md shadow-card text-center">
          <CardHeader>
            <CardTitle>Cashbook not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Balance Card */}
        <Card className="shadow-card mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
                <p
                  className={`text-4xl font-bold ${cashbook.balance >= 0 ? "text-income" : "text-expense"}`}
                >
                  {formatCurrency(cashbook.balance)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Updated {lastActivityLabel()}</p>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Plus className="h-5 w-5" />
                    Add Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Transaction</DialogTitle>
                    <DialogDescription>
                      Record a new income or expense transaction.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitTransaction} className="space-y-4">
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

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Add Transaction</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Summary Section */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Cash In</p>
              <p className="text-2xl font-bold text-income">{formatCurrency(cashInTotal)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Cash Out</p>
              <p className="text-2xl font-bold text-expense">{formatCurrency(cashOutTotal)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Net Cash Flow</p>
              <p
                className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-income" : "text-expense"}`}
              >
                {formatCurrency(netCashFlow)}
              </p>
            </CardContent>
          </Card>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CashbookDetail;
