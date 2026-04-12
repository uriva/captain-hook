"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Trash2,
  Plus,
  X,
  Clock,
  AlertCircle,
} from "lucide-react";
import { id as instantId } from "@instantdb/react";

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

const ScriptEditor = ({
  code,
  functionName,
  onSave,
}: {
  code: string;
  functionName: string;
  onSave: (code: string, functionName: string) => void;
}) => {
  const [editCode, setEditCode] = useState(code);
  const [editFn, setEditFn] = useState(functionName);
  const dirty = editCode !== code || editFn !== functionName;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">Script</h3>
        {dirty && (
          <Button
            size="sm"
            onClick={() => onSave(editCode, editFn)}
            className="gap-1"
          >
            Save
          </Button>
        )}
      </div>
      <div className="space-y-2">
        <Input
          value={editFn}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEditFn(e.target.value)
          }
          placeholder="Function name"
          className="font-mono text-sm"
        />
        <Textarea
          value={editCode}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setEditCode(e.target.value)
          }
          rows={12}
          className="font-mono text-sm resize-y"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

const PermissionsEditor = ({
  allowedHosts,
  allowedSecrets,
  onSaveHosts,
  onSaveSecrets,
}: {
  allowedHosts: string[];
  allowedSecrets: string[];
  onSaveHosts: (hosts: string[]) => void;
  onSaveSecrets: (secrets: string[]) => void;
}) => {
  const [hosts, setHosts] = useState(allowedHosts);
  const [secrets, setSecrets] = useState(allowedSecrets);
  const [newHost, setNewHost] = useState("");
  const [newSecret, setNewSecret] = useState("");

  const addHost = () => {
    if (!newHost.trim() || hosts.includes(newHost.trim())) return;
    const updated = [...hosts, newHost.trim()];
    setHosts(updated);
    onSaveHosts(updated);
    setNewHost("");
  };

  const removeHost = (host: string) => {
    const updated = hosts.filter((h) => h !== host);
    setHosts(updated);
    onSaveHosts(updated);
  };

  const addSecret = () => {
    if (!newSecret.trim() || secrets.includes(newSecret.trim())) return;
    const updated = [...secrets, newSecret.trim()];
    setSecrets(updated);
    onSaveSecrets(updated);
    setNewSecret("");
  };

  const removeSecret = (secret: string) => {
    const updated = secrets.filter((s) => s !== secret);
    setSecrets(updated);
    onSaveSecrets(updated);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="font-bold text-sm">Allowed hosts</h3>
        <p className="text-xs text-muted-foreground">
          Hosts the script is permitted to make HTTP requests to
        </p>
        <div className="flex flex-wrap gap-2">
          {hosts.map((host) => (
            <Badge key={host} variant="outline" className="gap-1 font-mono">
              {host}
              <button onClick={() => removeHost(host)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newHost}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewHost(e.target.value)
            }
            placeholder="api.example.com"
            className="font-mono text-sm"
            onKeyDown={(e: React.KeyboardEvent) =>
              e.key === "Enter" && addHost()
            }
          />
          <Button variant="outline" size="sm" onClick={addHost}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-sm">Allowed secrets</h3>
        <p className="text-xs text-muted-foreground">
          Secret names the script is permitted to read or write
        </p>
        <div className="flex flex-wrap gap-2">
          {secrets.map((secret) => (
            <Badge
              key={secret}
              variant="outline"
              className="gap-1 font-mono"
            >
              {secret}
              <button onClick={() => removeSecret(secret)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newSecret}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewSecret(e.target.value)
            }
            placeholder="SLACK_TOKEN"
            className="font-mono text-sm"
            onKeyDown={(e: React.KeyboardEvent) =>
              e.key === "Enter" && addSecret()
            }
          />
          <Button variant="outline" size="sm" onClick={addSecret}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const SecretsManager = ({
  routeId,
  secrets,
}: {
  routeId: string;
  secrets: Array<{ id: string; name: string; value: string }>;
}) => {
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");

  const addSecret = async () => {
    if (!newName.trim() || !newValue.trim()) return;
    const secretId = instantId();
    await db.transact(
      db.tx.secrets[secretId]
        .update({ name: newName.trim(), value: newValue.trim() })
        .link({ route: routeId }),
    );
    setNewName("");
    setNewValue("");
  };

  const deleteSecret = async (secretId: string) => {
    await db.transact(db.tx.secrets[secretId].delete());
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-sm">Secrets</h3>
      <p className="text-xs text-muted-foreground">
        Key-value pairs accessible to the script via readSecret/writeSecret
      </p>
      {secrets.length > 0 && (
        <div className="space-y-2">
          {secrets.map((secret) => (
            <div
              key={secret.id}
              className="flex items-center gap-2 text-sm font-mono"
            >
              <span className="text-hook">{secret.name}</span>
              <span className="text-muted-foreground">=</span>
              <span className="text-muted-foreground truncate max-w-[200px]">
                {"*".repeat(Math.min(secret.value.length, 20))}
              </span>
              <button
                onClick={() => deleteSecret(secret.id)}
                className="text-muted-foreground hover:text-destructive ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNewName(e.target.value)
          }
          placeholder="Name"
          className="font-mono text-sm"
        />
        <Input
          value={newValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setNewValue(e.target.value)
          }
          placeholder="Value"
          type="password"
          className="font-mono text-sm"
        />
        <Button variant="outline" size="sm" onClick={addSecret}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const EventLog = ({
  events,
}: {
  events: Array<{
    id: string;
    status: string;
    latencyMs: number;
    errorMessage?: string;
    timestamp: number;
  }>;
}) => (
  <div className="space-y-3">
    <h3 className="font-bold text-sm">Recent events</h3>
    {events.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        No events yet. Send a webhook to the URL above.
      </p>
    ) : (
      <div className="space-y-1">
        {events
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50)
          .map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 text-xs py-2 border-b border-border last:border-0"
            >
              <div
                className={`h-1.5 w-1.5 shrink-0 ${event.status === "success" ? "bg-green-500" : "bg-destructive"}`}
              />
              <span className="font-mono text-muted-foreground">
                <Clock className="h-3 w-3 inline mr-1" />
                {new Date(event.timestamp).toLocaleString()}
              </span>
              <span className="font-mono">{event.latencyMs}ms</span>
              {event.errorMessage && (
                <span className="text-destructive flex items-center gap-1 truncate">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {event.errorMessage}
                </span>
              )}
            </div>
          ))}
      </div>
    )}
  </div>
);

const RouteDetailPage = () => {
  const params = useParams<{ routeId: string }>();
  const { user } = useAuth();
  const routeId = params.routeId;

  const { isLoading, error, data } = db.useQuery(
    user
      ? {
          routes: {
            secrets: {},
            events: {},
            $: { where: { id: routeId, "owner.id": user.id } },
          },
        }
      : null,
  );

  const route = data?.routes?.[0];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">Error: {error.message}</p>
    );
  }

  if (!route) {
    return (
      <div className="space-y-4">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to routes
        </a>
        <p className="text-sm text-muted-foreground">Route not found.</p>
      </div>
    );
  }

  const webhookUrl = `${WEBHOOK_BASE_URL}/w/${route.id}`;

  const updateRoute = (updates: Record<string, unknown>) => {
    db.transact(db.tx.routes[route.id].update(updates));
  };

  const deleteRoute = async () => {
    await db.transact(db.tx.routes[route.id].delete());
    window.location.href = "/dashboard";
  };

  const parsedHosts: string[] = (route.allowedHosts as string[]) ?? [];

  const parsedSecrets: string[] = (route.allowedSecrets as string[]) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Routes
          </a>
          <h1 className="text-2xl font-bold tracking-tight">{route.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Active</span>
            <Switch
              checked={route.active}
              onCheckedChange={(checked: boolean) =>
                updateRoute({ active: checked })
              }
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={deleteRoute}
            className="text-destructive hover:text-destructive gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="border border-border p-4 space-y-2">
        <p className="text-xs text-muted-foreground font-mono">Webhook URL</p>
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono text-hook">{webhookUrl}</code>
          <CopyButton text={webhookUrl} />
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-2">
          Destination
        </p>
        <code className="text-sm font-mono">{route.destinationUrl}</code>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <ScriptEditor
            code={route.scriptCode}
            functionName={route.scriptFunctionName}
            onSave={(code, fn) =>
              updateRoute({ scriptCode: code, scriptFunctionName: fn })
            }
          />
          <SecretsManager
            routeId={route.id}
            secrets={(route.secrets ?? []) as Array<{
              id: string;
              name: string;
              value: string;
            }>}
          />
        </div>
        <div className="space-y-8">
          <PermissionsEditor
            allowedHosts={parsedHosts}
            allowedSecrets={parsedSecrets}
            onSaveHosts={(hosts) =>
              updateRoute({ allowedHosts: hosts })
            }
            onSaveSecrets={(secrets) =>
              updateRoute({ allowedSecrets: secrets })
            }
          />
          <EventLog
            events={
              (route.events ?? []) as Array<{
                id: string;
                status: string;
                latencyMs: number;
                errorMessage?: string;
                timestamp: number;
              }>
            }
          />
        </div>
      </div>
    </div>
  );
};

export { RouteDetailPage as default };
