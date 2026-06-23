import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import JoinGame from "./pages/JoinGame";
import Lobby from "./pages/Lobby";
import GamePlay from "./pages/GamePlay";
import Results from "./pages/Results";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/join" component={JoinGame} />
      <Route path="/join/:code" component={JoinGame} />
      <Route path="/lobby/:gameId" component={Lobby} />
      <Route path="/game/:gameId" component={GamePlay} />
      <Route path="/results/:gameId" component={Results} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "oklch(0.17 0.02 285)",
                border: "1px solid oklch(0.28 0.03 285)",
                color: "oklch(0.95 0.01 285)",
              },
            }}
          />
          <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
