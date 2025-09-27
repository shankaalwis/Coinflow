import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState({
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    type: "ALL",
    cashbook: "ALL",
  });

  const [reportGenerated, setReportGenerated] = useState(false);

  // Mock report data
  const mockReportData = {
    summary: {
      totalCashIn: 5200.00,
      totalCashOut: 2850.00,
      netBalance: 2350.00,
    },
    transactions: [
      {
        id: "1",
        date: "2024-01-15",
        description: "Salary payment",
        cashbook: "Personal",
        category: "Salary",
        mode: "Bank Transfer",
        type: "CASH_IN",
        amount: 3500.00,
      },
      {
        id: "2",
        date: "2024-01-14", 
        description: "Grocery shopping",
        cashbook: "Personal",
        category: "Groceries",
        mode: "Card",
        type: "CASH_OUT",
        amount: 850.00,
      },
    ],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleGenerateReport = () => {
    setReportGenerated(true);
    toast({
      title: "Report generated",
      description: "Your financial report has been generated successfully.",
    });
  };

  const handleExport = (format: string) => {
    toast({
      title: "Export started",
      description: `Your report is being exported as ${format.toUpperCase()}. Download will start shortly.`,
    });
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
                <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
                <p className="text-sm text-muted-foreground">Generate and export your financial data</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filter Controls */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({...prev, startDate: e.target.value}))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({...prev, endDate: e.target.value}))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Transaction Type</Label>
                <Select 
                  value={filters.type} 
                  onValueChange={(value) => setFilters(prev => ({...prev, type: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Transactions</SelectItem>
                    <SelectItem value="CASH_IN">Cash In Only</SelectItem>
                    <SelectItem value="CASH_OUT">Cash Out Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cashbook">Cashbook</Label>
                <Select 
                  value={filters.cashbook} 
                  onValueChange={(value) => setFilters(prev => ({...prev, cashbook: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Cashbooks</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={handleGenerateReport}>
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        {reportGenerated && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Cash In</p>
                      <p className="text-2xl font-bold text-income">
                        {formatCurrency(mockReportData.summary.totalCashIn)}
                      </p>
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
                      <p className="text-2xl font-bold text-expense">
                        {formatCurrency(mockReportData.summary.totalCashOut)}
                      </p>
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
                      <p className="text-sm text-muted-foreground">Net Balance</p>
                      <p className={`text-2xl font-bold ${
                        mockReportData.summary.netBalance >= 0 ? 'text-income' : 'text-expense'
                      }`}>
                        {formatCurrency(mockReportData.summary.netBalance)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-primary">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Buttons */}
            <Card className="shadow-card mb-8">
              <CardHeader>
                <CardTitle>Export Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => handleExport('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('xlsx')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as XLSX
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('pdf')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cashbook</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead className="text-right">Cash In</TableHead>
                      <TableHead className="text-right">Cash Out</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReportData.transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.date}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.cashbook}</TableCell>
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
          </>
        )}
      </main>
    </div>
  );
};

export default Reports;