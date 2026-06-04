import { Link } from "react-router-dom";
import { GitBranch, CircleDot, MessageSquare, ArrowRight, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../store/auth";

export function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="animate-fade-in space-y-6 max-w-2xl">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10">
              <GitBranch className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Where code{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
              lives & breathes
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Gitlit is a minimal, fast, and beautiful issue tracker. Track bugs, features, and discussions — all in one place.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            {user ? (
              <Link to="/repos">
                <Button size="lg" className="gap-2 px-6">
                  Go to repositories <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="gap-2 px-6">
                    Get started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="px-6">Sign in</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-border px-4 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: <CircleDot className="h-5 w-5 text-emerald-400" />,
              title: "Issue tracking",
              description: "Create, track, and resolve issues with markdown support, labels, and assignees.",
            },
            {
              icon: <MessageSquare className="h-5 w-5 text-blue-400" />,
              title: "Rich discussions",
              description: "Comment threads with replies, emoji reactions, and a full activity timeline.",
            },
            {
              icon: <Shield className="h-5 w-5 text-violet-400" />,
              title: "Private repos",
              description: "Keep your work private. Control access with fine-grained permissions.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted border border-border">
                {f.icon}
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
