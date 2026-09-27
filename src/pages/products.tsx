import { getGetDashboardSummaryQueryKey, getListProductsQueryKey, useListProducts, useSyncProducts } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Boxes, ChevronDown, ImageOff, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { PageHeader, QueryState, StatusBadge, formatDate } from '@/components/shop-shell';

function stockTone(status: string) {
  if (status === 'in_stock') return 'good' as const;
  if (status === 'low_stock') return 'warn' as const;
  return 'bad' as const;
}

export default function Products() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [stock, setStock] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const params = { ...(search ? { search } : {}), stock };
  const products = useListProducts(params);
  const sync = useSyncProducts();
  const rows = products.data ?? [];
  const syncNow = () => sync.mutate({ data: {} }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); } });
  return <div>
    <PageHeader eyebrow="Komerza catalogue" title="Products" description="The synced source of truth for what the bot can sell." action={<button onClick={syncNow} disabled={sync.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" data-testid="button-sync-products"><RefreshCw size={15} className={sync.isPending ? 'animate-spin' : ''} />{sync.isPending ? 'Syncing…' : 'Sync catalogue'}</button>} />
    {sync.isError && <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" data-testid="status-sync-error">Catalogue sync failed. Confirm Komerza credentials in settings.</div>}
    <section className="rounded-xl border border-border bg-card shadow-sm animate-enter animate-enter-1">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex flex-1 items-center gap-3 rounded-lg border border-input bg-background px-3 py-2 md:max-w-md"><Search size={16} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or SKU" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" data-testid="input-product-search" /><span className="hidden font-mono-ops text-[9px] text-muted-foreground/50 sm:block">QUERY</span></div>
        <div className="flex items-center gap-2"><SlidersHorizontal size={14} className="text-muted-foreground" /><label htmlFor="stock-filter" className="sr-only">Filter stock</label><div className="relative"><select id="stock-filter" value={stock} onChange={(event) => setStock(event.target.value as typeof stock)} className="appearance-none rounded-lg border border-input bg-background py-2 pl-3 pr-8 text-xs font-medium outline-none focus:border-primary" data-testid="select-product-stock"><option value="all">All stock states</option><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-2.5 text-muted-foreground" /></div><span className="rounded-md bg-muted px-2.5 py-2 font-mono-ops text-[10px] text-muted-foreground">{rows.length} rows</span></div>
      </div>
      <QueryState loading={products.isLoading} error={products.isError} empty={!rows.length} retry={() => products.refetch()}>
        <div className="overflow-x-auto"><table className="w-full min-w-[740px] text-left"><thead><tr className="border-b border-border text-[10px] uppercase tracking-[.16em] text-muted-foreground"><th className="px-5 py-3 font-mono-ops font-normal">Product</th><th className="px-4 py-3 font-mono-ops font-normal">SKU / ID</th><th className="px-4 py-3 font-mono-ops font-normal">Price</th><th className="px-4 py-3 font-mono-ops font-normal">Stock</th><th className="px-4 py-3 font-mono-ops font-normal">State</th><th className="px-5 py-3 text-right font-mono-ops font-normal">Updated</th></tr></thead><tbody>
          {rows.map((product) => <tr key={product.id} className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/30" data-testid={`row-product-${product.id}`}>
            <td className="px-5 py-4"><div className="flex items-center gap-3">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-10 w-10 rounded-lg border border-border bg-muted object-cover" data-testid={`img-product-${product.id}`} /> : <span className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-muted text-muted-foreground"><ImageOff size={15} /></span>}<div><p className="max-w-[280px] truncate text-sm font-medium">{product.name}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{product.komerzaId ?? 'No Komerza ID'}</p></div></div></td>
            <td className="px-4 py-4 font-mono-ops text-[10px] text-muted-foreground">{product.sku ?? '—'}<br /><span className="text-muted-foreground/50">{product.id.slice(0, 12)}</span></td>
            <td className="px-4 py-4"><span className="font-mono-ops text-sm">{product.price.toFixed(2)}</span> <span className="text-[10px] uppercase text-muted-foreground">{product.currency}</span></td>
            <td className="px-4 py-4"><span className="font-mono-ops text-sm">{product.stock}</span><span className="ml-1 text-[11px] text-muted-foreground">/ {product.lowStockThreshold} min</span></td>
            <td className="px-4 py-4"><StatusBadge label={product.status} tone={stockTone(product.status)} /></td>
            <td className="px-5 py-4 text-right text-xs text-muted-foreground">{formatDate(product.updatedAt)}</td>
          </tr>)}
        </tbody></table></div>
      </QueryState>
      {!products.isLoading && !products.isError && rows.length === 0 && <div className="pb-4 text-center text-xs text-muted-foreground"><Boxes className="mx-auto mb-2 text-muted-foreground/50" size={22} />Try a different search or sync the source catalogue.</div>}
    </section>
  </div>;
}