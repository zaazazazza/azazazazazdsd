import { useGetDashboardSummary, useGetSystemStatus } from '@workspace/api-client-react';
import { ArrowUpRight, Boxes, CheckCircle2, CircleAlert, Clock3, CreditCard, Database, MessageSquare, RefreshCw, Server, WalletCards } from 'lucide-react';
import { Link } from 'wouter';
import { PageHeader, QueryState, StatusBadge, formatDate } from '@/components/shop-shell';

function MetricCard({ label, value, detail, icon: Icon, accent = 'primary' }: { label: string; value: string | number; detail: string; icon: typeof Boxes; accent?: 'primary' | 'accent' | 'warn' }) {
  const color = accent === 'accent' ? 'text-accent' : accent === 'warn' ? 'text-chart-3' : 'text-primary';
  return <div className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 hover:border-primary/30 animate-enter">
    <div className="flex items-start justify-between"><span className={`grid h-9 w-9 place-items-center rounded-lg bg-muted ${color}`}><Icon size={18} /></span><ArrowUpRight size={15} className="text-muted-foreground/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div>
    <p className="mt-5 font-mono-ops text-[10px] uppercase tracking-[.17em] text-muted-foreground">{label}</p>
    <p className="mt-1 text-3xl font-semibold tracking-[-.05em]">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
  </div>;
}

function IntegrationRow({ label, value, detail }: { label: string; value?: string; detail: string }) {
  const good = value === 'connected' || value === 'ready';
  const missing = value === 'missing_credentials' || value === 'address_required';
  return <div className="flex items-center justify-between gap-4 border-b border-border/70 py-4 last:border-0">
    <div className="flex items-center gap-3"><span className={`h-2 w-2 rounded-full ${good ? 'bg-primary' : missing ? 'bg-chart-3' : 'bg-destructive'}`} /><div><p className="text-sm font-medium capitalize">{label}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div></div>
    <StatusBadge label={value ?? 'unknown'} tone={good ? 'good' : missing ? 'warn' : 'bad'} />
  </div>;
}

export default function Dashboard() {
  const summary = useGetDashboardSummary();
  const systems = useGetSystemStatus();
  const data = summary.data;
  const status = systems.data;
  return <div>
    <PageHeader eyebrow="Operator dashboard" title="Good evening, operator." description="A live read on the shop floor, payment rail, and Discord queue." action={<Link href="/tickets" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/.12)] transition-transform hover:-translate-y-0.5" data-testid="link-open-queue">Open queue <ArrowUpRight size={15} /></Link>} />
    <QueryState loading={summary.isLoading} error={summary.isError} retry={() => summary.refetch()}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Synced products" value={data?.products.total ?? 0} detail={`${data?.products.inStock ?? 0} currently in stock`} icon={Boxes} />
        <MetricCard label="Open tickets" value={data?.tickets.open ?? 0} detail={`${data?.tickets.waitingPayment ?? 0} waiting on payment`} icon={MessageSquare} accent="accent" />
        <MetricCard label="Paid orders" value={data?.payments.paidCount ?? 0} detail={`${data?.payments.pendingCount ?? 0} still in motion`} icon={CreditCard} />
        <MetricCard label="Received LTC" value={`${(data?.payments.receivedLtc ?? 0).toFixed(4)} Ł`} detail="Confirmed on Litecoin" icon={WalletCards} accent="warn" />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <section className="ops-grid relative overflow-hidden rounded-xl border border-border bg-card p-5 md:p-6 animate-enter animate-enter-1">
          <div className="relative z-10 flex items-start justify-between"><div><p className="font-mono-ops text-[10px] uppercase tracking-[.18em] text-primary">Stock telemetry</p><h2 className="mt-2 text-lg font-semibold">Inventory posture</h2></div><Link href="/products" className="text-xs text-muted-foreground hover:text-primary" data-testid="link-view-inventory">View catalogue <ArrowUpRight className="ml-1 inline" size={13} /></Link></div>
          <div className="relative z-10 mt-7 grid grid-cols-3 gap-3">
            <div className="border-l-2 border-primary pl-3"><p className="font-mono-ops text-2xl text-primary">{data?.products.inStock ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">In stock</p></div>
            <div className="border-l-2 border-chart-3 pl-3"><p className="font-mono-ops text-2xl text-chart-3">{data?.products.lowStock ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">Low stock</p></div>
            <div className="border-l-2 border-destructive pl-3"><p className="font-mono-ops text-2xl text-destructive">{data?.products.outOfStock ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">Out of stock</p></div>
          </div>
          <div className="relative z-10 mt-8"><div className="mb-2 flex justify-between text-[10px] font-mono-ops text-muted-foreground"><span>AVAILABLE INVENTORY</span><span>{data?.products.total ? Math.round((data.products.inStock / data.products.total) * 100) : 0}%</span></div><div className="flex h-2 overflow-hidden rounded-full bg-muted"><span className="bg-primary" style={{ width: `${data?.products.total ? (data.products.inStock / data.products.total) * 100 : 0}%` }} /><span className="bg-chart-3" style={{ width: `${data?.products.total ? (data.products.lowStock / data.products.total) * 100 : 0}%` }} /></div></div>
        </section>
        <section className="rounded-xl border border-border bg-card p-5 md:p-6 animate-enter animate-enter-2">
          <div className="flex items-start justify-between"><div><p className="font-mono-ops text-[10px] uppercase tracking-[.18em] text-accent">System pulse</p><h2 className="mt-2 text-lg font-semibold">Integration health</h2></div><Server size={18} className="text-muted-foreground" /></div>
          <div className="mt-3">
            <IntegrationRow label="Komerza" value={status?.komerza} detail="Catalogue source" />
            <IntegrationRow label="Discord" value={status?.discord} detail="Ticket listener" />
            <IntegrationRow label="Litecoin" value={status?.litecoin} detail="Payment rail" />
            <IntegrationRow label="Database" value={status?.database} detail="Operational state" />
          </div>
        </section>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <section className="rounded-xl border border-border bg-card p-5 md:p-6 animate-enter animate-enter-2">
          <div className="flex items-center justify-between"><div><p className="font-mono-ops text-[10px] uppercase tracking-[.18em] text-muted-foreground">Sync ledger</p><h2 className="mt-2 text-lg font-semibold">Catalogue sync</h2></div><RefreshCw size={17} className="text-muted-foreground" /></div>
          <div className="mt-7 flex items-end gap-3"><span className="font-mono-ops text-2xl text-foreground">{formatDate(data?.lastSyncAt)}</span></div>
          <p className="mt-2 text-xs text-muted-foreground">Last successful pass from Komerza. Run a manual sync from the catalogue when prices or stock move.</p>
          <Link href="/products" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline" data-testid="link-run-sync">Go to sync controls <ArrowUpRight size={13} /></Link>
        </section>
        <section className="rounded-xl border border-border bg-card p-5 md:p-6 animate-enter animate-enter-3">
          <div className="flex items-center justify-between"><div><p className="font-mono-ops text-[10px] uppercase tracking-[.18em] text-muted-foreground">Operator brief</p><h2 className="mt-2 text-lg font-semibold">What needs attention</h2></div><Clock3 size={17} className="text-muted-foreground" /></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link href="/tickets" className="rounded-lg border border-border p-4 transition-colors hover:border-accent/40 hover:bg-accent/5" data-testid="card-open-tickets"><MessageSquare size={16} className="text-accent" /><p className="mt-4 font-mono-ops text-xl">{data?.tickets.open ?? 0}</p><p className="text-xs text-muted-foreground">tickets open</p></Link>
            <Link href="/payments" className="rounded-lg border border-border p-4 transition-colors hover:border-chart-3/40 hover:bg-chart-3/5" data-testid="card-pending-payments"><CircleAlert size={16} className="text-chart-3" /><p className="mt-4 font-mono-ops text-xl">{data?.payments.pendingCount ?? 0}</p><p className="text-xs text-muted-foreground">payment checks</p></Link>
            <Link href="/settings" className="rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5" data-testid="card-system-health"><CheckCircle2 size={16} className="text-primary" /><p className="mt-4 font-mono-ops text-xl">{status ? Object.values(status).filter((value) => value === 'connected' || value === 'ready').length : 0}/4</p><p className="text-xs text-muted-foreground">systems healthy</p></Link>
          </div>
        </section>
      </div>
    </QueryState>
  </div>;
}