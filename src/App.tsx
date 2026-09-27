import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { CatalogPage, HomePage, ProductPage } from '@/pages/storefront';
import {
  Link,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function AdminUnavailable() {
  return <main className="admin-unavailable">
    <div>
      <span className="section-index">SICARIO / ESPACE INTERNE</span>
      <h1>Administration désactivée.</h1>
      <p>Aucune authentification serveur n’est configurée dans ce projet. L’espace reste fermé jusqu’à la mise en place d’une session sécurisée.</p>
      <Link href="/" className="button-lime">Retour au store</Link>
    </div>
  </main>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/komerza" component={CatalogPage} />
        <Route path="/komerza/:product" component={ProductPage} />
        <Route path="/admin" component={AdminUnavailable} />
        <Route path="/adminsicariostore-1uhq" component={AdminUnavailable} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
