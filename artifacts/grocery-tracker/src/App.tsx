import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Dashboard } from "@/pages/Dashboard";
import { Recipes } from "@/pages/Recipes";
import { Analytics } from "@/pages/Analytics";
import { ExpiryChat } from "@/pages/ExpiryChat";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { FridgeSelector } from "@/pages/FridgeSelector";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate() {
  const { user, activeFridge, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Not logged in → show auth routes
  if (!user) {
    return (
      <Switch>
        <Route path="/signup">
          <Signup onSuccess={() => navigate("/")} />
        </Route>
        <Route>
          <Login onSuccess={() => navigate("/")} />
        </Route>
      </Switch>
    );
  }

  // Logged in but no fridge selected → fridge selector
  if (!activeFridge) {
    return <FridgeSelector onSelect={() => navigate("/")} />;
  }

  // Fully authenticated → main app
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/recipes" component={Recipes} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/expiry-chat" component={ExpiryChat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthGate />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
