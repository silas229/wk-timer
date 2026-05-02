"use client";

import { useState, useEffect, useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { indexedDB, type SavedRound } from "@/lib/indexeddb";
import { calculateActivityTimes, formatTime } from "@/lib/lap-activities";

interface ActivityChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityName: string;
  teamId: string;
  referenceY?: number | null;
  currentRoundId?: string;
}

interface ChartDataPoint {
  index: number;
  roundId: string;
  roundLabel: string;
  dateLabel: string;
  time: number;
  formattedTime: string;
  day: string;
  _isCurrent?: boolean;
}

const chartConfig = {
  time: {
    label: "Zeit",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export const TOTAL_TIME_KEY = "Gesamtzeit";

function CustomDot({ cx, cy, index, payload }: Readonly<{ cx?: number; cy?: number; index?: number; payload?: ChartDataPoint & { _isCurrent?: boolean } }>) {
  const isCurrent = payload?._isCurrent ?? false;
  if (cx == null || cy == null) return null;
  return (
    <circle
      key={`dot-${index}`}
      cx={cx}
      cy={cy}
      r={isCurrent ? 6 : 4}
      fill={isCurrent ? "var(--color-time)" : "var(--background)"}
      stroke="var(--color-time)"
      strokeWidth={2}
    />
  );
}

export function ActivityChartDialog({
  open,
  onOpenChange,
  activityName,
  teamId,
  referenceY,
  currentRoundId,
}: Readonly<ActivityChartDialogProps>) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const timeFormat = activityName === TOTAL_TIME_KEY ? "compact" : "seconds";

  useEffect(() => {
    if (!open || !teamId || !activityName) return;

    async function loadData() {
      setLoading(true);
      try {
        const rounds = await indexedDB.getRoundsByTeam(teamId);
        // rounds are sorted newest first, take last 5 and reverse for chronological order
        const lastFiveRounds = rounds.slice(0, 5).reverse();

        const data: ChartDataPoint[] = [];
        for (const round of lastFiveRounds) {
          let activityTime: number | null = null;
          if (activityName === TOTAL_TIME_KEY) {
            activityTime = round.totalTime;
          } else {
            const activities = calculateActivityTimes(round.laps);
            const activity = activities.find((a) => a.name === activityName);
            activityTime = activity?.time ?? null;
          }
          if (activityTime !== null) {
            data.push({
              index: data.length,
              roundId: round.id,
              roundLabel: formatTimeLabel(round),
              dateLabel: formatDateLabel(round),
              time: activityTime,
              formattedTime: formatTime(activityTime, timeFormat),
              day: round.completedAt.toDateString(),
              _isCurrent: round.id === currentRoundId,
            });
          }
        }
        setChartData(data);
      } catch (error) {
        console.error("Failed to load activity history:", error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [open, teamId, activityName, currentRoundId, timeFormat]);

  // Compute day groups for rendering date labels
  const dayGroups = useMemo(() => {
    const groups: { day: string; dateLabel: string; startIndex: number; endIndex: number }[] = [];
    for (const point of chartData) {
      const last = groups.at(-1);
      if (last?.day === point.day) {
        last.endIndex = point.index;
      } else {
        groups.push({ day: point.day, dateLabel: point.dateLabel, startIndex: point.index, endIndex: point.index });
      }
    }
    return groups;
  }, [chartData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{activityName}</DialogTitle>
          <DialogDescription className="flex justify-between items-center">
            <span>Zeiten der letzten {chartData.length} Runden</span>
            {chartData.length >= 2 && (
              <span className="font-mono">
                ⌀ {formatTime(chartData.reduce((sum, d) => sum + d.time, 0) / chartData.length, timeFormat)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          {loading && (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              Laden…
            </div>
          )}
          {!loading && chartData.length < 2 && (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              Nicht genügend Daten für ein Diagramm
            </div>
          )}
          {!loading && chartData.length >= 2 && (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="index"
                  type="number"
                  domain={[0, chartData.length - 1]}
                  ticks={chartData.map((d) => d.index)}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value: number) =>
                    chartData[value]?.roundLabel ?? ""
                  }
                />
                <XAxis
                  xAxisId="date"
                  dataKey="index"
                  type="number"
                  domain={[0, chartData.length - 1]}
                  ticks={dayGroups.map((g) => (g.startIndex + g.endIndex) / 2)}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tickFormatter={(value: number) => {
                    const group = dayGroups.find(
                      (g) => Math.abs((g.startIndex + g.endIndex) / 2 - value) < 0.01
                    );
                    return group?.dateLabel ?? "";
                  }}
                  orientation="bottom"
                  className="text-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value: number) =>
                    formatTime(value, timeFormat)
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        formatTime(value as number, timeFormat)
                      }
                    />
                  }
                />
                {chartData.map((point, i) =>
                  i > 0 && point.day !== chartData[i - 1]?.day ? (
                    <ReferenceLine
                      key={`day-sep-${point.roundLabel}`}
                      x={i - 0.5}
                      stroke="var(--border)"
                      strokeDasharray="4 4"
                    />
                  ) : null
                )}
                {referenceY != null && (
                  <ReferenceLine
                    y={referenceY}
                    stroke="#16a34a"
                    strokeDasharray="4 4"
                    label={{ value: formatTime(referenceY, timeFormat) + " (Sollzeit)", position: "insideTopLeft", fill: "#16a34a", fontSize: 11 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="var(--color-time)"
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={<CustomDot />}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatTimeLabel(round: SavedRound): string {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(round.completedAt);
}

function formatDateLabel(round: SavedRound): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
  }).format(round.completedAt);
}
