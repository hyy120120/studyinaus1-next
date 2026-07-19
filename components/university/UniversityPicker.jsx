"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

export default function UniversityPicker({
  universities,
  value,
  onChange,
  placeholder = "Search university...",
}) {
  const [open, setOpen] = useState(false);

  const list = useMemo(() => {
    return [...universities].sort((a, b) => a.localeCompare(b));
  }, [universities]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {value || placeholder}
          </span>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search university..." />

          {/* CommandList is the independently scrollable region.
              data-lenis-prevent/overscroll-contain (set in ui/command) keep
              wheel events inside the dropdown instead of scrolling the page. */}
          <CommandList className="max-h-72">
            <CommandEmpty>No university found.</CommandEmpty>

            <CommandGroup>
              {list.map((university) => (
                <CommandItem
                  key={university}
                  value={university}
                  onSelect={() => {
                    onChange(university);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === university ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {university}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
