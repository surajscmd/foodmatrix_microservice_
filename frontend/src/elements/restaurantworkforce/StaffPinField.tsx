import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { input } from "./shared";

export default function StaffPinField({
  label,
  initialFocus = false,
}: {
  label: string;
  initialFocus?: boolean;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name="pin"
          className={input + " pr-11 font-mono tracking-wider"}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          inputMode="numeric"
          pattern="[0-9]{4,6}"
          maxLength={6}
          required
          aria-describedby={id + "-hint"}
          data-initial-focus={initialFocus || undefined}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-lg text-zinc-400 hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-300"
          aria-label={visible ? "Hide PIN" : "Show PIN"}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? (
            <EyeOff size={16} aria-hidden />
          ) : (
            <Eye size={16} aria-hidden />
          )}
        </button>
      </div>
      <p id={id + "-hint"} className="text-[11px] text-zinc-400">
        Enter 4 to 6 digits.
      </p>
    </div>
  );
}
