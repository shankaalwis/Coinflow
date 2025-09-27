import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Pencil, Trash2, Settings as SettingsIcon, Tag, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockCategories = [
  { id: "1", name: "Salary" },
  { id: "2", name: "Groceries" },
  { id: "3", name: "Rent" },
  { id: "4", name: "Utilities" },
  { id: "5", name: "Entertainment" },
];

const mockModes = [
  { id: "1", name: "Cash" },
  { id: "2", name: "Bank Transfer" },
  { id: "3", name: "Card" },
  { id: "4", name: "Digital Wallet" },
];

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [categoryName, setCategoryName] = useState("");
  const [modeName, setModeName] = useState("");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isModeDialogOpen, setIsModeDialogOpen] = useState(false);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim()) {
      toast({
        title: "Category added",
        description: `"${categoryName}" has been added to your categories.`,
      });
      setCategoryName("");
      setIsCategoryDialogOpen(false);
    }
  };

  const handleAddMode = (e: React.FormEvent) => {
    e.preventDefault();
    if (modeName.trim()) {
      toast({
        title: "Payment mode added",
        description: `"${modeName}" has been added to your payment modes.`,
      });
      setModeName("");
      setIsModeDialogOpen(false);
    }
  };

  const handleDeleteCategory = (categoryName: string) => {
    toast({
      title: "Category deleted",
      description: `"${categoryName}" has been removed from your categories.`,
    });
  };

  const handleDeleteMode = (modeName: string) => {
    toast({
      title: "Payment mode deleted", 
      description: `"${modeName}" has been removed from your payment modes.`,
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
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage your categories and payment modes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
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
                  {mockCategories.map((category) => (
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
                            onClick={() => handleDeleteCategory(category.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
                  {mockModes.map((mode) => (
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
                            onClick={() => handleDeleteMode(mode.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
      </main>
    </div>
  );
};

export default Settings;