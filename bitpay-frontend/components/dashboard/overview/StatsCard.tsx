import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  index?: number;
}

export function StatsCard({ title, value, subtitle, icon: Icon, color, bgColor, index = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="h-full"
    >
      <Card className="h-full border-border/60 bg-card hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
        <CardContent className="px-3.5 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{title}</p>
              <p className="text-xl font-bold text-foreground mb-0.5 truncate leading-none">{value}</p>
              <p className="text-xs text-muted-foreground/70">{subtitle}</p>
            </div>
            <div className={`p-2.5 rounded-lg ${bgColor} border border-white/5 shrink-0`}>
              <Icon className={`h-5 w-5 ${color}`} strokeWidth={2.5} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
