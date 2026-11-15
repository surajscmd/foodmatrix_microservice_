import Image from "next/image";
import mark from "../../../public/foodmatrix-mark.png";

export default function FoodMatrixMark({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <Image
      src={mark}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 ${className ?? ""}`}
      loading="eager"
    />
  );
}
