import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Calendar } from "@/components/ui/calendar"
import { Button } from "./ui/button";
import { X, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function DateRangeFilter({ from, to, onChange }) {

  const range = {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  }

  function handleSelect(selected) {
    if (!selected) return
    const fromStr = selected.from ? format(selected.from, "yyyy-MM-dd") : ""
    const toStr = selected.to ? format(selected.to, "yyyy-MM-dd") : ""
    const sameDay = fromStr && toStr && fromStr === toStr
    onChange({
      from: fromStr,
      to: sameDay ? "" : toStr,
    })
  }

  function handleClear() {
    onChange({ from: "", to: "" })
  }

  const hasFilter = Boolean(from || to)

  return (
    <div className="relative inline-block">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal h-[50px]",
              hasFilter && "pr-8",
              !range.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {range.from ? (
              range.to ? (
                <>
                  {format(range.from, "d MMM")} – {format(range.to, "d MMM")}
                </>
              ) : (
                format(range.from, "d MMM yyyy")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={1}
            disabled={{ before: new Date() }}
          />
        </PopoverContent>
      </Popover>
      {hasFilter && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
          aria-label="Clear date filter"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}