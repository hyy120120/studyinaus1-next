"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const OTHER_UNIVERSITY_OPTION = "__other_university__";

export default function UniversityPicker({
  universities,
  value,
  onChange,
  placeholder = "Search university...",
}) {
  const [open, setOpen] = useState(false);
  const [otherMode, setOtherMode] = useState(false);

  const list = useMemo(() => {
    return [...universities].sort((a, b) => a.localeCompare(b));
  }, [universities]);

  // If the stored value isn't one of the listed universities it was typed
  // manually — keep showing the type-in box so it stays editable.
  const valueIsOther = Boolean(value) && !list.includes(value);
  const showOther = otherMode || valueIsOther;

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal"
          >
            <span className={cn("truncate", showOther && "text-muted-foreground")}>
              {showOther ? "Other university" : value || placeholder}
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
                      setOtherMode(false);
                      onChange(university);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !showOther && value === university ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {university}
                  </CommandItem>
                ))}
                <CommandItem
                  forceMount
                  className="min-h-9 whitespace-nowrap leading-5"
                  value="Other university enter manually"
                  onSelect={() => {
                    setOtherMode(true);
                    if (!valueIsOther) onChange("");
                    setOpen(false);
                  }}
                >
                  Other university — type it in
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {showOther && (
        <Input
          autoFocus
          className="mt-2"
          value={value ?? ""}
          onChange={(e) => {
            setOtherMode(true);
            onChange(e.target.value);
          }}
          placeholder="Type the university name"
          data-testid="input-intended_university-other"
        />
      )}
    </div>
  );
}
