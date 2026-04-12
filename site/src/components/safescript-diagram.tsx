"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";

const ANALYZE_URL =
  process.env.NEXT_PUBLIC_ANALYZE_URL ||
  "https://captain-hook-server.uriva.deno.net/analyze";

type SignatureData = {
  name: string;
  params: Array<{ name: string; type: string }>;
  returnType: string | null;
  secretsRead: string[];
  secretsWritten: string[];
  hosts: string[];
  envReads: string[];
  dataFlow: Record<string, string[]>;
  returnSources: string[];
  memoryBytes: number;
  runtimeMs: number;
  diskBytes: number;
};

type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: SignatureData };

const NODE_W = 160;
const NODE_H = 36;
const COL_GAP = 100;
const ROW_GAP = 16;

const columnX = (col: number) => 40 + col * (NODE_W + COL_GAP);

type NodeInfo = {
  label: string;
  x: number;
  y: number;
  kind: "param" | "secret-read" | "secret-write" | "host" | "env" | "return";
};

type Edge = {
  from: NodeInfo;
  to: NodeInfo;
};

const layoutNodes = (
  sig: SignatureData,
): { nodes: NodeInfo[]; edges: Edge[]; width: number; height: number } => {
  const nodes: NodeInfo[] = [];
  const nodeMap = new Map<string, NodeInfo>();

  const addNode = (
    key: string,
    label: string,
    col: number,
    row: number,
    kind: NodeInfo["kind"],
  ) => {
    const node: NodeInfo = {
      label,
      x: columnX(col),
      y: 40 + row * (NODE_H + ROW_GAP),
      kind,
    };
    nodes.push(node);
    nodeMap.set(key, node);
    return node;
  };

  // Column 0: Inputs (params + env reads)
  let row0 = 0;
  sig.params.forEach((p) => {
    addNode(`param:${p.name}`, p.name, 0, row0, "param");
    row0++;
  });
  sig.envReads.forEach((e) => {
    addNode(`env:${e}`, e, 0, row0, "env");
    row0++;
  });

  // Column 1: Secrets read
  let row1 = 0;
  sig.secretsRead.forEach((s) => {
    addNode(`secret:${s}`, s, 1, row1, "secret-read");
    row1++;
  });

  // Column 2: Hosts
  let row2 = 0;
  sig.hosts.forEach((h) => {
    addNode(`host:${h}`, h, 2, row2, "host");
    row2++;
  });

  // Column 3: Secrets written + return
  let row3 = 0;
  sig.secretsWritten.forEach((s) => {
    addNode(`secret-write:${s}`, s, 3, row3, "secret-write");
    row3++;
  });
  if (sig.returnType) {
    addNode("return", "return", 3, row3, "return");
    row3++;
  }

  // Edges from dataFlow
  const edges: Edge[] = [];
  Object.entries(sig.dataFlow).forEach(([sink, sources]) => {
    const toNode = nodeMap.get(sink);
    if (!toNode) return;
    sources.forEach((source) => {
      const fromNode = nodeMap.get(source);
      if (fromNode) {
        edges.push({ from: fromNode, to: toNode });
      }
    });
  });

  // Edges from returnSources
  const returnNode = nodeMap.get("return");
  if (returnNode) {
    sig.returnSources.forEach((source) => {
      const fromNode = nodeMap.get(source);
      if (fromNode) {
        edges.push({ from: fromNode, to: returnNode });
      }
    });
  }

  const maxRow = Math.max(row0, row1, row2, row3, 1);
  const maxCol = row3 > 0 ? 3 : row2 > 0 ? 2 : row1 > 0 ? 1 : 0;

  return {
    nodes,
    edges,
    width: columnX(maxCol) + NODE_W + 40,
    height: 40 + maxRow * (NODE_H + ROW_GAP) + 20,
  };
};

const kindColors: Record<NodeInfo["kind"], { bg: string; border: string; text: string }> = {
  param: { bg: "var(--card)", border: "var(--border)", text: "var(--foreground)" },
  env: { bg: "var(--card)", border: "var(--border)", text: "var(--muted-foreground)" },
  "secret-read": { bg: "var(--card)", border: "var(--hook)", text: "var(--hook)" },
  "secret-write": { bg: "var(--card)", border: "var(--hook)", text: "var(--hook)" },
  host: { bg: "var(--card)", border: "var(--foreground)", text: "var(--foreground)" },
  return: { bg: "var(--card)", border: "var(--foreground)", text: "var(--foreground)" },
};

const kindLabels: Record<NodeInfo["kind"], string> = {
  param: "INPUT",
  env: "ENV",
  "secret-read": "SECRET (read)",
  "secret-write": "SECRET (write)",
  host: "HOST",
  return: "OUTPUT",
};

const DiagramNode = ({ node }: { node: NodeInfo }) => {
  const colors = kindColors[node.kind];
  return (
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={NODE_W}
        height={NODE_H}
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth={1.5}
      />
      <text
        x={node.x + 8}
        y={node.y + 12}
        fontSize={9}
        fill="var(--muted-foreground)"
        fontFamily="var(--font-mono), monospace"
      >
        {kindLabels[node.kind]}
      </text>
      <text
        x={node.x + 8}
        y={node.y + 27}
        fontSize={12}
        fill={colors.text}
        fontFamily="var(--font-mono), monospace"
        fontWeight={600}
      >
        {node.label.length > 18 ? `${node.label.slice(0, 16)}...` : node.label}
      </text>
    </g>
  );
};

const DiagramEdge = ({ edge }: { edge: Edge }) => {
  const fromX = edge.from.x + NODE_W;
  const fromY = edge.from.y + NODE_H / 2;
  const toX = edge.to.x;
  const toY = edge.to.y + NODE_H / 2;
  const midX = (fromX + toX) / 2;

  return (
    <path
      d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
      fill="none"
      stroke="var(--border)"
      strokeWidth={1.5}
      markerEnd="url(#arrowhead)"
    />
  );
};

const DiagramSvg = ({ data }: { data: SignatureData }) => {
  const { nodes, edges, width, height } = layoutNodes(data);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No data flow detected in this script.
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      className="max-h-full"
      style={{ minHeight: Math.min(height, 300) }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth={8}
          markerHeight={6}
          refX={8}
          refY={3}
          orient="auto"
        >
          <polygon
            points="0 0, 8 3, 0 6"
            fill="var(--muted-foreground)"
          />
        </marker>
      </defs>
      {edges.map((edge, i) => (
        <DiagramEdge key={`e-${i}`} edge={edge} />
      ))}
      {nodes.map((node, i) => (
        <DiagramNode key={`n-${i}`} node={node} />
      ))}
    </svg>
  );
};

const ResourceBadge = ({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) =>
  value > 0 ? (
    <span className="text-xs font-mono text-muted-foreground">
      {label}: {value}
      {unit}
    </span>
  ) : null;

const SafescriptDiagram = ({
  code,
  functionName,
}: {
  code: string;
  functionName: string;
}) => {
  const [state, setState] = useState<AnalysisState>({ status: "idle" });

  const analyze = useCallback(async () => {
    if (!code.trim() || !functionName.trim()) {
      setState({ status: "idle" });
      return;
    }
    setState({ status: "loading" });
    try {
      const res = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, functionName }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: json.error ?? "Analysis failed" });
        return;
      }
      setState({ status: "ok", data: json as SignatureData });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }, [code, functionName]);

  useEffect(() => {
    const timeout = setTimeout(analyze, 500);
    return () => clearTimeout(timeout);
  }, [analyze]);

  if (state.status === "idle") {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-8">
        Write a safescript to see its data flow analysis here.
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Analyzing...
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-sm text-destructive p-4">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span className="font-mono text-xs">{state.message}</span>
      </div>
    );
  }

  const { data } = state;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <span className="text-xs font-bold">
          {data.name}
        </span>
        {data.params.length > 0 && (
          <span className="text-xs font-mono text-muted-foreground">
            ({data.params.map((p) => p.name).join(", ")})
          </span>
        )}
        {data.returnType && (
          <span className="text-xs font-mono text-muted-foreground">
            {"-> "}
            {data.returnType}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">
        <DiagramSvg data={data} />
      </div>
      <div className="flex items-center gap-4 px-4 py-2 border-t border-border">
        <ResourceBadge label="mem" value={data.memoryBytes} unit="B" />
        <ResourceBadge label="cpu" value={data.runtimeMs} unit="ms" />
        <ResourceBadge label="disk" value={data.diskBytes} unit="B" />
        {data.hosts.length > 0 && (
          <span className="text-xs font-mono text-muted-foreground">
            {data.hosts.length} host{data.hosts.length !== 1 ? "s" : ""}
          </span>
        )}
        {data.secretsRead.length > 0 && (
          <span className="text-xs font-mono text-hook">
            {data.secretsRead.length} secret
            {data.secretsRead.length !== 1 ? "s" : ""} read
          </span>
        )}
      </div>
    </div>
  );
};

export { SafescriptDiagram };
export type { SignatureData };
