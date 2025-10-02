import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Pencil, Trash2, Settings as SettingsIcon, Tag, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCashbookContext } from "@/context/CashbookContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const currencyOptions = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
  { code: "NZD", label: "New Zealand Dollar (NZD)" },
  { code: "SGD", label: "Singapore Dollar (SGD)" },
  { code: "CHF", label: "Swiss Franc (CHF)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
  { code: "CNY", label: "Chinese Yuan (CNY)" },
  { code: "HKD", label: "Hong Kong Dollar (HKD)" },
  { code: "INR", label: "Indian Rupee (INR)" },
  { code: "LKR", label: "Sri Lankan Rupee (LKR)" },
];

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    categories,
    paymentModes,
    addCategory,
    removeCategory,
    addPaymentMode,
    removePaymentMode,
    primaryCurrency,
    updatePrimaryCurrency,
  } = useCashbookContext();
  const { user } = useAuth();

  const [categoryName, setCategoryName] = useState("");
  const [modeName, setModeName] = useState("");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isModeDialogOpen, setIsModeDialogOpen] = useState(false);
  const [email, setEmail] = useState(user?.email ?? "");
  const [emailLoading, setEmailLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setEmail(user?.email ?? "");
  }, [user?.email]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryName.trim();
    if (!trimmed) {
      return;
    }

    const exists = categories.some((category) => category.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast({
        title: "Category exists",
        description: `"${trimmed}" is already in your categories.`,
      });
      return;
    }

    addCategory(trimmed);
    toast({
      title: "Category added",
      description: `"${trimmed}" has been added to your categories.`,
    });
    setCategoryName("");
    setIsCategoryDialogOpen(false);
  };

  const handleAddMode = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = modeName.trim();
    if (!trimmed) {
      return;
    }

    const exists = paymentModes.some((mode) => mode.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast({
        title: "Payment mode exists",
        description: `"${trimmed}" is already in your payment modes.`,
      });
      return;
    }

    addPaymentMode(trimmed);
    toast({
      title: "Payment mode added",
      description: `"${trimmed}" has been added to your payment modes.`,
    });
    setModeName("");
    setIsModeDialogOpen(false);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    removeCategory(id);
    toast({
      title: "Category deleted",
      description: `"${name}" has been removed from your categories.`,
    });
  };

  const handleDeleteMode = (id: string, name: string) => {
    removePaymentMode(id);
    toast({
      title: "Payment mode deleted",
      description: `"${name}" has been removed from your payment modes.`,
    });
  };

  const handleCurrencyChange = (value: string) => {
    updatePrimaryCurrency(value);
    const selection = currencyOptions.find((option) => option.code === value);
    toast({
      title: "Primary currency updated",
      description: selection ? `${selection.label} will be used for totals and reports.` : "Currency preference saved.",
    });
  };

  const handleEmailUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || email === user?.email) {
      toast({
        title: "No changes detected",
        description: "Update the email address before saving.",
      });
      return;
    }

    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      toast({
        title: "Email update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Verify the new email",
        description: "We sent a confirmation link to your new address.",
      });
    }

    setEmailLoading(false);
  };

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Enter a password",
        description: "Both password fields are required.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Make sure both password entries are identical.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Use at least 8 characters for your password.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setNewPassword("");
      setConfirmPassword("");
    }

    setPasswordLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your workspace preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground sm:inline">Coinflow v1.5.0</span>
              <Button variant="outline" onClick={() => document.getElementById("account-settings")?.scrollIntoView({ behavior: "smooth" })}>
                <SettingsIcon className="h-4 w-4 mr-2" />
                Account
              </Button>
              <ThemeToggle />
            </div>
          </div>
          <span className="mt-2 block text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground sm:hidden">Coinflow v1.5.0</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2 xl:gap-8">
          {/* Categories Management */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Categories
                </CardTitle>
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                      <DialogDescription>
                        Create a new category to organize your transactions.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryName">Category Name</Label>
                        <Input
                          id="categoryName"
                          placeholder="e.g., Food, Transportation, Medical"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Add Category</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No categories yet. Add your first category.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Payment Modes Management */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Modes
                </CardTitle>
                <Dialog open={isModeDialogOpen} onOpenChange={setIsModeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Mode
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Payment Mode</DialogTitle>
                      <DialogDescription>
                        Create a new payment mode for your transactions.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddMode} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="modeName">Payment Mode Name</Label>
                        <Input
                          id="modeName"
                          placeholder="e.g., PayPal, Venmo, Check"
                          value={modeName}
                          onChange={(e) => setModeName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsModeDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Add Mode</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentModes.map((mode) => (
                    <TableRow key={mode.id}>
                      <TableCell className="font-medium">{mode.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMode(mode.id, mode.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paymentModes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No payment modes yet. Add your first payment mode.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Additional Settings */}
        <Card className="shadow-card mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="font-medium">Primary Currency</h4>
                  <p className="text-sm text-muted-foreground">Choose the currency used for balances, dashboards, and reports.</p>
                </div>
                <Select value={primaryCurrency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Export Preferences</h4>
                  <p className="text-sm text-muted-foreground">Configure default export settings</p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Data Backup</h4>
                  <p className="text-sm text-muted-foreground">Backup your financial data</p>
                </div>
                <Button variant="outline">Backup Now</Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Account Security</h4>
                  <p className="text-sm text-muted-foreground">Manage your account security settings</p>
                </div>
                <Button variant="outline">Manage</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="account-settings" className="shadow-card mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Account Settings
            </CardTitle>
            <CardDescription>Update your contact details and password from the same page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleEmailUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-email">Email address</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="submit" disabled={emailLoading}>{emailLoading ? "Saving..." : "Update email"}</Button>
              </div>
            </form>

            <div className="border-t pt-4">
              <form onSubmit={handlePasswordUpdate} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter a new password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter the password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                  <Button type="submit" disabled={passwordLoading}>{passwordLoading ? "Updating..." : "Update password"}</Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default Settings;


