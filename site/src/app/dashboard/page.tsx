"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  ChevronRight,
  Activity,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { id } from "@instantdb/react";

const WEBHOOK_BASE_URL =
  process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL || "https://captain-hook.deno.dev";

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
      {copied ? (
        <Check className="h-3.5 w-3.5 text-hook" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
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
  const [destinationUrl, setDestinationUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !destinationUrl.trim()) return;
    setLoading(true);
    const routeId = id();
    await db.transact(
      db.tx.routes[routeId]
        .update({
          name: name.trim(),
          destinationUrl: destinationUrl.trim(),
          scriptCode: `transform = (payload: Any): Any => {\n  return payload\n}`,
          scriptFunctionName: "transform",
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
      <h3 className="font-bold text-sm">New route</h3>
      <div className="space-y-3">
        <Input
          placeholder="Route name (e.g. Stripe to Slack)"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setName(e.target.value)
          }
          autoFocus
        />
        <Input
          placeholder="Destination URL (e.g. https://hooks.slack.com/...)"
          value={destinationUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDestinationUrl(e.target.value)
          }
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleCreate}
          disabled={!name.trim() || !destinationUrl.trim() || loading}
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
    destinationUrl: string;
    active: boolean;
    events?: Array<{ id: string }>;
  };
}) => {
  const webhookUrl = `${WEBHOOK_BASE_URL}/w/${route.id}`;
  const eventCount = route.events?.length ?? 0;

  return (
    <a
      href={`/dashboard/routes/${route.id}`}
      className="block border border-border p-4 hover:border-hook/50 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`h-2 w-2 shrink-0 ${route.active ? "bg-green-500" : "bg-muted-foreground/30"}`}
          />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{route.name}</p>
            <div className="flex items-center gap-2 mt-1">
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
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            <span>{eventCount} events</span>
          </div>
          <a
            href={route.destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Routes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Incoming webhook endpoints with safescript transformations
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
            No routes yet. Create one to start receiving webhooks.
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
              destinationUrl: string;
              active: boolean;
              createdAt: number;
              events?: Array<{ id: string }>;
            }) => (
              <RouteRow key={route.id} route={route} />
            ),
          )}
      </div>
    </div>
  );
};

export { DashboardPage as default };
