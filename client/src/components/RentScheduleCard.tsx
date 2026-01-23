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
import { Calendar, Plus, Trash2, AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { usePropertyPayments, useUpdatePaymentStatus } from "@/hooks/use-client-data";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import type { Payment } from "@shared/schema";

type RentStatus = 'unpaid' | 'pending' | 'paid';

interface EditingPayment {
  id: string;
  dueDate: string;
  amount: number;
  status: RentStatus;
}

export function RentScheduleCard({ propertyId = 'p1' }: { propertyId?: string }) {
  const queryClient = useQueryClient();
  const { data: payments = [], isLoading } = usePropertyPayments(propertyId);
  const updatePaymentStatus = useUpdatePaymentStatus();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayments, setEditingPayments] = useState<EditingPayment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);

  const saveScheduleMutation = useMutation({
    mutationFn: async (newPayments: EditingPayment[]) => {
      const response = await fetch(`/api/properties/${propertyId}/payments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ payments: newPayments }),
      });
      if (!response.ok) throw new Error('Failed to save schedule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "payments"] });
      setIsModalOpen(false);
      toast({ title: "Rent schedule updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save rent schedule", variant: "destructive" });
    },
  });

  const handleToggleClick = (id: string, currentStatus: string) => {
    if (currentStatus === 'paid') {
      executeTogglePaid(id, currentStatus);
    } else {
      setConfirmPaymentId(id);
    }
  };

  const confirmToggle = () => {
    if (confirmPaymentId) {
      const payment = payments.find(p => p.id === confirmPaymentId);
      if (payment) {
        executeTogglePaid(payment.id, payment.status);
      }
      setConfirmPaymentId(null);
    }
  };

  const executeTogglePaid = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    updatePaymentStatus.mutate({ paymentId: id, status: newStatus as any });
    if (newStatus === 'paid') {
      toast({ title: "Payment Verified", description: "Rent marked as paid." });
    }
  };

  const handleOpenModal = () => {
    setEditingPayments(payments.map(p => ({
      id: p.id,
      dueDate: format(new Date(p.dueDate), "yyyy-MM-dd"),
      amount: Number(p.amount),
      status: p.status as RentStatus,
    })));
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
        status: 'unpaid'
      }
    ]);
  };

  const handleDeleteRow = (id: string) => {
    setEditingPayments(prev => prev.filter(p => p.id !== id));
  };

  const updateRow = (id: string, field: keyof EditingPayment, value: any) => {
    setEditingPayments(prev => 
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  const handleSave = () => {
    const isValidData = editingPayments.every(p => p.dueDate && p.amount > 0);
    if (!isValidData) {
      setError("Date and amount are required for all payments.");
      return;
    }

    const sorted = [...editingPayments].sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    saveScheduleMutation.mutate(sorted);
  };

  const displayPayments = [...payments].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const nextPayments = displayPayments.filter(p => p.status !== 'paid').slice(0, 6);
  const listPayments = nextPayments.length > 0 ? nextPayments : displayPayments.slice(0, 6);

  if (isLoading) {
    return (
      <Card className="bg-white border-border/60 shadow-sm">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

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
                    <span className={cn(payment.status === 'paid' && "line-through opacity-70")}>
                      {format(new Date(payment.dueDate), "dd MMM yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "font-medium tabular-nums", 
                      payment.status === 'paid' ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      £{Number(payment.amount).toLocaleString()}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {payment.status === 'pending' && (
                        <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" title="Client reported paid" />
                      )}
                      
                      <Checkbox 
                        checked={payment.status === 'paid'} 
                        onCheckedChange={() => handleToggleClick(payment.id, payment.status)}
                        className={cn(
                          "data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600",
                          payment.status === 'pending' && "border-orange-400 data-[state=unchecked]:bg-orange-50"
                        )}
                      />
                    </div>
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

      <Dialog open={!!confirmPaymentId} onOpenChange={(open) => !open && setConfirmPaymentId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Payment
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-3">
              <p className="font-medium text-foreground">
                Are you sure you want to mark this rent payment as paid?
              </p>
              <div className="bg-amber-50 p-3 rounded-md border border-amber-100 text-sm text-amber-800">
                Have you seen confirmation of the funds in the bank account?
              </div>
              <p className="text-xs text-muted-foreground">
                Don't worry, this action can be undone if you made a mistake.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmPaymentId(null)}>Cancel</Button>
            <Button onClick={confirmToggle} className="bg-emerald-600 hover:bg-emerald-700">Yes, Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                      checked={payment.status === 'paid'}
                      onCheckedChange={(checked) => updateRow(payment.id, 'status', checked ? 'paid' : 'unpaid')}
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
            <Button onClick={handleSave} disabled={saveScheduleMutation.isPending}>
              {saveScheduleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
