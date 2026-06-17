import fs from "fs";
import path from "path";
import { ThemeToggle } from "@/components/theme-toggle";
import { Anchor } from "lucide-react";

const Header = () => (
  <header className="border-b border-border">
    <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
      <a
        href="/"
        className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight"
      >
        <Anchor className="h-5 w-5 text-hook" />
        <span>captain hook</span>
      </a>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <a
          href="/dashboard"
          className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          Dashboard
        </a>
      </div>
    </div>
  </header>
);

const Footer = () => (
  <footer className="border-t border-border py-8 mt-20">
    <div className="mx-auto max-w-5xl px-6 flex items-center justify-between text-sm text-muted-foreground">
      <p className="font-mono">
        <Anchor className="h-3.5 w-3.5 inline-block mr-1 text-hook" />
        captain hook
      </p>
      <div className="flex gap-6 font-mono text-xs">
        <a href="/" className="hover:text-foreground transition-colors">
          Home
        </a>
        <a href="/llms.txt" className="hover:text-foreground transition-colors">
          llms.txt
        </a>
      </div>
    </div>
  </footer>
);

const DocsPage = () => {
  const filePath = path.join(process.cwd(), "src/docs.md");
  const content = fs.readFileSync(filePath, "utf8");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow mx-auto max-w-3xl px-6 py-12 w-full">
        <div className="prose prose-sm dark:prose-invert max-w-none font-mono text-sm leading-relaxed whitespace-pre-wrap selection:bg-hook/20 selection:text-foreground">
          {content}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export { DocsPage as default };
