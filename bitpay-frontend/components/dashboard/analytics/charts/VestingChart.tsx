"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface VestingChartProps {
  data: Array<{
    month: string;
    volume: number;
    vested: number;
  }>;
}

export function VestingChart({ data }: VestingChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vesting Over Time</CardTitle>
        <CardDescription>Stream volume and vested amounts</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e91e63" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e91e63" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tickLine={false} />
                <YAxis className="text-xs" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#e91e63"
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                  name="Total Volume"
                />
                <Area
                  type="monotone"
                  dataKey="vested"
                  stroke="#14b8a6"
                  fillOpacity={1}
                  fill="url(#colorVested)"
                  name="Vested Amount"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No data available</p>
              <p className="text-sm">Create streams to see analytics</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
