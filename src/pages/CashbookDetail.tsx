import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

// Mock data
const mockCashbook = {
  id: "1",
  name: "Personal",
  balance: 2450.75,
};

const mockTransactions = [
  {
    id: "1",
    type: "CASH_IN" as const,
    amount: 3500.00,
    description: "Salary payment",
    category: "Salary",
    mode: "Bank Transfer",
    date: "2024-01-15T10:30:00Z",
  },
  {
    id: "2", 
    type: "CASH_OUT" as const,
    amount: 850.00,
    description: "Grocery shopping",
    category: "Groceries",
    mode: "Card",
    date: "2024-01-14T16:45:00Z",
  },
  {
    id: "3",
    type: "CASH_OUT" as const,
    amount: 1200.00,
    description: "Monthly rent payment",
    category: "Rent",
    mode: "Bank Transfer", 
    date: "2024-01-01T09:00:00Z",
  },
];

const mockCategories = ["Salary", "Groceries", "Rent", "Utilities", "Entertainment"];
const mockModes = ["Cash", "Bank Transfer", "Card", "Digital Wallet"];

const CashbookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionForm, setTransactionForm] = useState({
    type: "",
    amount: "",
    description: "",
    category: "",
    mode: "",
    date: new Date().toISOString().slice(0, 16),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTransactions = mockTransactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Transaction added",
      description: `${transactionForm.type === 'CASH_IN' ? 'Income' : 'Expense'} of ${formatCurrency(Number(transactionForm.amount))} recorded.`,
    });
    setTransactionForm({
      type: "",
      amount: "",
      description: "",
      category: "",
      mode: "",
      date: new Date().toISOString().slice(0, 16),
    });
    setIsDialogOpen(false);
  };

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
                <h1 className="text-2xl font-bold text-foreground">{mockCashbook.name}</h1>
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
                <p className={`text-4xl font-bold ${
                  mockCashbook.balance >= 0 ? 'text-income' : 'text-expense'
                }`}>
                  {formatCurrency(mockCashbook.balance)}
                </p>
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
                        onValueChange={(value) => setTransactionForm(prev => ({...prev, type: value}))}
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
                        onChange={(e) => setTransactionForm(prev => ({...prev, amount: e.target.value}))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Transaction description"
                        value={transactionForm.description}
                        onChange={(e) => setTransactionForm(prev => ({...prev, description: e.target.value}))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={transactionForm.category} 
                        onValueChange={(value) => setTransactionForm(prev => ({...prev, category: value}))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mode">Payment Mode</Label>
                      <Select 
                        value={transactionForm.mode} 
                        onValueChange={(value) => setTransactionForm(prev => ({...prev, mode: value}))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockModes.map((mode) => (
                            <SelectItem key={mode} value={mode}>
                              {mode}
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
                        onChange={(e) => setTransactionForm(prev => ({...prev, date: e.target.value}))}
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
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {formatDateTime(transaction.date)}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.mode}</TableCell>
                    <TableCell className="text-right">
                      {transaction.type === 'CASH_IN' && (
                        <span className="font-semibold text-income">
                          {formatCurrency(transaction.amount)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.type === 'CASH_OUT' && (
                        <span className="font-semibold text-expense">
                          {formatCurrency(transaction.amount)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CashbookDetail;