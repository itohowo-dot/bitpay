"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";

interface MarketplaceFiltersProps {
  searchTerm: string;
  sortBy: string;
  filterDiscount: string;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onDiscountFilterChange: (value: string) => void;
}

export function MarketplaceFilters({
  searchTerm,
  sortBy,
  filterDiscount,
  onSearchChange,
  onSortChange,
  onDiscountFilterChange,
}: MarketplaceFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by stream ID or seller..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sort">Sort By</Label>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger id="sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount">Highest Discount</SelectItem>
                <SelectItem value="apr">Highest APR</SelectItem>
                <SelectItem value="amount">Largest Amount</SelectItem>
                <SelectItem value="time">Shortest Duration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="discount-filter">Min. Discount</Label>
            <Select value={filterDiscount} onValueChange={onDiscountFilterChange}>
              <SelectTrigger id="discount-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="5">5%+</SelectItem>
                <SelectItem value="10">10%+</SelectItem>
                <SelectItem value="15">15%+</SelectItem>
                <SelectItem value="20">20%+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
