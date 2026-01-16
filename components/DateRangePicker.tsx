"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { toInputDateValue, fromInputDateValue, formatSimple } from "@/lib/date";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (start: Date, end: Date) => void;
  presets?: Array<{ label: string; value: string }>;
  onPresetChange?: (preset: string) => void;
  selectedPreset?: string;
}

const defaultPresets = [
  { label: "Today", value: "today" },
  { label: "Last 7 days", value: "last7days" },
  { label: "Last 30 days", value: "last30days" },
  { label: "This month", value: "thisMonth" },
  { label: "Last month", value: "lastMonth" },
  { label: "This year", value: "thisYear" },
  { label: "Custom", value: "custom" },
];

export function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  presets = defaultPresets,
  onPresetChange,
  selectedPreset = "thisMonth",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(toInputDateValue(startDate));
  const [tempEnd, setTempEnd] = useState(toInputDateValue(endDate));

  const handlePresetChange = (value: string) => {
    if (value === "custom") {
      setIsOpen(true);
    }
    onPresetChange?.(value);
  };

  const handleApplyCustom = () => {
    const start = fromInputDateValue(tempStart);
    const end = fromInputDateValue(tempEnd);
    onDateChange(start, end);
    setIsOpen(false);
  };

  const formatRange = () => {
    const startStr = formatSimple(startDate, "MMM d");
    const endStr = formatSimple(endDate, "MMM d, yyyy");
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="flex items-center gap-3">
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[240px] justify-start">
            <Calendar className="mr-2 h-4 w-4" />
            {formatRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
              />
            </div>
            <Button onClick={handleApplyCustom} className="w-full">
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
