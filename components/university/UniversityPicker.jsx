"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, PenLine } from "lucide-react";

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

export default function UniversityPicker({
  universities,
  value,
  onChange,
  placeholder = "Search university...",
}) {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [search, setSearch] = useState("");

  const list = useMemo(() => {
    return [...universities].sort((a, b) => a.localeCompare(b));
  }, [universities]);

  const query = search.trim();
  const queryLower = query.toLowerCase();
  const hasMatch =
    !query || list.some((item) => item.toLowerCase().includes(queryLower));

  // No list match — keep what the user typed and switch the FIELD itself
  // into typing mode (dropdown closes, text stays in the same place).
  const useTypedValue = () => {
    if (!query) return;
    onChange(query);
    setTyping(true);
    setOpen(false);
  };

  // Clicking "Other" closes the dropdown and the field becomes typeable.
  // A real list selection is cleared; existing manual text is kept.
  const startTyping = () => {
    if (list.includes(value)) onChange("");
    setTyping(true);
    setOpen(false);
  };

  if (typing) {
    return (
      <div className="relative">
        <Input
          autoFocus
          className="pr-9"
          value={value ?? ""}
          onChange={(e) => {
            setTyping(true);
            onChange(e.target.value);
          }}
          placeholder="Type the university name"
          data-testid="input-intended_university-other"
        />
        <button
          type="button"
          title="Pick from the university list"
          aria-label="Pick from the university list"
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
          onClick={() => setTyping(false)}
        >
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value || placeholder}
            </span>

            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] max-w-[92vw] p-0"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder="Search university..."
              value={search}
              onValueChange={setSearch}
            />

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

              {(!query || !hasMatch) && (
                <div className="mx-1 my-1 h-px bg-border" aria-hidden="true" />
              )}

              <CommandGroup>
                {query && !hasMatch ? (
                  <CommandItem
                    forceMount
                    value={`typed-${queryLower}`}
                    onSelect={useTypedValue}
                  >
                    <PenLine className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 truncate">
                      Use &quot;{query}&quot; — enter manually
                    </span>
                  </CommandItem>
                ) : !query ? (
                  <CommandItem
                    forceMount
                    className="min-h-9 whitespace-nowrap leading-5"
                    value="Other university enter manually"
                    onSelect={startTyping}
                  >
                    <PenLine className="h-4 w-4 shrink-0" />
                    Other university — type it in
                  </CommandItem>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
