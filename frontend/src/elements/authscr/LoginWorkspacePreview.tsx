import {
  ArrowRight,
  Bell,
  BookOpen,
  Boxes,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  ReceiptText,
  Store,
  Users,
} from "lucide-react";
import FoodMatrixMark from "@/elements/branding/FoodMatrixMark";
import styles from "./login-workflow.module.css";

const steps = [
  {
    title: "Take the order",
    description: "Waiter pad & POS",
    Icon: ClipboardList,
  },
  { title: "Prepare & serve", description: "Kitchen display", Icon: ChefHat },
  {
    title: "Settle the bill",
    description: "Payments & receipts",
    Icon: ReceiptText,
  },
];

const workspaceAreas = [
  {
    title: "Menu management",
    description: "Prices, modifiers & recipes",
    Icon: BookOpen,
  },
  {
    title: "Inventory & supply",
    description: "Stock, requests & deliveries",
    Icon: Boxes,
  },
  {
    title: "Staff & payroll",
    description: "Shifts, attendance, leave & pay",
    Icon: Users,
  },
  {
    title: "Multiple locations",
    description: "Restaurants, roles & access",
    Icon: Store,
  },
  {
    title: "Live alerts",
    description: "Stock, delivery & staff updates",
    Icon: Bell,
  },
  {
    title: "Business overview",
    description: "Dashboards, reports & settings",
    Icon: LayoutDashboard,
  },
];

export default function LoginWorkspacePreview() {
  return (
    <section
      className={styles.showcase}
      aria-labelledby="workspace-preview-heading"
    >
      <header className={styles.heading}>
        <span className={styles.eyebrow}>Restaurant management, connected</span>
        <h2 id="workspace-preview-heading">
          Your entire restaurant.
          <br />
          <span>One workspace.</span>
        </h2>
        <p>
          Manage orders, kitchen, inventory and staff across your restaurants.
        </p>
      </header>

      <div className={styles.diagram}>
        <div className={styles.brandHub}>
          <span className={styles.orbit} aria-hidden="true" />
          <span className={styles.hubLogo}>
            <FoodMatrixMark size={72} />
          </span>
          <span className={styles.hubCaption}>
            Connected from order to checkout
          </span>
        </div>
        <div className={styles.serviceFlow}>
          <ol className={styles.steps} aria-label="Restaurant service flow">
            {steps.map(({ title, description, Icon }, index) => (
              <li key={title}>
                <span className={styles.stepIcon}>
                  <Icon size={21} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <strong>{title}</strong>
                <span>{description}</span>
                {index < steps.length - 1 && (
                  <ArrowRight
                    className={styles.arrow}
                    size={16}
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
          <div className={styles.stockUpdate}>
            <span className={styles.stepIcon}>
              <Boxes size={21} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <strong>Reduce restaurant stock</strong>
            <small>When kitchen items are ready</small>
          </div>
        </div>
        <ul
          className={styles.workspaceAreas}
          aria-label="Restaurant management tools"
        >
          {workspaceAreas.map(({ title, description, Icon }) => (
            <li key={title}>
              <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
