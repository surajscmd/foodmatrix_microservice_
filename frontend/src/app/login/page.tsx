import type { Metadata } from "next";
import LoginForm from "@/elements/authscr/Loginform";
import LoginWorkspacePreview from "@/elements/authscr/LoginWorkspacePreview";
import styles from "@/elements/authscr/login-screen.module.css";
import FoodMatrixMark from "@/elements/branding/FoodMatrixMark";

export const metadata: Metadata = {
  title: "Sign in | FoodMatrix",
};

export default function LoginScreen() {
  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <section aria-labelledby="sign-in-heading" className={styles.signIn}>
          <header className={styles.brand} aria-label="FoodMatrix">
            <div>
              <span>FoodMatrix</span>
              <small>Restaurant operations, connected.</small>
            </div>
            <FoodMatrixMark size={48} />
          </header>
          <div className={styles.signInContent}>
            <header className={styles.formHeading}>
              <span className={styles.eyebrow}>Your FoodMatrix workspace</span>
              <h1 id="sign-in-heading">Ready for service?</h1>
              <p>Sign in to bring your floor, kitchen and team together.</p>
            </header>

            <LoginForm />

            <p className={styles.accountHelp}>
              Need access? Contact your workspace administrator.
            </p>
          </div>
        </section>

        <LoginWorkspacePreview />
      </div>
    </main>
  );
}
