"use client";

export interface StreamAmountsProps {
  totalAmount: string;
  vestedAmount: string;
  withdrawn: string;
  available: string;
}

export function StreamAmounts({ totalAmount, vestedAmount, withdrawn, available }: StreamAmountsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
        <p className="text-2xl font-bold">{totalAmount}</p>
        <p className="text-xs text-muted-foreground">sBTC</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">Vested</p>
        <p className="text-2xl font-bold text-brand-teal">{vestedAmount}</p>
        <p className="text-xs text-muted-foreground">sBTC</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">Withdrawn</p>
        <p className="text-2xl font-bold">{withdrawn}</p>
        <p className="text-xs text-muted-foreground">sBTC</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">Available</p>
        <p className="text-2xl font-bold text-brand-pink">{available}</p>
        <p className="text-xs text-muted-foreground">sBTC</p>
      </div>
    </div>
  );
}
