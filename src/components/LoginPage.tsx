import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "../hooks/useRouter";
import { ApiError, authForgotPassword, authResetPassword } from "../lib/api";

type Mode = "signin" | "signup" | "reset";

type Props = { redirect?: string };

const readResetToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  const m = hash.match(/[?&]token=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);
  const search = window.location.search;
  const s = search.match(/[?&]token=([^&]+)/);
  return s ? decodeURIComponent(s[1]) : null;
};

export function LoginPage({ redirect }: Props) {
  const { signIn, createAccount } = useAuth();
  const { navigate } = useRouter();

  const initialToken = readResetToken();

  const [mode, setMode] = useState<Mode>(initialToken ? "reset" : "signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState(
    "United Arab Emirates",
  );
  const [resetToken, setResetToken] = useState(initialToken ?? "");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [forgotSending, setForgotSending] = useState(false);

  useEffect(() => {
    if (initialToken) setResetToken(initialToken);
  }, [initialToken]);

  const goAfterAuth = () => {
    if (redirect === "/checkout") navigate({ name: "checkout" });
    else navigate({ name: "account" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        const res = await signIn(email, password);
        if (!res.ok) setError(res.error);
        else goAfterAuth();
      } else if (mode === "signup") {
        if (password !== confirm) {
          setError("Passwords do not match.");
          return;
        }
        const res = await createAccount({
          fullName,
          email,
          password,
          dateOfBirth,
          nationality,
          countryOfResidence,
        });
        if (!res.ok) setError(res.error);
        else goAfterAuth();
      } else {
        if (!resetToken.trim()) {
          setError("Reset token is required.");
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }
        if (password !== confirm) {
          setError("Passwords do not match.");
          return;
        }
        try {
          await authResetPassword({ token: resetToken.trim(), password });
          setInfo("Password reset. Please sign in with your new password.");
          setMode("signin");
          setPassword("");
          setConfirm("");
        } catch (err) {
          const msg =
            err instanceof ApiError
              ? err.message
              : "Could not reset password.";
          setError(msg);
        }
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email above, then click Forgot your password.");
      return;
    }
    setError(null);
    setInfo(null);
    setForgotSending(true);
    try {
      const res = await authForgotPassword(trimmed);
      setInfo(res.message ?? "If an account exists, a reset link has been sent.");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Could not send reset link. Please try again.";
      setError(msg);
    } finally {
      setForgotSending(false);
    }
  };

  return (
    <section className="container auth">
      <div className="auth__card">
        <div className="auth__tabs" role="tablist" aria-label="Sign in or create account">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            className={`auth__tab${mode === "signin" ? " auth__tab--active" : ""}`}
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={`auth__tab${mode === "signup" ? " auth__tab--active" : ""}`}
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
          >
            Create account
          </button>
        </div>

        <header className="auth__head">
          <span className="mono eyebrow">
            {mode === "signin"
              ? "Welcome back"
              : mode === "signup"
                ? "Create your account"
                : "Reset password"}
          </span>
          <h1 className="auth__title">
            {mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Choose a new password"}
          </h1>
          <p className="auth__lede">
            {mode === "signin"
              ? "Log in to your Liora Healthcare account to view your treatments and orders."
              : mode === "signup"
                ? "Just a few details to get started."
                : "Enter the reset token from your email and pick a new password."}
          </p>
        </header>

        <form className="auth__form" onSubmit={onSubmit} noValidate>
          {mode === "signup" && (
            <div className="field">
              <label htmlFor="au-name">Full name</label>
              <input
                id="au-name"
                autoComplete="name"
                placeholder="Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          {mode !== "reset" && (
            <div className="field">
              <label htmlFor="au-email">Email</label>
              <input
                id="au-email"
                type="email"
                autoComplete="email"
                placeholder="you@lab.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}
          {mode === "reset" && (
            <div className="field">
              <label htmlFor="au-token">Reset token</label>
              <input
                id="au-token"
                autoComplete="one-time-code"
                placeholder="From your email"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
              />
            </div>
          )}
          {mode === "signup" && (
            <>
              <div className="field">
                <label htmlFor="au-dob">Date of birth</label>
                <input
                  id="au-dob"
                  type="date"
                  autoComplete="bday"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="au-nat">Nationality</label>
                <input
                  id="au-nat"
                  placeholder="Emirati"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="au-cor">Country of residence</label>
                <input
                  id="au-cor"
                  autoComplete="country-name"
                  placeholder="United Arab Emirates"
                  value={countryOfResidence}
                  onChange={(e) => setCountryOfResidence(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          <div className="field">
            <label htmlFor="au-pass">
              {mode === "reset" ? "New password" : "Password"}
            </label>
            <input
              id="au-pass"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {mode === "signin" && (
              <div className="field__meta">
                <button
                  type="button"
                  className="auth__link"
                  onClick={onForgotPassword}
                  disabled={forgotSending}
                >
                  {forgotSending ? "Sending…" : "Forgot your password?"}
                </button>
              </div>
            )}
          </div>
          {(mode === "signup" || mode === "reset") && (
            <div className="field">
              <label htmlFor="au-conf">Confirm password</label>
              <input
                id="au-conf"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          )}

          {error && <p className="auth__error">{error}</p>}
          {info && <p className="auth__info">{info}</p>}

          <button
            type="submit"
            className="btn btn--primary auth__submit"
            disabled={submitting}
          >
            {submitting
              ? mode === "signin"
                ? "Signing in…"
                : mode === "signup"
                  ? "Creating account…"
                  : "Resetting password…"
              : mode === "signin"
                ? "Log in"
                : mode === "signup"
                  ? "Create account"
                  : "Reset password"}
          </button>

          {mode === "signin" ? (
            <p className="auth__foot">
              <span>
                No account?{" "}
                <button
                  type="button"
                  className="auth__link"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                >
                  Create one
                </button>
              </span>
            </p>
          ) : mode === "signup" ? (
            <p className="auth__foot">
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  className="auth__link"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                >
                  Sign in
                </button>
              </span>
            </p>
          ) : (
            <p className="auth__foot">
              <button
                type="button"
                className="auth__link"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
              >
                Back to sign in
              </button>
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
