"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Banknote, Building2, QrCode } from "lucide-react";
import type { PaymentMethod } from "@/types";

interface PaymentFormProps {
  totalPrice: number;
  onSubmit: (method: PaymentMethod, transactionId?: string) => void;
  loading?: boolean;
}

const paymentMethods: { value: PaymentMethod; label: string; desc: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash on Pickup", desc: "Pay when you board the van", icon: Banknote },
  { value: "bank_transfer", label: "Bank Transfer", desc: "Transfer and enter reference", icon: Building2 },
  { value: "promptpay", label: "PromptPay", desc: "Scan QR and enter reference", icon: QrCode },
];

export function PaymentForm({ totalPrice, onSubmit, loading }: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [transactionId, setTransactionId] = useState("");

  const needsTransaction = method !== "cash";

  return (
    <div className="space-y-5">
      {/* Total */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 p-5 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Total Amount</p>
        <p className="mt-1 text-3xl font-bold text-primary">{totalPrice}<span className="ml-1 text-sm font-medium">THB</span></p>
      </div>

      {/* Methods */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Payment Method</label>
        {paymentMethods.map((pm) => {
          const Icon = pm.icon;
          const selected = method === pm.value;
          return (
            <label key={pm.value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                selected ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-primary/20"
              }`}>
              <input type="radio" name="payment" value={pm.value} checked={selected}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="sr-only" />
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{pm.label}</p>
                <p className="text-xs text-muted-foreground">{pm.desc}</p>
              </div>
              <div className={`h-4 w-4 rounded-full border-2 transition-all ${selected ? "border-primary bg-primary" : "border-border"}`}>
                {selected && <div className="mx-auto mt-0.5 h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
            </label>
          );
        })}
      </div>

      {needsTransaction && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Transaction Reference</label>
          <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter transaction ID or reference"
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      )}

      <Button onClick={() => onSubmit(method, needsTransaction ? transactionId : undefined)}
        disabled={loading || (needsTransaction && !transactionId)}
        className="w-full rounded-xl py-5 text-sm font-semibold">
        {loading ? "Processing..." : `Confirm & Pay ${totalPrice} THB`}
      </Button>
    </div>
  );
}
