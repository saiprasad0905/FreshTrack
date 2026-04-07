import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, ChefHat, BarChart3, Leaf, MessageCircle, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, activeFridge, logout } = useAuth();

  const navItems = [
    { href: "/", label: "My Fridge", icon: Home },
    { href: "/recipes", label: "AI Recipes", icon: ChefHat },
    { href: "/analytics", label: "Impact", icon: BarChart3 },
    { href: "/expiry-chat", label: "Expiry Guide", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-card border-r border-border/50 p-6 sticky top-0 h-screen z-10">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/20">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground">FreshTrack</h1>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          {/* Active fridge indicator */}
          {activeFridge && (
            <div className="bg-gradient-to-br from-accent to-emerald-50 rounded-2xl p-4 border border-primary/10">
              <p className="text-xs text-muted-foreground font-medium mb-1">Active Fridge</p>
              <p className="font-semibold text-foreground flex items-center gap-2">
                <span>{activeFridge.icon}</span> {activeFridge.name}
              </p>
            </div>
          )}
          {/* User + logout */}
          {user && (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {user.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <button onClick={logout} title="Sign out" className="text-muted-foreground hover:text-destructive transition-colors p-1">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-display font-bold text-xl text-foreground">FreshTrack</h1>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 px-6 py-3 flex justify-between items-center z-50 pb-[max(env(safe-area-inset-bottom),1rem)]">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl min-w-[64px]",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              <item.icon className={cn(
                "w-6 h-6 mb-0.5",
                isActive && "fill-primary/20"
              )} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
