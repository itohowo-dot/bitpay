"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface StreamAddressesProps {
  sender: string;
  recipient: string;
  isSender: boolean;
  isRecipient: boolean;
}

export function StreamAddresses({ sender, recipient, isSender, isRecipient }: StreamAddressesProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Sender</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono">
            {sender}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(sender)}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        {isSender && <Badge className="mt-2">You</Badge>}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Recipient</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono">
            {recipient}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(recipient)}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        {isRecipient && <Badge className="mt-2">You</Badge>}
      </div>
    </div>
  );
}
