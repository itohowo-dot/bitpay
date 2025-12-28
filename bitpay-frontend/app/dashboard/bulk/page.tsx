"use client";

import { useState } from "react";
import { useCreateStream } from "@/hooks/use-bitpay-write";
import { useBlockHeight } from "@/hooks/use-block-height";
import { toast } from "sonner";
import { BulkHeader } from "@/components/dashboard/bulk/BulkHeader";
import { BulkInstructions } from "@/components/dashboard/bulk/instructions/BulkInstructions";
import { TemplateDownload } from "@/components/dashboard/bulk/upload/TemplateDownload";
import { FileUpload } from "@/components/dashboard/bulk/upload/FileUpload";
import { ManualInput } from "@/components/dashboard/bulk/upload/ManualInput";
import { StreamsPreview } from "@/components/dashboard/bulk/preview/StreamsPreview";
import { StreamsSummary } from "@/components/dashboard/bulk/preview/StreamsSummary";

interface BulkStreamEntry {
  recipient: string;
  amount: string;
  startBlock: string;
  endBlock: string;
  status: "pending" | "processing" | "success" | "error";
  txId?: string;
  error?: string;
}

export default function BulkStreamPage() {
  const [csvData, setCsvData] = useState("");
  const [streams, setStreams] = useState<BulkStreamEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { blockHeight } = useBlockHeight();
  const { write: createStream } = useCreateStream();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
      parseCsvData(text);
    };
    reader.readAsText(file);
  };

  const parseCsvData = (data: string) => {
    const lines = data.trim().split("\n");
    const entries: BulkStreamEntry[] = [];

    // Skip header if present
    const startIndex = lines[0].toLowerCase().includes("recipient") ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 4) {
        entries.push({
          recipient: parts[0],
          amount: parts[1],
          startBlock: parts[2],
          endBlock: parts[3],
          status: "pending",
        });
      }
    }

    setStreams(entries);
    if (entries.length > 0) {
      toast.success(`Parsed ${entries.length} streams from CSV`);
    }
  };

  const handleManualInput = () => {
    parseCsvData(csvData);
  };

  const handleProcessStreams = async () => {
    if (streams.length === 0) {
      toast.error("No streams to process");
      return;
    }

    setIsProcessing(true);
    setCurrentIndex(0);

    for (let i = 0; i < streams.length; i++) {
      const stream = streams[i];
      setCurrentIndex(i);

      // Update status to processing
      setStreams((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "processing" } : s))
      );

      try {
        // Validate inputs
        if (!stream.recipient.startsWith("SP") && !stream.recipient.startsWith("ST")) {
          throw new Error("Invalid recipient address");
        }

        const amount = parseFloat(stream.amount);
        if (isNaN(amount) || amount <= 0) {
          throw new Error("Invalid amount");
        }

        const startBlock = parseInt(stream.startBlock);
        const endBlock = parseInt(stream.endBlock);
        if (isNaN(startBlock) || isNaN(endBlock) || endBlock <= startBlock) {
          throw new Error("Invalid block range");
        }

        // Create stream
        const txId = await createStream(
          stream.recipient,
          amount,
          startBlock,
          endBlock
        );

        if (txId) {
          setStreams((prev) =>
            prev.map((s, idx) =>
              idx === i ? { ...s, status: "success", txId } : s
            )
          );
        } else {
          throw new Error("Transaction failed");
        }

        // Wait a bit between transactions to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error creating stream ${i}:`, error);
        setStreams((prev) =>
          prev.map((s, idx) =>
            idx === i
              ? {
                  ...s,
                  status: "error",
                  error: error instanceof Error ? error.message : "Unknown error",
                }
              : s
          )
        );
      }
    }

    setIsProcessing(false);
    toast.success("Bulk stream creation completed!");
  };

  const downloadTemplate = () => {
    const template = `recipient,amount,startBlock,endBlock
SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7,1.5,${blockHeight ? Number(blockHeight) + 10 : "START_BLOCK"},${blockHeight ? Number(blockHeight) + 4320 : "END_BLOCK"}
SP1A3B5C7D9E0F1G2H3I4J5K6L7M8N9O0P1Q2R3S,2.0,${blockHeight ? Number(blockHeight) + 10 : "START_BLOCK"},${blockHeight ? Number(blockHeight) + 4320 : "END_BLOCK"}`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bitpay-bulk-streams-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const progress = streams.length > 0 ? (currentIndex / streams.length) * 100 : 0;
  const successCount = streams.filter((s) => s.status === "success").length;
  const errorCount = streams.filter((s) => s.status === "error").length;

  return (
    <div className="space-y-6">
      <BulkHeader />
      <BulkInstructions />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TemplateDownload onDownload={downloadTemplate} />
        <FileUpload onFileChange={handleFileUpload} disabled={isProcessing} />
      </div>

      <ManualInput
        csvData={csvData}
        blockHeight={blockHeight}
        onCsvChange={setCsvData}
        onParse={handleManualInput}
        disabled={isProcessing}
      />

      {streams.length > 0 && (
        <>
          <StreamsPreview
            streams={streams}
            isProcessing={isProcessing}
            currentIndex={currentIndex}
            progress={progress}
            onProcess={handleProcessStreams}
          />
          <StreamsSummary
            totalStreams={streams.length}
            successCount={successCount}
            errorCount={errorCount}
          />
        </>
      )}
    </div>
  );
}
