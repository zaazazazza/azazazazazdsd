import { Link, useLocation } from 'wouter';
import { Activity, Boxes, CreditCard, LayoutDashboard, Menu, MessageSquare, Settings, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/products', label: 'Catalogue', icon: Boxes },
  { href: '/tickets', label: 'Ticket queue', icon: MessageSquare },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function ShopShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = navigation.find((item) => item.href === location)?.label ?? 'Operations';

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3" data-testid="link-brand">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_22px_hsl(var(--primary)/.16)]">
              <ShieldCheck size={19} strokeWidth={2.4} />
            </span>
            <span>
              <span className="block font-mono-ops text-[12px] font-bold tracking-[.16em] text-sidebar-accent-foreground">SICARIO</span>
              <span className="block font-mono-ops text-[9px] tracking-[.18em] text-sidebar-foreground/60">SHOP BOT / OPS</span>
            </span>
          </Link>
          <button className="text-sidebar-foreground md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation"><X size={18} /></button>
        </div>
        <div className="px-4 pt-7">
          <p className="mb-3 px-3 font-mono-ops text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/40">Command center</p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = location === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'}`} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}>
                  <Icon size={16} className={active ? 'text-sidebar-primary' : 'text-sidebar-foreground/65 group-hover:text-sidebar-primary'} />
                  <span>{item.label}</span>
                  {item.href === '/tickets' && <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 font-mono-ops text-[9px] text-primary">LIVE</span>}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="ops-scanline rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="status-pulse h-2 w-2 rounded-full bg-primary" />
              <span className="font-mono-ops text-[10px] tracking-[.12em] text-sidebar-accent-foreground">RUNTIME ONLINE</span>
            </div>
            <p className="text-[11px] leading-relaxed text-sidebar-foreground/55">Watch the queue. Verify the chain. Ship the order.</p>
            <div className="mt-3 flex items-center justify-between border-t border-sidebar-border pt-3 font-mono-ops text-[9px] text-sidebar-foreground/40">
              <span>BUILD 0.4.7</span><Activity size={12} />
            </div>
          </div>
        </div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="button-dismiss-menu" />}
      <main className="min-h-[100dvh] md:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-xl md:px-9">
          <div className="flex items-center gap-3">
            <button className="rounded-md border border-border p-2 text-muted-foreground md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={18} /></button>
            <div>
              <p className="font-mono-ops text-[10px] uppercase tracking-[.22em] text-muted-foreground">SICARIO / {current.toUpperCase()}</p>
              <p className="mt-1 hidden text-[12px] text-muted-foreground/70 sm:block">Commerce operations, without the guesswork.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="font-mono-ops text-[10px] text-muted-foreground">LTC NETWORK</span>
              <span className="font-mono-ops text-[10px] text-accent">MAINNET</span>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full border border-primary/25 bg-primary/10 font-mono-ops text-[11px] font-bold text-primary" data-testid="avatar-operator">OP</div>
          </div>
        </header>
        <div className="mx-auto max-w-[1500px] p-5 md:p-9">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div className="animate-enter">
        <p className="mb-2 font-mono-ops text-[10px] uppercase tracking-[.24em] text-primary">{eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-[-.04em] text-foreground md:text-[38px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="animate-enter animate-enter-1">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function QueryState({ loading, error, empty, children, retry }: { loading: boolean; error?: boolean; empty?: boolean; children: React.ReactNode; retry?: () => void }) {
  if (loading) return <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>;
  if (error) return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"><p className="font-medium text-destructive">The service did not answer.</p><p className="mt-1 text-sm text-muted-foreground">Check the API connection and try again.</p>{retry && <button onClick={retry} className="mt-4 rounded-md border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10" data-testid="button-retry-query">Retry request</button>}</div>;
  if (empty) return <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center"><p className="font-medium">Nothing in the queue yet.</p><p className="mt-1 text-sm text-muted-foreground">New records will land here when the integration is active.</p></div>;
  return <>{children}</>;
}

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: 'good' | 'warn' | 'bad' | 'info' | 'neutral' }) {
  const styles = { good: 'border-primary/25 bg-primary/10 text-primary', warn: 'border-chart-3/25 bg-chart-3/10 text-chart-3', bad: 'border-destructive/25 bg-destructive/10 text-destructive', info: 'border-accent/25 bg-accent/10 text-accent', neutral: 'border-border bg-muted text-muted-foreground' };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono-ops text-[9px] uppercase tracking-[.08em] ${styles[tone]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label.replaceAll('_', ' ')}</span>;
}

export function formatDate(value?: string | null) {
  if (!value) return 'Not yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Request failed';
}