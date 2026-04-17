"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Loader2,
  Plus,
  Webhook,
} from "lucide-react";
import { id } from "@instantdb/react";

const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL ||
  "https://captain-hook.deno.dev";

const CRON_PRESETS: ReadonlyArray<{
  readonly label: string;
  readonly value: string;
}> = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 2 hours", value: "0 */2 * * *" },
  { label: "Every 4 hours", value: "0 */4 * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every 12 hours", value: "0 */12 * * *" },
  { label: "Daily at midnight UTC", value: "0 0 * * *" },
  { label: "Daily at 9am UTC", value: "0 9 * * *" },
  { label: "Weekdays at 9am UTC", value: "0 9 * * 1-5" },
];

const cronToHuman = (expr: string): string => {
  const preset = CRON_PRESETS.find((p) => p.value === expr);
  if (preset) return preset.label;
  return expr;
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied
        ? <Check className="h-3.5 w-3.5 text-hook" />
        : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
};

const CreateRouteForm = ({
  onClose,
  userId,
}: {
  onClose: () => void;
  userId: string;
}) => {
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<"webhook" | "cron">(
    "webhook",
  );
  const [cronExpression, setCronExpression] = useState("0 * * * *");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const routeId = id();
    await db.transact(
      db.tx.routes[routeId]
        .update({
          name: name.trim(),
          triggerType,
          cronExpression: triggerType === "cron" ? cronExpression : "",
          scriptCode: "",
          scriptFunctionName: "",
          allowedHosts: [],
          allowedSecrets: [],
          active: true,
          createdAt: Date.now(),
        })
        .link({ owner: userId }),
    );
    onClose();
  };

  return (
    <div className="border border-border p-6 space-y-4">
      <h3 className="font-bold text-sm">New automation</h3>
      <div className="space-y-3">
        <Input
          placeholder="Name (e.g. Stripe to Slack)"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)}
          autoFocus
          onKeyDown={(e: React.KeyboardEvent) =>
            e.key === "Enter" && handleCreate()}
        />
        <div className="flex gap-2">
          <button
            onClick={() => setTriggerType("webhook")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border transition-colors ${
              triggerType === "webhook"
                ? "border-hook text-hook"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Webhook className="h-3.5 w-3.5" />
            Webhook
          </button>
          <button
            onClick={() => setTriggerType("cron")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border transition-colors ${
              triggerType === "cron"
                ? "border-hook text-hook"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Cron
          </button>
        </div>
        {triggerType === "cron" && (
          <select
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border bg-background text-foreground"
          >
            {CRON_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

const RouteRow = ({
  route,
}: {
  route: {
    id: string;
    name: string;
    active: boolean;
    triggerType?: string;
    cronExpression?: string;
    events?: Array<{ id: string }>;
  };
}) => {
  const webhookUrl = `${WEBHOOK_BASE_URL}/w/${route.id}`;
  const eventCount = route.events?.length ?? 0;
  const isWebhook = (route.triggerType ?? "webhook") === "webhook";

  return (
    <a
      href={`/dashboard/routes/${route.id}`}
      className="block border border-border p-4 hover:border-hook/50 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`h-2 w-2 shrink-0 ${
              route.active ? "bg-green-500" : "bg-muted-foreground/30"
            }`}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isWebhook
                ? (
                  <Webhook className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )
                : (
                  <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              <p className="font-bold text-sm truncate">{route.name}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isWebhook
                ? (
                  <>
                    <code className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">
                      {webhookUrl}
                    </code>
                    <span
                      onClick={(e) => e.preventDefault()}
                      onKeyDown={() => {}}
                      role="button"
                      tabIndex={0}
                    >
                      <CopyButton text={webhookUrl} />
                    </span>
                  </>
                )
                : (
                  <span className="text-xs text-muted-foreground">
                    {cronToHuman(route.cronExpression ?? "")}
                  </span>
                )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            <span>{eventCount} events</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-hook transition-colors" />
        </div>
      </div>
    </a>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);

  const { isLoading, error, data } = db.useQuery(
    user
      ? {
        routes: {
          events: {},
          $: { where: { "owner.id": user.id } },
        },
      }
      : null,
  );

  const routes = data?.routes ?? [];

  return (
    <div className="mx-auto max-w-5xl w-full px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Routes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Webhook and cron automations
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New route
        </Button>
      </div>

      {showCreate && user && (
        <CreateRouteForm
          onClose={() => setShowCreate(false)}
          userId={user.id}
        />
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">
          Failed to load routes: {error.message}
        </p>
      )}

      {!isLoading && routes.length === 0 && !showCreate && (
        <div className="border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">
            No routes yet. Create one to get started.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {routes
          .sort(
            (a: { createdAt: number }, b: { createdAt: number }) =>
              b.createdAt - a.createdAt,
          )
          .map(
            (route: {
              id: string;
              name: string;
              active: boolean;
              triggerType?: string;
              cronExpression?: string;
              createdAt: number;
              events?: Array<{ id: string }>;
            }) => <RouteRow key={route.id} route={route} />,
          )}
      </div>
    </div>
  );
};

export { DashboardPage as default };
