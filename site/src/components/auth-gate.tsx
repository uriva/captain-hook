"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Anchor, ArrowRight, Loader2, Mail } from "lucide-react";

const SignInForm = ({
  onSendCode,
  onVerifyCode,
}: {
  onSendCode: (email: string) => Promise<unknown>;
  onVerifyCode: (email: string, code: string) => Promise<unknown>;
}) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onSendCode(email.trim());
      setStep("code");
    } catch {
      setError("Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onVerifyCode(email.trim(), code.trim());
    } catch {
      setError("Invalid code");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto space-y-6 px-6">
        <div className="space-y-2 text-center">
          <Anchor className="h-8 w-8 text-hook mx-auto" />
          <h1 className="text-xl font-bold tracking-tight">captain hook</h1>
          <p className="text-sm text-muted-foreground">
            {step === "email"
              ? "Sign in with your email"
              : `Code sent to ${email}`}
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {step === "email"
          ? (
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) =>
                  e.key === "Enter" && handleSendCode()}
                autoFocus
              />
              <Button
                onClick={handleSendCode}
                disabled={!email.trim() || loading}
                className="w-full gap-2"
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Mail className="h-4 w-4" />}
                Send magic code
              </Button>
            </div>
          )
          : (
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCode(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) =>
                  e.key === "Enter" && handleVerifyCode()}
                autoFocus
                className="text-center font-mono tracking-widest text-lg"
              />
              <Button
                onClick={handleVerifyCode}
                disabled={!code.trim() || loading}
                className="w-full gap-2"
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ArrowRight className="h-4 w-4" />}
                Verify
              </Button>
              <button
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, user, sendMagicCode, signInWithMagicCode } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <SignInForm
        onSendCode={sendMagicCode}
        onVerifyCode={signInWithMagicCode}
      />
    );
  }

  return <>{children}</>;
};
