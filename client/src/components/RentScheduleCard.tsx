import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, Trash2, Edit2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";

export interface Payment {
  id: string;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  paid: boolean;
}

// Initial mock data
const INITIAL_PAYMENTS: Payment[] = [
  { id: "pay_1", dueDate: "2026-10-01", amount: 1200, paid: true },
  { id: "pay_2", dueDate: "2026-11-01", amount: 1200, paid: false },
  { id: "pay_3", dueDate: "2026-12-01", amount: 1200, paid: false },
  { id: "pay_4", dueDate: "2027-01-01", amount: 1200, paid: false },
];

export function RentScheduleCard() {
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayments, setEditingPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const togglePaid = (id: string) => {
    setPayments(prev => 
      prev.map(p => p.id === id ? { ...p, paid: !p.paid } : p)
    );
  };

  const handleOpenModal = () => {
    // Clone payments for editing so we can cancel changes
    setEditingPayments([...payments]);
    setError(null);
    setIsModalOpen(true);
  };

  const handleAddRow = () => {
    const nextMonth = new Date();
    if (editingPayments.length > 0) {
       const lastDate = new Date(editingPayments[editingPayments.length - 1].dueDate);
       if (isValid(lastDate)) {
         nextMonth.setMonth(lastDate.getMonth() + 1);
       }
    }
    
    setEditingPayments([
      ...editingPayments,
      {
        id: `new_${Date.now()}`,
        dueDate: format(nextMonth, "yyyy-MM-dd"),
        amount: 1200,
        paid: false
      }
    ]);
  };

  const handleDeleteRow = (id: string) => {
    setEditingPayments(prev => prev.filter(p => p.id !== id));
  };

  const updateRow = (id: string, field: keyof Payment, value: any) => {
    setEditingPayments(prev => 
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  const handleSave = () => {
    // Validation
    const isValid = editingPayments.every(p => p.dueDate && p.amount > 0);
    if (!isValid) {
      setError("Date and amount are required for all payments.");
      return;
    }

    // Sort by date
    const sorted = [...editingPayments].sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    setPayments(sorted);
    setIsModalOpen(false);
    toast({ title: "Rent schedule updated" });
  };

  // Sort display payments
  const displayPayments = [...payments].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const nextPayments = displayPayments.filter(p => !p.paid).slice(0, 6);
  // If no unpaid payments, show recent ones or just all
  const listPayments = nextPayments.length > 0 ? nextPayments : displayPayments.slice(0, 6);

  return (
    <>
      <Card className="bg-white border-border/60 shadow-sm group">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-serif">Rent Schedule</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs text-muted-foreground hover:text-primary"
            onClick={handleOpenModal}
          >
            Manage
          </Button>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">No payments scheduled</p>
              <Button variant="outline" size="sm" onClick={handleOpenModal}>
                <Plus className="h-3 w-3 mr-1.5" /> Add Schedule
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {listPayments.map(payment => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors text-sm"
                >
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 opacity-70" />
                    <span className={cn(payment.paid && "line-through opacity-70")}>
                      {format(new Date(payment.dueDate), "dd MMM yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn("font-medium tabular-nums", payment.paid ? "text-muted-foreground line-through" : "text-foreground")}>
                      £{payment.amount.toLocaleString()}
                    </span>
                    <Checkbox 
                      checked={payment.paid} 
                      onCheckedChange={() => togglePaid(payment.id)}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                  </div>
                </div>
              ))}
              
              {payments.length > listPayments.length && (
                <div className="pt-2 text-center">
                  <Button variant="link" size="sm" className="text-xs text-muted-foreground h-auto p-0" onClick={handleOpenModal}>
                    View all {payments.length} payments
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Rent Schedule</DialogTitle>
            <DialogDescription>Add, edit or remove scheduled payments.</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 text-xs font-medium text-muted-foreground px-2 uppercase tracking-wider">
                <div className="col-span-4">Due Date</div>
                <div className="col-span-4">Amount (£)</div>
                <div className="col-span-2 text-center">Paid</div>
                <div className="col-span-2"></div>
              </div>
              
              {editingPayments.map((payment) => (
                <div key={payment.id} className="grid grid-cols-12 gap-3 items-center bg-slate-50/50 p-2 rounded-md border border-transparent hover:border-border/50 transition-colors">
                  <div className="col-span-4">
                    <Input 
                      type="date" 
                      value={payment.dueDate} 
                      onChange={(e) => updateRow(payment.id, 'dueDate', e.target.value)}
                      className="h-9 bg-white"
                    />
                  </div>
                  <div className="col-span-4">
                    <Input 
                      type="number" 
                      value={payment.amount}
                      onChange={(e) => updateRow(payment.id, 'amount', Number(e.target.value))}
                      className="h-9 bg-white"
                      min="0"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Checkbox 
                      checked={payment.paid}
                      onCheckedChange={(checked) => updateRow(payment.id, 'paid', checked)}
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteRow(payment.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {editingPayments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  No payments scheduled yet.
                </div>
              )}
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-4 border-dashed border-border hover:bg-slate-50 hover:text-primary hover:border-primary/30"
              onClick={handleAddRow}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Payment
            </Button>
          </div>

          <DialogFooter className="border-t pt-4 mt-auto">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
