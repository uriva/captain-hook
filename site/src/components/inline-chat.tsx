"use client";

import { useRef } from "react";
import {
  useCredentials,
  useGetOrCreateConversation,
} from "@alice-and-bot/core";
import type { Credentials } from "@alice-and-bot/core";
import { Chat } from "@alice-and-bot/core/components";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";

const BOT_PUBLIC_KEY = process.env.NEXT_PUBLIC_BOT_PUBLIC_KEY ?? "";

const customColors = {
  hideTitle: true,
  background: "transparent",
  text: "inherit",
  inputBackground: "transparent",
};

const ConnectedChat = ({
  credentials,
  initialMessage,
  isDark,
}: {
  credentials: Credentials;
  initialMessage: string;
  isDark: boolean;
}) => {
  const conversationId = useGetOrCreateConversation({
    credentials,
    participants: [BOT_PUBLIC_KEY],
    initialMessage,
  });

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <Chat
        credentials={credentials}
        conversationId={conversationId}
        enableAttachments={false}
        enableAudioRecording={false}
        isDark={isDark}
        customColors={customColors}
        emptyMessage="Ask me to write or improve your safescript transformation."
      />
    </div>
  );
};

const InlineChat = ({
  routeName,
  currentScript,
}: {
  routeName: string;
  currentScript: string;
}) => {
  const credentials = useCredentials("User", "captain-hook-chat");
  const { resolvedTheme } = useTheme();
  const initialMessageRef = useRef<string | null>(null);

  if (initialMessageRef.current === null) {
    const parts = [
      `I'm editing a webhook automation called "${routeName}".`,
    ];
    if (currentScript.trim()) {
      parts.push(`Current script:\n\`\`\`\n${currentScript}\n\`\`\``);
      parts.push("Help me improve or debug this script.");
    } else {
      parts.push(
        "There's no script yet. Help me write one.",
      );
    }
    initialMessageRef.current = parts.join("\n");
  }

  if (!BOT_PUBLIC_KEY) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        Bot public key not configured.
      </div>
    );
  }

  if (!credentials) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <ConnectedChat
      credentials={credentials}
      initialMessage={initialMessageRef.current ?? ""}
      isDark={resolvedTheme === "dark"}
    />
  );
};

export { InlineChat };
