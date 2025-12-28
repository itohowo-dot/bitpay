"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Wallet, DollarSign } from "lucide-react";

interface TreasuryInfoProps {
  balance: string;
  feesCollected: string;
}

export function TreasuryInfo({ balance, feesCollected }: TreasuryInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Treasury</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Wallet className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="text-sm text-muted-foreground">Treasury Balance</span>
            </div>
            <Badge variant="secondary" className="font-mono">{balance} sBTC</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-sm text-muted-foreground">Fees Collected</span>
            </div>
            <Badge variant="secondary" className="font-mono">{feesCollected} sBTC</Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
