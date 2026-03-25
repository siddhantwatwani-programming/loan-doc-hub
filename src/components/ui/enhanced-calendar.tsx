import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";

export type EnhancedCalendarProps = React.ComponentProps<typeof DayPicker> & {
  onClear?: () => void;
  onToday?: () => void;
  showClearToday?: boolean;
};

function EnhancedCalendar({
  className,
  classNames,
  showOutsideDays = true,
  showClearToday = true,
  onClear,
  onToday,
  month: controlledMonth,
  onMonthChange,
  ...props
}: EnhancedCalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState<Date>(
    controlledMonth || (props.selected instanceof Date ? props.selected : new Date())
  );

  const displayMonth = controlledMonth || internalMonth;

  const handleMonthChange = (newMonth: Date) => {
    setInternalMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const goToPrevMonth = () => handleMonthChange(subMonths(displayMonth, 1));
  const goToNextMonth = () => handleMonthChange(addMonths(displayMonth, 1));

  return (
    <div className="flex flex-col">
      <DayPicker
        showOutsideDays={showOutsideDays}
        month={displayMonth}
        onMonthChange={handleMonthChange}
        weekStartsOn={1}
        className={cn("p-3 pointer-events-auto", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          Caption: ({ displayMonth: dm }) => (
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium">
                {format(dm, "MMMM, yyyy")}
                <span className="ml-1 text-muted-foreground text-xs">▾</span>
              </span>
              <div className="flex flex-col -space-y-1">
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Next month"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ),
        }}
        {...props}
      />
      {showClearToday && (
        <div className="flex items-center justify-between px-4 pb-3 -mt-1">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-primary hover:text-primary/80"
            onClick={onClear}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-primary hover:text-primary/80"
            onClick={onToday}
          >
            Today
          </Button>
        </div>
      )}
    </div>
  );
}
EnhancedCalendar.displayName = "EnhancedCalendar";

export { EnhancedCalendar };
