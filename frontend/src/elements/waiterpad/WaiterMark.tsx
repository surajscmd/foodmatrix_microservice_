import { Utensils } from "lucide-react";

export default function WaiterMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-300 text-emerald-950"
    >
      <Utensils className="size-[18px]" strokeWidth={2.25} />
    </span>
  );
}
