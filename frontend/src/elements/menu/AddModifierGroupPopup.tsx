"use client";

import { createPortal } from "react-dom";
import { Check, Layers3, Loader2, Search, X } from "lucide-react";

import type { ModifierGroup } from "@/lib/catalog-api";

interface AddModifierGroupPopupProps {
  isOpen: boolean;
  groups: ModifierGroup[];
  selectedGroupId: string | null;
  searchTerm: string;
  isSubmitting?: boolean;

  onSearchChange: (value: string) => void;
  onSelect: (groupId: string) => void;
  onAdd: () => void;
  onClose: () => void;
}

export default function AddModifierGroupPopup({
  isOpen,
  groups,
  selectedGroupId,
  searchTerm,
  isSubmitting = false,
  onSearchChange,
  onSelect,
  onAdd,
  onClose,
}: AddModifierGroupPopupProps) {
  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(normalizedSearch),
  );

  return createPortal(
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        p-4
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-modifier-group-title"
    >
      {/* BACKDROP */}
      <button
        type="button"
        aria-label="Close add modifier group popup"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
        className="
          absolute
          inset-0
          cursor-default
          bg-black/65
          backdrop-blur-md
        "
      />

      {/* POPUP */}
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className="
          relative
          flex
          w-full
          max-w-xl
          flex-col
          overflow-hidden
          rounded-3xl
          border
          border-zinc-800/90
          bg-gradient-to-br
          from-[#0d1117]
          via-[#090b0f]
          to-[#07090c]
          shadow-[0_30px_90px_rgba(0,0,0,0.65)]
        "
      >
        {/* AMBIENT LIGHT */}
        <div
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-72
            w-72
            rounded-full
            bg-emerald-500/[0.07]
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -left-20
            bottom-0
            h-60
            w-60
            rounded-full
            bg-cyan-500/[0.045]
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            right-1/4
            bottom-0
            h-44
            w-44
            rounded-full
            bg-violet-500/[0.025]
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-emerald-400/80
            to-cyan-400/60
          "
        />

        {/* HEADER */}
        <div
          className="
            relative
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-zinc-800/80
            px-5
            py-4
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                relative
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-emerald-400/20
                bg-gradient-to-br
                from-emerald-400/15
                via-cyan-400/10
                to-violet-400/10
              "
            >
              <Layers3 className="relative h-4.5 w-4.5 text-emerald-300" />
            </div>

            <div className="min-w-0">
              <p
                id="add-modifier-group-title"
                className="text-sm font-semibold text-zinc-100"
              >
                Add Modifier Group
              </p>

              <p className="mt-0.5 text-xs text-zinc-600">
                Choose an existing group for this menu item.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isSubmitting}
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              border-zinc-800
              bg-zinc-900
              text-zinc-500
              transition
              hover:border-zinc-700
              hover:bg-zinc-800
              hover:text-zinc-200
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="relative p-5">
          {/* SEARCH */}
          <div
            className="
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-zinc-800
              bg-zinc-900/60
              px-3
            "
          >
            <Search className="h-4 w-4 shrink-0 text-zinc-600" />

            <input
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search modifier groups..."
              className="
                h-10
                w-full
                bg-transparent
                text-sm
                text-zinc-200
                outline-none
                placeholder:text-zinc-600
              "
            />
          </div>

          {/* GROUP LIST */}
          <div
            className="
              mt-4
              max-h-[390px]
              overflow-y-auto
              rounded-xl
              border
              border-zinc-800
            "
          >
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => {
                const isSelected = selectedGroupId === group.id;

                const modifierCount = group.modifiers?.length ?? 0;

                const selectionText =
                  group.minSelections === 0 && group.maxSelections === 1
                    ? "Optional · choose up to 1"
                    : `Choose ${group.minSelections}–${group.maxSelections}`;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => onSelect(group.id)}
                    disabled={isSubmitting}
                    className={`
                      flex
                      w-full
                      items-center
                      justify-between
                      gap-4
                      border-b
                      border-zinc-800/70
                      px-4
                      py-3.5
                      text-left
                      transition
                      last:border-b-0
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      ${
                        isSelected
                          ? "bg-emerald-500/[0.07]"
                          : "bg-transparent hover:bg-zinc-900/70"
                      }
                    `}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          border
                          ${
                            isSelected
                              ? "border-emerald-400/30 bg-emerald-400/10"
                              : "border-zinc-800 bg-zinc-900"
                          }
                        `}
                      >
                        {isSelected ? (
                          <Check className="h-4 w-4 text-emerald-300" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-zinc-700" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {group.name}
                        </p>

                        <p className="mt-0.5 text-[10px] text-zinc-600">
                          {selectionText}
                          <span className="mx-1.5 text-zinc-800">·</span>
                          {modifierCount}{" "}
                          {modifierCount === 1 ? "option" : "options"}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="shrink-0 text-[10px] font-medium text-emerald-400">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-5 py-10 text-center">
                <Layers3 className="mx-auto h-5 w-5 text-zinc-700" />

                <p className="mt-2 text-xs font-medium text-zinc-500">
                  No modifier groups available
                </p>

                <p className="mt-1 text-[10px] text-zinc-700">
                  Create modifier groups in Modifier Manager first.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div
          className="
            relative
            flex
            items-center
            justify-end
            gap-2
            border-t
            border-zinc-800/80
            px-5
            py-4
          "
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="
              rounded-lg
              border
              border-zinc-800
              bg-zinc-900
              px-4
              py-2
              text-xs
              font-medium
              text-zinc-400
              transition
              hover:border-zinc-700
              hover:bg-zinc-800
              hover:text-zinc-200
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onAdd}
            disabled={!selectedGroupId || isSubmitting}
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-gradient-to-r
              from-emerald-400
              to-cyan-400
              px-4
              py-2
              text-xs
              font-semibold
              text-zinc-950
              transition
              hover:brightness-105
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Add Group
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
