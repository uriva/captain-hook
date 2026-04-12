"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    aliceAndBot?: {
      loadChatWidget: (params: {
        participants: string[];
        initialMessage?: string;
        startOpen?: boolean;
        buttonText?: string;
        colorScheme?: {
          light?: { primary: string; background: string };
          dark?: { primary: string; background: string };
        };
      }) => void;
    };
  }
}

const WIDGET_SCRIPT_URL =
  "https://storage.googleapis.com/alice-and-bot/widget/dist/widget.iife.js";

const BOT_PUBLIC_KEY = process.env.NEXT_PUBLIC_BOT_PUBLIC_KEY ?? "";

const ScriptAssistant = ({
  routeName,
  destinationUrl,
  currentScript,
}: {
  routeName: string;
  destinationUrl: string;
  currentScript: string;
}) => {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !BOT_PUBLIC_KEY) return;
    loadedRef.current = true;

    const contextParts = [
      `I'm editing a webhook route called "${routeName}".`,
      `It forwards to: ${destinationUrl}`,
    ];
    if (currentScript.trim()) {
      contextParts.push(`Current script:\n\`\`\`\n${currentScript}\n\`\`\``);
      contextParts.push("Help me improve or debug this script.");
    } else {
      contextParts.push(
        "There's no script yet. Help me write a transformation script.",
      );
    }

    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      window.aliceAndBot?.loadChatWidget({
        participants: [BOT_PUBLIC_KEY],
        initialMessage: contextParts.join("\n"),
        buttonText: "Ask AI",
        colorScheme: {
          light: { primary: "#dc2626", background: "#ffffff" },
          dark: { primary: "#dc2626", background: "#0a0a0a" },
        },
      });
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
      const widget = document.querySelector("[data-alice-and-bot-widget]");
      if (widget) widget.remove();
    };
  }, [routeName, destinationUrl, currentScript]);

  if (!BOT_PUBLIC_KEY) return null;

  return null;
};

export { ScriptAssistant };
