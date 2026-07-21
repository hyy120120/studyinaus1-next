"use client";

// SponsorList — manages the sponsor profiles being evaluated: switch the
// active profile, add another sponsor (father + mother co-sponsors), or
// remove one. Keeps plain React state via the parent's onChange.

import { Plus, X } from "lucide-react";
import { RELATIONSHIP_OPTIONS } from "@/constants/weights";

const relationshipLabel = (key) =>
    RELATIONSHIP_OPTIONS.find((o) => o.value === key)?.label || "Sponsor";

const MAX_SPONSORS = 3;

export default function SponsorList({ profiles, activeId, scores = {}, onSelect, onAdd, onRemove }) {
    return (
        <div className="flex flex-wrap items-center gap-2" data-testid="sponsor-list">
            {profiles.map((p, i) => {
                const active = p.id === activeId;
                const score = scores[p.id];
                return (
                    <div
                        key={p.id}
                        className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                            active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-secondary hover:border-primary/50"
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => onSelect(p.id)}
                            className="inline-flex items-center gap-1.5"
                            data-testid={`sponsor-chip-${p.id}`}
                        >
                            {relationshipLabel(p.relationship)} {p.relationship ? "" : `#${i + 1}`}
                            {score !== undefined && (
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${active ? "bg-white/20" : "bg-muted"}`}>
                                    {score}
                                </span>
                            )}
                        </button>
                        {profiles.length > 1 && (
                            <button
                                type="button"
                                onClick={() => onRemove(p.id)}
                                aria-label={`Remove ${relationshipLabel(p.relationship)}`}
                                className={`rounded-full p-0.5 ${active ? "hover:bg-white/20" : "hover:bg-muted"}`}
                                data-testid={`sponsor-remove-${p.id}`}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                );
            })}
            {profiles.length < MAX_SPONSORS && (
                <button
                    type="button"
                    onClick={onAdd}
                    className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    data-testid="sponsor-add"
                >
                    <Plus size={13} /> Add co-sponsor
                </button>
            )}
        </div>
    );
}
