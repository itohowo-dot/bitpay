"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Bitcoin,
  Clock,
  Wallet,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { StreamPreview } from "@/components/dashboard/streams/create/StreamPreview";
import { QuickTemplates } from "@/components/dashboard/streams/create/QuickTemplates";
import { ImportantNotes } from "@/components/dashboard/streams/create/ImportantNotes";
import { useCreateStream } from "@/hooks/use-bitpay-write";
import { useBlockHeight } from "@/hooks/use-block-height";
import { BLOCKS_PER_DAY, BLOCKS_PER_WEEK, BLOCKS_PER_MONTH } from "@/lib/contracts/config";

const createStreamSchema = z.object({
  recipient: z.string().min(1, "Recipient address is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  duration: z.string().min(1, "Duration is required"),
  durationType: z.enum(["blocks", "days", "weeks", "months"]),
  description: z.string().optional(),
  startImmediately: z.boolean().default(true),
  startDate: z.string().optional(),
});

type CreateStreamForm = z.infer<typeof createStreamSchema>;

export default function CreateStreamPage() {
  const router = useRouter();
  const { write: createStream, isLoading: isCreating, error: createError, txId } = useCreateStream();
  const { blockHeight, isLoading: blockHeightLoading } = useBlockHeight(10000); // Poll every 10 seconds

  const form = useForm({
    resolver: zodResolver(createStreamSchema),
    defaultValues: {
      recipient: "",
      amount: "",
      duration: "",
      durationType: "days" as const,
      description: "",
      startImmediately: true,
    },
  });

  const watchedValues = form.watch();

  // Show toast when transaction completes
  useEffect(() => {
    if (txId) {
      const explorerUrl = `https://explorer.hiro.so/txid/${txId}?chain=testnet`;

      toast.success("Stream Created Successfully!", {
        description: (
          <div className="space-y-2 mt-1">
            <p className="text-sm">Your payment stream is now on the blockchain.</p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono block hover:underline"
            >
              {txId.substring(0, 20)}...
            </a>
          </div>
        ),
        duration: 15000,
        action: {
          label: "View Streams",
          onClick: () => router.push("/dashboard/streams"),
        },
      });

      // Save to database
      saveStreamToDatabase(txId);

      // Log for easy copy-paste
      console.log('✅ Stream created!');
      console.log('📋 Transaction ID:', txId);
      console.log('🔗 Explorer:', explorerUrl);

      // Wait a bit then redirect to streams page
      // This gives the transaction time to be processed
      setTimeout(() => {
        router.push("/dashboard/streams");
      }, 3000);
    }
  }, [txId, router]);

  // Show error toast
  useEffect(() => {
    if (createError) {
      toast.error("Failed to Create Stream", {
        description: createError === "Transaction cancelled"
          ? "You cancelled the transaction in your wallet."
          : createError,
        duration: 8000,
      });
    }
  }, [createError]);

  // Save stream to database after blockchain confirmation
  const saveStreamToDatabase = async (transactionId: string) => {
    try {
      const formValues = form.getValues();

      // Convert duration to blocks
      let durationInBlocks = 0;
      const duration = parseInt(formValues.duration);

      switch (formValues.durationType) {
        case "blocks":
          durationInBlocks = duration;
          break;
        case "days":
          durationInBlocks = duration * BLOCKS_PER_DAY;
          break;
        case "weeks":
          durationInBlocks = duration * BLOCKS_PER_WEEK;
          break;
        case "months":
          durationInBlocks = duration * BLOCKS_PER_MONTH;
          break;
      }

      const startBlock = (blockHeight || 0) + 1;
      const endBlock = startBlock + durationInBlocks;

      const response = await fetch('/api/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipient: formValues.recipient,
          amount: formValues.amount,
          startBlock,
          endBlock,
          description: formValues.description,
          txHash: transactionId,
          status: 'pending',
        }),
      });

      if (response.ok) {
        console.log('✅ Stream saved to database');
      } else {
        console.error('Failed to save stream to database');
      }
    } catch (error) {
      console.error('Error saving stream to database:', error);
      // Don't show error to user - stream is created on chain, DB is just cache
    }
  };

  // Calculate estimated values
  const calculateEstimates = () => {
    const amount = parseFloat(watchedValues.amount || "0");
    const duration = parseInt(watchedValues.duration || "0");

    if (!amount || !duration) return null;

    let durationInSeconds = 0;
    switch (watchedValues.durationType) {
      case "blocks":
        durationInSeconds = duration * 600; // 10 minutes per block
        break;
      case "days":
        durationInSeconds = duration * 24 * 60 * 60;
        break;
      case "weeks":
        durationInSeconds = duration * 7 * 24 * 60 * 60;
        break;
      case "months":
        durationInSeconds = duration * 30 * 24 * 60 * 60;
        break;
    }

    const perSecond = amount / durationInSeconds;
    const perMinute = perSecond * 60;
    const perHour = perSecond * 3600;
    const perDay = perSecond * 86400;

    return {
      perSecond: perSecond.toFixed(8),
      perMinute: perMinute.toFixed(8),
      perHour: perHour.toFixed(6),
      perDay: perDay.toFixed(4),
      totalDuration: durationInSeconds,
    };
  };

  const estimates = calculateEstimates();

  const onSubmit = async (data: CreateStreamForm) => {
    try {
      if (!blockHeight) {
        toast.error("Unable to fetch current block height. Please try again.");
        return;
      }

      // Convert duration to blocks
      let durationInBlocks = 0;
      const duration = parseInt(data.duration);

      switch (data.durationType) {
        case "blocks":
          durationInBlocks = duration;
          break;
        case "days":
          durationInBlocks = duration * BLOCKS_PER_DAY;
          break;
        case "weeks":
          durationInBlocks = duration * BLOCKS_PER_WEEK;
          break;
        case "months":
          durationInBlocks = duration * BLOCKS_PER_MONTH;
          break;
      }

      // Calculate start and end blocks
      // Add buffer of 20 blocks for testnet (blocks can be 30-60 seconds each)
      // This ensures the start block hasn't passed by the time the transaction is mined
      const startBlock = blockHeight + 20;
      const endBlock = startBlock + durationInBlocks;

      // Convert amount to satoshis for display
      const amountInSats = parseFloat(data.amount) * 100_000_000;

      console.log('════════════════════════════════════════');
      console.log('📝 CREATING STREAM ON BLOCKCHAIN');
      console.log('════════════════════════════════════════');
      console.log('Recipient:', data.recipient);
      console.log('Amount:', data.amount, 'sBTC');
      console.log('Amount (sats):', amountInSats.toLocaleString());
      console.log('Start Block:', startBlock);
      console.log('End Block:', endBlock);
      console.log('Duration:', durationInBlocks, 'blocks');
      console.log('════════════════════════════════════════');

      // Call smart contract
      await createStream(
        data.recipient,
        data.amount,
        startBlock,
        endBlock
      );

      // Note: Navigation happens in the useEffect when txId is set
    } catch (error) {
      console.error("Stream creation error:", error);
      // Error toast is handled in useEffect
    }
  };

  const validateAddress = (address: string) => {
    // Basic Stacks address validation
    return address.startsWith("SP") || address.startsWith("ST");
  };

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/streams">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Stream</h1>
            <p className="text-muted-foreground mt-1">Set up a continuous Bitcoin payment stream</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,400px] xl:grid-cols-[1fr,450px]">
          {/* Main Form Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-brand-pink" />
                  Stream Details
                </CardTitle>
                <CardDescription>
                  Configure your Bitcoin stream parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Recipient */}
                    <FormField
                      control={form.control}
                      name="recipient"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Recipient Address</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="SP1J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7"
                              className={`h-12 ${
                                field.value && !validateAddress(field.value)
                                  ? "border-red-500"
                                  : ""
                              }`}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter a valid Stacks address (starts with SP or ST)
                          </FormDescription>
                          <FormMessage />

                          {field.value && !validateAddress(field.value) && (
                            <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                              <AlertCircle className="h-4 w-4" />
                              Invalid Stacks address format
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Amount */}
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Total Amount (sBTC)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Bitcoin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                type="number"
                                step="0.00000001"
                                min="0"
                                placeholder="0.00000000"
                                className="h-12 pl-11 text-lg"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Total amount to stream over the specified duration
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Duration */}
                    <div className="space-y-4">
                      <Label className="text-base">Stream Duration</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="30"
                                    className="h-11 pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="durationType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time Unit</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="blocks">Blocks</SelectItem>
                                  <SelectItem value="days">Days</SelectItem>
                                  <SelectItem value="weeks">Weeks</SelectItem>
                                  <SelectItem value="months">Months</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Monthly salary, Project payment, Consulting fees..."
                              className="resize-none min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Add a note to help identify this stream later
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-8" />

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => router.back()}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isCreating || !form.formState.isValid}
                        className="flex-1 bg-brand-pink hover:bg-brand-pink/90 text-white"
                      >
                        {isCreating ? "Creating Stream..." : "Create Stream"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StreamPreview
              amount={watchedValues.amount}
              duration={watchedValues.duration}
              durationType={watchedValues.durationType}
              estimates={estimates}
            />

            <QuickTemplates
              onTemplateSelect={(template) => {
                form.setValue("amount", template.amount);
                form.setValue("duration", template.duration);
                form.setValue("durationType", template.durationType);
                form.setValue("description", template.description);
              }}
            />

            <ImportantNotes />
          </div>
        </div>

        {/* Loading Dialog */}
        <Dialog open={isCreating}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-brand-pink" />
                Creating Stream...
              </DialogTitle>
              <DialogDescription className="space-y-3 pt-4">
                <p>Please confirm the transaction in your Stacks wallet.</p>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipient:</span>
                    <span className="font-mono text-xs">
                      {watchedValues.recipient.substring(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-semibold">{watchedValues.amount} sBTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{watchedValues.duration} {watchedValues.durationType}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  This may take a few moments. Don't close this window.
                </p>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium mb-2 ${className}`}>{children}</div>;
}
