"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Filter, 
  Calendar as CalendarIcon, 
  X,
  RotateCcw
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface FilterOptions {
  status: string[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  amountRange: {
    min: string;
    max: string;
  };
  recipients: string[];
}

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
}

export function FiltersModal({ isOpen, onClose, filters, onApplyFilters }: FiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [datePickerOpen, setDatePickerOpen] = useState<'from' | 'to' | null>(null);

  const statusOptions = [
    { value: "active", label: "Active", color: "bg-brand-teal" },
    { value: "completed", label: "Completed", color: "bg-green-500" },
    { value: "paused", label: "Paused", color: "bg-yellow-500" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
  ];

  const handleStatusToggle = (status: string, checked: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      status: checked 
        ? [...prev.status, status]
        : prev.status.filter(s => s !== status)
    }));
  };

  const handleDateChange = (date: Date | undefined, type: 'from' | 'to') => {
    setLocalFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: date
      }
    }));
    setDatePickerOpen(null);
  };

  const handleAmountChange = (value: string, type: 'min' | 'max') => {
    setLocalFilters(prev => ({
      ...prev,
      amountRange: {
        ...prev.amountRange,
        [type]: value
      }
    }));
  };

  const addRecipientFilter = (recipient: string) => {
    if (recipient.trim() && !localFilters.recipients.includes(recipient.trim())) {
      setLocalFilters(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipient.trim()]
      }));
    }
  };

  const removeRecipientFilter = (recipient: string) => {
    setLocalFilters(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== recipient)
    }));
  };

  const resetFilters = () => {
    setLocalFilters({
      status: [],
      dateRange: { from: undefined, to: undefined },
      amountRange: { min: "", max: "" },
      recipients: []
    });
  };

  const applyFilters = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const hasActiveFilters = 
    localFilters.status.length > 0 ||
    localFilters.dateRange.from ||
    localFilters.dateRange.to ||
    localFilters.amountRange.min ||
    localFilters.amountRange.max ||
    localFilters.recipients.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4 text-brand-pink" />
            Filter Streams
          </DialogTitle>
          <DialogDescription className="text-xs">
            Apply filters to find specific streams
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Status</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {statusOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-1.5">
                  <Checkbox
                    id={option.value}
                    checked={localFilters.status.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleStatusToggle(option.value, checked as boolean)
                    }
                    className="h-3.5 w-3.5"
                  />
                  <Label 
                    htmlFor={option.value}
                    className="text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${option.color}`} />
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-1.5" />

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Date Range</Label>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">From</Label>
                <Popover open={datePickerOpen === 'from'} onOpenChange={(open) => setDatePickerOpen(open ? 'from' : null)}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal h-8 text-xs"
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {localFilters.dateRange.from ? (
                        format(localFilters.dateRange.from, "MMM dd, yy")
                      ) : (
                        <span className="text-[11px]">Pick date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateRange.from}
                      onSelect={(date) => handleDateChange(date, 'from')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">To</Label>
                <Popover open={datePickerOpen === 'to'} onOpenChange={(open) => setDatePickerOpen(open ? 'to' : null)}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal h-8 text-xs"
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {localFilters.dateRange.to ? (
                        format(localFilters.dateRange.to, "MMM dd, yy")
                      ) : (
                        <span className="text-[11px]">Pick date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateRange.to}
                      onSelect={(date) => handleDateChange(date, 'to')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <Separator className="my-1.5" />

          {/* Amount Range Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Amount Range (sBTC)</Label>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">Min</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  placeholder="0.00000000"
                  value={localFilters.amountRange.min}
                  onChange={(e) => handleAmountChange(e.target.value, 'min')}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">Max</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  placeholder="0.00000000"
                  value={localFilters.amountRange.max}
                  onChange={(e) => handleAmountChange(e.target.value, 'max')}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <Separator className="my-1.5" />

          {/* Recipient Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Recipients</Label>
            <div className="space-y-1.5">
              <Input
                placeholder="Enter wallet address or name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addRecipientFilter(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="h-8 text-xs"
              />
              {localFilters.recipients.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {localFilters.recipients.map((recipient, index) => (
                    <Badge 
                      key={index}
                      variant="secondary" 
                      className="flex items-center gap-0.5 h-5 text-[10px] px-1.5"
                    >
                      {recipient.length > 20 ? `${recipient.slice(0, 8)}...${recipient.slice(-8)}` : recipient}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRecipientFilter(recipient)}
                        className="h-3 w-3 p-0 hover:bg-transparent"
                      >
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 bg-brand-pink/10 rounded-lg border border-brand-pink/20"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-brand-pink">Active Filters</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-5 px-1.5 text-[10px]"
                >
                  <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
                  Reset
                </Button>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {localFilters.status.length > 0 && `${localFilters.status.length} status(es), `}
                {(localFilters.dateRange.from || localFilters.dateRange.to) && "date range, "}
                {(localFilters.amountRange.min || localFilters.amountRange.max) && "amount range, "}
                {localFilters.recipients.length > 0 && `${localFilters.recipients.length} recipient(s)`}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1 h-8 text-xs">
              Cancel
            </Button>
            <Button onClick={applyFilters} className="flex-1 bg-brand-pink hover:bg-brand-pink/90 text-white h-8 text-xs">
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}