import {
  Boxes,
  CalendarDays,
  ChefHat,
  ClipboardList,
  ReceiptText,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import servicePhoto from "../../../public/foodmatrix-login-service-hq.webp";
import glass from "@/elements/branding/restaurant-glass.module.css";
import styles from "./login-screen.module.css";

const orderSteps = [
  { label: "Waiter pad", status: "Order sent", Icon: ClipboardList },
  { label: "Kitchen display", status: "Preparing", Icon: ChefHat },
  { label: "Cashier POS", status: "Checkout", Icon: ReceiptText },
];

const workspaceAreas = [
  { label: "Inventory", Icon: Boxes },
  { label: "Shifts & payroll", Icon: CalendarDays },
  { label: "Franchise locations", Icon: Store },
];

export default function LoginWorkspacePreview() {
  return (
    <section
      aria-labelledby="workspace-preview-heading"
      className={styles.showcase}
    >
      <header className={styles.showcaseHeading}>
        <h2 id="workspace-preview-heading">
          From the floor <span>to the kitchen.</span>
        </h2>
        <p>
          Follow an order through service and manage stock and staff across your
          restaurants.
        </p>
      </header>

      <figure className={styles.servicePreview}>
        <Image
          src={servicePhoto}
          alt="A server and chef review a tablet order at the kitchen pass."
          fill
          unoptimized
          className={styles.servicePhoto}
        />

        <figcaption className={`${glass.surface} ${styles.orderCard}`}>
          <div className={styles.orderHeading}>
            <span className={styles.orderTable}>
              <UtensilsCrossed aria-hidden="true" size={14} strokeWidth={1.7} />
              Table 07
            </span>
            <span className={styles.orderExample}>Example order</span>
          </div>

          <ol className={styles.orderSteps}>
            {orderSteps.map(({ label, status, Icon }) => (
              <li key={label} className={styles.orderStep}>
                <span className={styles.stepIcon} aria-hidden="true">
                  <Icon size={17} strokeWidth={1.7} />
                </span>
                <span className={styles.stepLabel}>{label}</span>
                <span className={styles.stepStatus}>{status}</span>
              </li>
            ))}
          </ol>
        </figcaption>
      </figure>

      <ul className={styles.workspaceAreas}>
        {workspaceAreas.map(({ label, Icon }) => (
          <li key={label}>
            <Icon aria-hidden="true" size={17} strokeWidth={1.7} />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
