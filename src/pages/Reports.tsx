import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCashbookContext } from "@/context/CashbookContext";
import { ThemeToggle } from "@/components/theme-toggle";
import jsPDF from "jspdf";

type ReportFilters = {
  startDate: string;
  endDate: string;
  type: "ALL" | "CASH_IN" | "CASH_OUT";
  cashbook: "ALL" | string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { transactions, cashbooks } = useCashbookContext();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: startOfMonth,
    endDate: endOfMonth,
    type: "ALL",
    cashbook: "ALL",
  });

  const [reportGenerated, setReportGenerated] = useState(false);

  const filteredTransactions = useMemo(() => {
    if (!transactions.length) {
      return [];
    }

    const start = filters.startDate ? new Date(filters.startDate) : null;
    const end = filters.endDate ? new Date(filters.endDate) : null;

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);

      const matchesStart = start ? transactionDate >= start : true;
      const matchesEnd = end ? transactionDate <= new Date(end.getTime() + 24 * 60 * 60 * 1000) : true;
      const matchesType = filters.type === "ALL" || transaction.type === filters.type;
      const matchesCashbook = filters.cashbook === "ALL" || transaction.cashbookId === filters.cashbook;

      return matchesStart && matchesEnd && matchesType && matchesCashbook;
    });
  }, [transactions, filters]);

  const cashbookNames = useMemo(() => {
    const index = new Map<string, string>();
    cashbooks.forEach((cashbook) => index.set(cashbook.id, cashbook.name));
    return index;
  }, [cashbooks]);

  const summary = useMemo(() => {
    const totalCashIn = filteredTransactions
      .filter((transaction) => transaction.type === "CASH_IN")
      .reduce((total, transaction) => total + transaction.amount, 0);

    const totalCashOut = filteredTransactions
      .filter((transaction) => transaction.type === "CASH_OUT")
      .reduce((total, transaction) => total + transaction.amount, 0);

    return {
      totalCashIn,
      totalCashOut,
      netBalance: totalCashIn - totalCashOut,
    };
  }, [filteredTransactions]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  const handleGenerateReport = () => {
    if (!filteredTransactions.length) {
      toast({
        title: "No data",
        description: "No transactions match your filters. Adjust the range and try again.",
      });
      setReportGenerated(false);
      return;
    }

    setReportGenerated(true);
    toast({
      title: "Report generated",
      description: "Your financial report is ready to review and export.",
    });
  };

  const exportAsCsv = () => {
    const header = ["Date", "Description", "Cashbook", "Category", "Mode", "Type", "Amount"];
    const rows = filteredTransactions.map((transaction) => [
      new Date(transaction.date).toISOString(),
      transaction.description,
      cashbookNames.get(transaction.cashbookId) ?? "Unnamed",
      transaction.category,
      transaction.mode,
      transaction.type === "CASH_IN" ? "Cash In" : "Cash Out",
      transaction.amount.toFixed(2),
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((value) => JSON.stringify(value ?? "")).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    return { blob, extension: "csv", mime: "text/csv" };
  };

  const exportAsSpreadsheet = () => {
    const header = ["Date", "Description", "Cashbook", "Category", "Mode", "Type", "Amount"];
    const rows = filteredTransactions
      .map((transaction) => `
        <tr>
          <td>${escapeHtml(new Date(transaction.date).toISOString())}</td>
          <td>${escapeHtml(transaction.description)}</td>
          <td>${escapeHtml(cashbookNames.get(transaction.cashbookId) ?? "Unnamed")}</td>
          <td>${escapeHtml(transaction.category)}</td>
          <td>${escapeHtml(transaction.mode)}</td>
          <td>${transaction.type === "CASH_IN" ? "Cash In" : "Cash Out"}</td>
          <td>${transaction.amount.toFixed(2)}</td>
        </tr>
      `)
      .join("");

    const table = `
      <table>
        <thead>
          <tr>${header.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    const blob = new Blob([`\uFEFF${table}`], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    return { blob, extension: "xls", mime: "application/vnd.ms-excel" };
  };

  const exportAsPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const marginLeft = 40;
    let cursorY = 60;

    doc.setFontSize(18);
    doc.text("SmartCash Ledger Report", marginLeft, cursorY);
    cursorY += 20;

    doc.setFontSize(12);
    doc.text(
      `Period: ${filters.startDate || "-"} to ${filters.endDate || "-"}`,
      marginLeft,
      cursorY,
    );
    cursorY += 16;

    doc.text(
      `Cashbook: ${filters.cashbook === "ALL" ? "All" : cashbookNames.get(filters.cashbook) ?? "Unnamed"}`,
      marginLeft,
      cursorY,
    );
    cursorY += 16;
    doc.text(
      `Type: ${filters.type === "ALL" ? "All" : filters.type === "CASH_IN" ? "Cash In" : "Cash Out"}`,
      marginLeft,
      cursorY,
    );
    cursorY += 24;

    doc.setFontSize(12);
    doc.text(`Total Cash In: ${formatCurrency(summary.totalCashIn)}`, marginLeft, cursorY);
    cursorY += 16;
    doc.text(`Total Cash Out: ${formatCurrency(summary.totalCashOut)}`, marginLeft, cursorY);
    cursorY += 16;
    doc.text(`Net Balance: ${formatCurrency(summary.netBalance)}`, marginLeft, cursorY);
    cursorY += 24;

    doc.setFontSize(11);
    doc.text("Transactions", marginLeft, cursorY);
    cursorY += 14;

    filteredTransactions.forEach((transaction) => {
      if (cursorY > 760) {
        doc.addPage();
        cursorY = 60;
      }

      doc.text(
        `${new Date(transaction.date).toLocaleDateString()} - ${cashbookNames.get(transaction.cashbookId) ?? "Unnamed"}`,
        marginLeft,
        cursorY,
      );
      cursorY += 14;
      doc.text(
        `${transaction.type === "CASH_IN" ? "Cash In" : "Cash Out"} - ${formatCurrency(transaction.amount)} - ${transaction.mode}`,
        marginLeft,
        cursorY,
      );
      cursorY += 14;
      doc.text(transaction.description, marginLeft, cursorY);
      cursorY += 20;
    });

    const blob = doc.output("blob");
    return { blob, extension: "pdf", mime: "application/pdf" };
  };

  const handleExport = (format: "csv" | "xlsx" | "pdf") => {
    if (!reportGenerated || !filteredTransactions.length) {
      toast({
        title: "Generate report first",
        description: "Create the report before exporting.",
      });
      return;
    }

    const exporters = {
      csv: exportAsCsv,
      xlsx: exportAsSpreadsheet,
      pdf: exportAsPdf,
    } as const;

    const { blob, extension, mime } = exporters[format]();
    const timestamp = new Date().toISOString().split("T")[0];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `smartcash-report-${timestamp}.${extension}`;
    link.type = mime;
    link.click();
    URL.revokeObjectURL(link.href);

    toast({
      title: "Export complete",
      description: `Report saved as ${extension.toUpperCase()}.`,
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
            <ThemeToggle />
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
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Transaction Type</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, type: value as ReportFilters["type"] }))
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="CASH_IN">Cash In</SelectItem>
                    <SelectItem value="CASH_OUT">Cash Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cashbook">Cashbook</Label>
                <Select
                  value={filters.cashbook}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, cashbook: value as ReportFilters["cashbook"] }))
                  }
                >
                  <SelectTrigger id="cashbook">
                    <SelectValue placeholder="All Cashbooks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Cashbooks</SelectItem>
                    {cashbooks.map((cashbook) => (
                      <SelectItem key={cashbook.id} value={cashbook.id}>
                        {cashbook.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={handleGenerateReport}>Generate Report</Button>
            </div>
          </CardContent>
        </Card>

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
                        {formatCurrency(summary.totalCashIn)}
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
                        {formatCurrency(summary.totalCashOut)}
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
                        summary.netBalance >= 0 ? "text-income" : "text-expense"
                      }`}>
                        {formatCurrency(summary.netBalance)}
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
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" onClick={() => handleExport("csv")}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>
                  <Button variant="outline" onClick={() => handleExport("xlsx")}>
                    <Download className="h-4 w-4 mr-2" />
                    Export as XLSX
                  </Button>
                  <Button variant="outline" onClick={() => handleExport("pdf")}>
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
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{cashbookNames.get(transaction.cashbookId) ?? "Unnamed"}</TableCell>
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
