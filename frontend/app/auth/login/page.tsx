"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";

import { cn } from "@/lib/utils";

type UserRole = "employer" | "freelancer";

type MockUser = {
  id: string;
  role: UserRole;
  name: string;
  email: string;
};

const inputClassName =
  "h-10 w-full rounded-lg border border-border/40 bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-green-500/60";

function getStoredRole(): UserRole | null {
  if (typeof window === "undefined") {
    return null;
  }

  const role = window.localStorage.getItem("role");

  return role === "employer" || role === "freelancer" ? role : null;
}

function getDashboardPath(role: UserRole) {
  return role === "employer"
    ? "/employer/dashboard"
    : "/freelancer/workspace";
}

function getNameFromEmail(email: string) {
  const prefix = email.split("@")[0] || "user";

  return prefix
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setRole(getStoredRole());
  }, []);

  const persistUserAndRedirect = (payload: { name: string; email: string }) => {
    const storedRole = getStoredRole();

    if (!storedRole) {
      router.push("/auth/role");
      return;
    }

    const mockUser: MockUser = {
      id: `user_${Date.now()}`,
      role: storedRole,
      name: payload.name,
      email: payload.email,
    };

    window.localStorage.setItem("user", JSON.stringify(mockUser));
    router.push(getDashboardPath(storedRole));
  };

  const handleSignIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    persistUserAndRedirect({
      name: getNameFromEmail(signInEmail),
      email: signInEmail,
    });
  };

  const handleCreateAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (createPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    persistUserAndRedirect({
      name: createName || getNameFromEmail(createEmail),
      email: createEmail,
    });
  };

  return (
    <main className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-[2rem] border border-border/60 bg-white/85 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur dark:bg-zinc-900/70">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
            {role === "employer"
              ? "Employer access"
              : role === "freelancer"
                ? "Freelancer access"
                : "Welcome"}
          </p>
          <h1 className="mt-4 text-3xl font-medium tracking-tight text-foreground">
            Access your MilestoneAI workspace
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Sign in or create an account. Your selected role shapes the next
            dashboard after authentication.
          </p>
        </div>

        <Tabs.Root defaultValue="sign-in" className="mt-8">
          <Tabs.List className="grid grid-cols-2 rounded-xl border border-border/50 bg-foreground/[0.03] p-1">
            <Tabs.Trigger
              value="sign-in"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Sign In
            </Tabs.Trigger>
            <Tabs.Trigger
              value="create-account"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Create Account
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="sign-in" className="mt-6">
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-2">
                <label htmlFor="sign-in-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="sign-in-email"
                  type="email"
                  value={signInEmail}
                  onChange={(event) => setSignInEmail(event.target.value)}
                  className={inputClassName}
                  placeholder="alex@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="sign-in-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  id="sign-in-password"
                  type="password"
                  value={signInPassword}
                  onChange={(event) => setSignInPassword(event.target.value)}
                  className={inputClassName}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-10 w-full rounded-lg bg-green-600 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                Sign In
              </motion.button>
            </form>
          </Tabs.Content>

          <Tabs.Content value="create-account" className="mt-6">
            <form className="space-y-4" onSubmit={handleCreateAccount}>
              <div className="space-y-2">
                <label htmlFor="create-name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <input
                  id="create-name"
                  type="text"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  className={inputClassName}
                  placeholder="Alex Mercer"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="create-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="create-email"
                  type="email"
                  value={createEmail}
                  onChange={(event) => setCreateEmail(event.target.value)}
                  className={inputClassName}
                  placeholder="alex@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="create-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  id="create-password"
                  type="password"
                  value={createPassword}
                  onChange={(event) => setCreatePassword(event.target.value)}
                  className={inputClassName}
                  placeholder="Create a password"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-foreground"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClassName}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-10 w-full rounded-lg bg-green-600 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                Create Account
              </motion.button>
            </form>
          </Tabs.Content>
        </Tabs.Root>

        <div className="mt-6 min-h-6">
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </div>

        <div className="mt-2 flex items-center justify-between gap-4 text-sm">
          <Link
            href="/auth/role"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to role selection
          </Link>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              role
                ? "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300"
                : "border-border/60 text-muted-foreground",
            )}
          >
            {role ? `Role: ${role}` : "Select a role first"}
          </span>
        </div>
      </div>
    </main>
  );
}
