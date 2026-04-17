import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import {
  Anchor,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  Zap,
} from "lucide-react";
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
      <a
        href="/"
        className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight"
      >
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
        webhook integrations without code
      </p>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
        Connect anything<br />
        <span className="text-hook">to anything</span>
      </h1>
      <p className="text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
        Tell Captain Hook what you want connected and it builds the integration
        for you. No code, no config files, no documentation rabbit holes. Just
        describe it.
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

const chatMessages = [
  {
    role: "user" as const,
    text:
      "When I get a Stripe payment, send a message to our #sales channel on Slack with the customer name and amount.",
  },
  {
    role: "assistant" as const,
    text: "Done. I've set up the integration. Here's what it does:",
  },
  {
    role: "assistant" as const,
    text:
      "Receives Stripe payment webhooks, extracts the customer name and amount, and posts a formatted message to #sales on Slack. It only talks to hooks.slack.com and reads your Slack token. Nothing else.",
  },
];

const ChatDemo = () => (
  <section className="border-b border-border">
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <p className="font-mono text-xs text-muted-foreground mb-3">
        this is what it looks like
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-10">
        You describe it. Captain Hook builds it.
      </h2>
      <div className="border border-border max-w-2xl">
        <div className="border-b border-border px-4 py-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-hook" />
          <span className="font-mono text-xs text-muted-foreground">
            new integration
          </span>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "px-4 py-3 text-sm leading-relaxed max-w-[85%]",
                msg.role === "user"
                  ? "bg-hook/10 text-foreground self-end"
                  : "bg-muted text-foreground self-start",
              )}
            >
              {msg.text}
            </div>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-6 max-w-2xl leading-relaxed">
        Captain Hook understands what you want, writes the integration, and
        shows you exactly where your data will go before anything runs. You
        approve it, and you&apos;re live.
      </p>
    </div>
  </section>
);

const features = [
  {
    icon: MessageSquare,
    title: "Just describe it",
    description:
      "Tell the AI what you want connected in plain English. Stripe to Slack, GitHub to email, a CRM to a spreadsheet. It writes the integration for you.",
  },
  {
    icon: ShieldCheck,
    title: "See where your data goes",
    description:
      "Before anything runs, Captain Hook shows you exactly which services will receive your data and which secrets get used. You approve the connections, not the code.",
  },
  {
    icon: Zap,
    title: "100k events/month free",
    description:
      "10x the most generous competitor. No credit card required. Beyond 100k, talk to us.",
    extra: (
      <p className="text-sm text-muted-foreground leading-relaxed mt-2">
        How? We don&apos;t spin up a VM per request. Integrations run on{" "}
        <a
          href="https://safescript.uriva.deno.net"
          target="_blank"
          rel="noopener noreferrer"
          className="text-hook underline underline-offset-2 hover:text-foreground transition-colors"
        >
          safescript
        </a>
        , a lightweight language that&apos;s safe by design.
      </p>
    ),
  },
];

const FeaturesSection = () => (
  <section className="border-b border-border">
    <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <p className="font-mono text-xs text-muted-foreground mb-3">
        why captain hook
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-12">
        Integrations should be this easy
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature) => (
          <div key={feature.title} className="border border-border p-6">
            <feature.icon className="h-5 w-5 text-hook mb-4" />
            <h3 className="font-bold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
            {"extra" in feature && feature.extra}
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
        versus the alternatives
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">
        Other tools make you do the work
      </h2>
      <p className="text-muted-foreground max-w-2xl mb-12 leading-relaxed">
        Most webhook tools hand you a code editor and say good luck. Hookdeck,
        Convoy, Pipedream, they all assume you can write JavaScript. AWS
        EventBridge skips the code but gives you rigid templates that barely
        handle real use cases. Zapier, Make, and n8n give you visual builders
        but you end up with 50-step chains that break the moment something
        changes.
      </p>
      <p className="text-muted-foreground max-w-2xl mb-12 leading-relaxed">
        Captain Hook takes a different approach. You describe what you want in
        plain language, the AI builds it, and you get a clear breakdown of
        exactly where your data flows before you go live. No code to write, no
        templates to wrestle with, no 50-step automation chains.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 font-mono text-xs font-normal text-muted-foreground">
                Tool
              </th>
              <th className="text-left p-3 font-mono text-xs font-normal text-muted-foreground">
                Setup
              </th>
              <th className="text-left p-3 font-mono text-xs font-normal text-muted-foreground">
                Data visibility
              </th>
              <th className="text-left p-3 font-mono text-xs font-normal text-muted-foreground">
                Open source
              </th>
              <th className="text-left p-3 font-mono text-xs font-normal text-muted-foreground">
                Free tier
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Hookdeck", "Write JavaScript", "None", "No", "10k events/mo"],
              ["Convoy", "Write JavaScript", "None", "Yes", "Self-host only"],
              ["Zapier", "Drag-and-drop builder", "None", "No", "100 tasks/mo"],
              ["Make", "Drag-and-drop builder", "None", "No", "1k ops/mo"],
              ["n8n", "Drag-and-drop builder", "None", "Yes", "Self-host only"],
              [
                "EventBridge",
                "JSON templates",
                "Limited",
                "No",
                "Pay per event",
              ],
              [
                "Captain Hook",
                "Describe in plain English",
                "Full data flow proof",
                "Yes",
                "100k events/mo",
              ],
            ].map(([tool, setup, visibility, oss, free]) => (
              <tr
                key={tool}
                className={`border-b border-border ${
                  tool === "Captain Hook" ? "bg-hook/5" : ""
                }`}
              >
                <td className="p-3 font-mono font-bold">
                  {tool === "Captain Hook"
                    ? <span className="text-hook">{tool}</span>
                    : tool}
                </td>
                <td className="p-3">
                  {tool === "Captain Hook"
                    ? <span className="text-hook font-bold">{setup}</span>
                    : setup}
                </td>
                <td className="p-3">{visibility}</td>
                <td className="p-3">
                  {tool === "Captain Hook"
                    ? <span className="text-hook font-bold">{oss}</span>
                    : oss}
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
        how it works
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-12">
        Three steps, no coding
      </h2>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            step: "01",
            title: "Describe the connection",
            description:
              'Tell Captain Hook what you want. "When Stripe sends a payment, post it to Slack." That\'s it. The AI figures out the rest.',
          },
          {
            step: "02",
            title: "Review and approve",
            description:
              "Captain Hook shows you exactly which services will receive your data and which credentials get used. Nothing runs until you say so.",
          },
          {
            step: "03",
            title: "Go live",
            description:
              "Flip the switch. Every incoming event gets transformed and forwarded automatically. You can see stats and update the integration anytime by chatting with it.",
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
        pricing
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
            100,000 events per month. Unlimited integrations. Full data flow
            visibility. All features included.
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
          <a
            href="mailto:uri.valevski@gmail.com"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
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
    <ChatDemo />
    <FeaturesSection />
    <ComparisonSection />
    <HowItWorksSection />
    <PricingSection />
    <Footer />
  </div>
);

export { Page as default };
