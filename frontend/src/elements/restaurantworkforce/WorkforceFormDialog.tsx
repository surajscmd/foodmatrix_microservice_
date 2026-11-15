import {
  useEffect,
  useId,
  useRef,
  type FormEventHandler,
  type ReactNode,
} from "react";
import { X, type LucideIcon } from "lucide-react";
import { secondary } from "./shared";

export default function WorkforceFormDialog({
  title,
  icon: Icon,
  saving,
  onClose,
  onSubmit,
  actions,
  children,
}: {
  title: string;
  icon: LucideIcon;
  saving: boolean;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  actions: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>("[data-initial-focus]")?.focus();

    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-zinc-700 bg-[#111217] p-0 text-zinc-100 shadow-2xl shadow-black/60 backdrop:bg-black/65 backdrop:backdrop-blur-sm"
    >
      <form
        onSubmit={onSubmit}
        className="flex max-h-[calc(100dvh-2rem)] flex-col"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-400/20 bg-linear-to-r from-teal-800 to-slate-800 px-4 py-3">
          <h2
            id={titleId}
            className="flex items-center gap-2.5 text-sm font-semibold text-white"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-300 text-emerald-950">
              <Icon size={16} aria-hidden />
            </span>
            {title}
          </h2>
          <button
            type="button"
            className={secondary}
            aria-label="Close dialog"
            onClick={onClose}
            disabled={saving}
          >
            <X size={15} aria-hidden />
          </button>
        </div>
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-4">
          {children}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-white/8 bg-zinc-950/60 px-4 py-3">
          <button
            type="button"
            className={secondary}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          {actions}
        </div>
      </form>
    </dialog>
  );
}
