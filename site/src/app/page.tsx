import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Anchor, ArrowRight, Shield, Zap, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
  </svg>
);

const Header = () => (
  <header className="border-b border-border">
    <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
      <a href="/" className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight">
        <Anchor className="h-5 w-5 text-hook" />
        <span>captain hook</span>
      </a>
      <div className="flex items-center gap-3">
        <a
          href="https://github.com/uriva/captain-hook"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <GithubIcon className="h-4 w-4" />
        </a>
        <ThemeToggle />
        <a href="/dashboard" className={cn(buttonVariants({ size: "sm" }))}>
          Get started
        </a>
      </div>
    </div>
  </header>
);

const HeroSection = () => (
  <section className="border-b border-border">
    <div className="mx-auto max-w-5xl px-6 py-20 sm:py-32">
      <p className="font-mono text-sm text-hook mb-6 tracking-wide">
        open source webhook translator
      </p>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
        Know where your<br />
        <span className="text-hook">data flows</span>
      </h1>
      <p className="text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
        Captain Hook transforms webhooks using safescript, a language designed so
        you can prove exactly which hosts receive your data and which secrets get
        accessed. Before anything runs.
      </p>
      <div className="flex gap-3">
        <a href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
          Start for free <ArrowRight className="ml-2 h-4 w-4" />
        </a>
        <a
          href="https://github.com/uriva/captain-hook"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          <GithubIcon className="mr-2 h-4 w-4" /> View source
        </a>
      </div>
    </div>
  </section>
);

const CodeExample = () => (
  <section className="border-b border-border">
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <p className="font-mono text-xs text-muted-foreground mb-3">
            01 — the script
          </p>
          <div className="code-block p-5">
            <pre className="whitespace-pre-wrap">
              <span className="comment">{"// Transform a Stripe webhook for Slack"}</span>
              {"\n"}
              <span className="keyword">transform</span>
              {" = ("}
              <span className="type">payload</span>
              {": "}
              <span className="type">Any</span>
              {"): "}
              <span className="type">Any</span>
              {" => {\n  "}
              <span className="keyword">return</span>
              {" "}
              <span className="op">merge</span>
              {"({\n    "}
              <span className="string">{'"text"'}</span>
              {": "}
              <span className="op">stringConcat</span>
              {"(\n      "}
              <span className="string">{'"Payment received: $"'}</span>
              {",\n      "}
              <span className="op">pick</span>
              {"("}
              <span className="type">payload</span>
              {", "}
              <span className="string">{'"amount"'}</span>
              {")\n    )\n  })\n}"}
            </pre>
          </div>
        </div>
        <div>
          <p className="font-mono text-xs text-muted-foreground mb-3">
            02 — the signature (computed before execution)
          </p>
          <div className="code-block p-5">
            <pre className="whitespace-pre-wrap">
              {"{\n"}
              {"  "}
              <span className="string">{'"hosts"'}</span>
              {": [],\n"}
              {"  "}
              <span className="string">{'"secretsRead"'}</span>
              {": [],\n"}
              {"  "}
              <span className="string">{'"secretsWritten"'}</span>
              {": [],\n"}
              {"  "}
              <span className="string">{'"dataFlow"'}</span>
              {": {\n"}
              {"    "}
              <span className="string">{'"return"'}</span>
              {": ["}
              <span className="string">{'"param:payload"'}</span>
              {"]\n"}
              {"  }\n}"}
            </pre>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No network calls. No secret access. Output derived only from the
            input payload. You know this before execution.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const features = [
  {
    icon: Eye,
    title: "Static data flow analysis",
    description:
      "safescript's type system lets you compute exactly which hosts and secrets a script touches. Not at runtime, not in a sandbox. At parse time, before anything executes.",
  },
  {
    icon: Shield,
    title: "Permission enforcement",
    description:
      "Set which hosts and secrets each route is allowed to access. Captain Hook verifies the script's computed signature against these permissions before running it.",
  },
  {
    icon: Zap,
    title: "100k events/month free",
    description:
      "10x the most generous competitor. No credit card required. We believe webhook transformation should be cheap. Beyond 100k, talk to us.",
  },
];

const FeaturesSection = () => (
  <section className="border-b border-border">
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <p className="font-mono text-xs text-muted-foreground mb-3">
        03 — why this matters
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-12">
        The gap between &quot;sandboxed&quot; and &quot;provable&quot;
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature) => (
          <div key={feature.title} className="border border-border p-6">
            <feature.icon className="h-5 w-5 text-hook mb-4" />
            <h3 className="font-bold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ComparisonSection = () => (
  <section className="border-b border-border">
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <p className="font-mono text-xs text-muted-foreground mb-3">
        04 — versus the alternatives
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">
        Every competitor picks the wrong tradeoff
      </h2>
      <p className="text-muted-foreground max-w-2xl mb-12 leading-relaxed">
        Hookdeck, Convoy, and Pipedream give you arbitrary JavaScript in a
        sandbox. Secure, maybe. But you can&apos;t look at a script and know
        where data goes without reading every line. AWS EventBridge goes the
        other way: pure templates, no code, but so limited you can&apos;t do
        real logic.
      </p>
      <p className="text-muted-foreground max-w-2xl mb-12 leading-relaxed">
        Captain Hook sits in the middle. safescript is expressive enough to do
        real webhook transformations (string manipulation, JSON restructuring,
        HTTP calls, secret access) but constrained enough that a static
        analysis pass can tell you every host and every secret a script will
        touch. Before it runs.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 font-mono text-xs font-normal text-muted-foreground">
                Tool
              </th>
              <th className="text-left p-3 font-mono text-xs font-normal text-muted-foreground">
                Transformation
              </th>
              <th className="text-left p-3 font-mono text-xs font-normal text-muted-foreground">
                Data flow proof
              </th>
              <th className="text-left p-3 font-mono text-xs font-normal text-muted-foreground">
                Free tier
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Hookdeck", "Arbitrary JS", "No", "10k events/mo"],
              ["Convoy", "Arbitrary JS", "No", "Self-host only"],
              ["EventBridge", "JSON templates", "Implicit (no code)", "Pay per event"],
              [
                "Captain Hook",
                "safescript",
                "Yes, static analysis",
                "100k events/mo",
              ],
            ].map(([tool, transform, proof, free]) => (
              <tr
                key={tool}
                className={`border-b border-border ${
                  tool === "Captain Hook" ? "bg-hook/5" : ""
                }`}
              >
                <td className="p-3 font-mono font-bold">
                  {tool === "Captain Hook" ? (
                    <span className="text-hook">{tool}</span>
                  ) : (
                    tool
                  )}
                </td>
                <td className="p-3">{transform}</td>
                <td className="p-3">
                  {proof === "Yes, static analysis" ? (
                    <span className="text-hook font-bold">{proof}</span>
                  ) : (
                    proof
                  )}
                </td>
                <td className="p-3">{free}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

const HowItWorksSection = () => (
  <section className="border-b border-border">
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <p className="font-mono text-xs text-muted-foreground mb-3">
        05 — how it works
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-12">
        Three steps, zero surprises
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            step: "01",
            title: "Create a route",
            description:
              "Point an incoming webhook URL to a destination. Write a safescript function (or let our AI write one for you) that transforms the payload.",
          },
          {
            step: "02",
            title: "Review the signature",
            description:
              "Captain Hook computes the script's data flow signature. You see exactly which hosts, secrets, and data paths it touches. Set permissions accordingly.",
          },
          {
            step: "03",
            title: "Go live",
            description:
              "Every incoming webhook gets transformed and forwarded. Permissions are enforced on every execution. Stats tracked in real time.",
          },
        ].map((item) => (
          <div key={item.step}>
            <p className="font-mono text-3xl font-bold text-hook/30 mb-3">
              {item.step}
            </p>
            <h3 className="font-bold mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const PricingSection = () => (
  <section className="border-b border-border">
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <p className="font-mono text-xs text-muted-foreground mb-3">
        06 — pricing
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-12">
        Generous by default
      </h2>
      <div className="grid md:grid-cols-2 gap-8 max-w-2xl">
        <div className="border border-border p-8">
          <p className="font-mono text-sm text-hook mb-2">Free</p>
          <p className="text-4xl font-bold mb-1">$0</p>
          <p className="text-sm text-muted-foreground mb-6">forever</p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            100,000 events per month. Unlimited routes. Full static analysis.
            All features included.
          </p>
          <a href="/dashboard" className={cn(buttonVariants(), "w-full")}>
            Get started
          </a>
        </div>
        <div className="border border-border p-8">
          <p className="font-mono text-sm text-muted-foreground mb-2">
            Beyond 100k
          </p>
          <p className="text-4xl font-bold mb-1">Talk to us</p>
          <p className="text-sm text-muted-foreground mb-6">
            custom pricing
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Need more volume? Priority support? Custom deployment? Reach out and
            we&apos;ll figure it out.
          </p>
          <a href="mailto:uri.valevski@gmail.com" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Contact us
          </a>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-8">
    <div className="mx-auto max-w-5xl px-6 flex items-center justify-between text-sm text-muted-foreground">
      <p className="font-mono">
        <Anchor className="h-3.5 w-3.5 inline-block mr-1 text-hook" />
        captain hook
      </p>
      <div className="flex gap-6">
        <a
          href="https://github.com/uriva/captain-hook"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          GitHub
        </a>
        <a
          href="https://safescript.uriva.deno.net"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          safescript
        </a>
        <a
          href="mailto:uri.valevski@gmail.com"
          className="hover:text-foreground transition-colors"
        >
          Contact
        </a>
      </div>
    </div>
  </footer>
);

const Page = () => (
  <div className="min-h-screen">
    <Header />
    <HeroSection />
    <CodeExample />
    <FeaturesSection />
    <ComparisonSection />
    <HowItWorksSection />
    <PricingSection />
    <Footer />
  </div>
);

export { Page as default };
