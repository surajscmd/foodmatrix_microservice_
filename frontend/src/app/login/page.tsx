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
          <div className={styles.signInContent}>
            <div className={styles.brand}>
              <FoodMatrixMark size={32} />
              <span>FoodMatrix</span>
            </div>

            <header className={styles.formHeading}>
              <h1 id="sign-in-heading">Sign in</h1>
              <p>Use your work email and password.</p>
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
