import { getGetTicketQueryKey, getListTicketsQueryKey, useGetTicket, useListTickets, useUpdateTicket, useUploadTicketAttachment } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, CircleDot, FileUp, Hash, MessageSquare, Paperclip, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PageHeader, QueryState, StatusBadge, formatDate, getErrorMessage } from '@/components/shop-shell';

type TicketState = 'all' | 'open' | 'waiting_payment' | 'paid' | 'closed';

function ticketTone(status: string) {
  if (status === 'paid') return 'good' as const;
  if (status === 'waiting_payment') return 'warn' as const;
  if (status === 'closed') return 'neutral' as const;
  return 'info' as const;
}

export default function Tickets() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<TicketState>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const tickets = useListTickets({ status: filter });
  const ticket = useGetTicket(selectedId ?? '', { query: { enabled: Boolean(selectedId), queryKey: getGetTicketQueryKey(selectedId ?? '') } });
  const update = useUpdateTicket();
  const upload = useUploadTicketAttachment();
  const fileRef = useRef<HTMLInputElement>(null);
  const rows = (tickets.data ?? []).filter((item) => `${item.channelName} ${item.customerName ?? ''} ${item.productName ?? ''}`.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { if (!selectedId && rows[0]) setSelectedId(rows[0].id); }, [rows, selectedId]);
  const selected = ticket.data ?? rows.find((item) => item.id === selectedId);
  const changeStatus = (status: TicketState) => {
    if (!selectedId || status === 'all') return;
    update.mutate({ ticketId: selectedId, data: { status } }, { onSuccess: (next) => { queryClient.setQueryData(getGetTicketQueryKey(selectedId), next); queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() }); } });
  };
  const uploadFile = (file?: File) => {
    if (!file || !selectedId) return;
    upload.mutate({ ticketId: selectedId, data: { file, fileName: file.name, mimeType: file.type || 'application/octet-stream', size: file.size } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetTicketQueryKey(selectedId) }); queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() }); } });
  };
  return <div>
    <PageHeader eyebrow="Discord operations" title="Ticket queue" description="Keep customer context, product intent, and payment state in one operator view." action={<div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"><CircleDot size={14} className="text-primary" /><span className="font-mono-ops text-[10px] text-muted-foreground">{rows.length} ACTIVE RECORDS</span></div>} />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="rounded-xl border border-border bg-card shadow-sm animate-enter animate-enter-1">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 md:w-72"><Search size={15} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tickets" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60" data-testid="input-ticket-search" /></div><div className="relative"><select value={filter} onChange={(event) => setFilter(event.target.value as TicketState)} className="w-full appearance-none rounded-lg border border-input bg-background py-2 pl-3 pr-8 text-xs font-medium outline-none focus:border-primary" data-testid="select-ticket-status"><option value="all">All ticket states</option><option value="open">Open</option><option value="waiting_payment">Waiting payment</option><option value="paid">Paid</option><option value="closed">Closed</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-2.5 text-muted-foreground" /></div></div>
        <QueryState loading={tickets.isLoading} error={tickets.isError} empty={!rows.length} retry={() => tickets.refetch()}>
          <div className="divide-y divide-border/70">
            {rows.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`block w-full p-4 text-left transition-colors hover:bg-muted/30 ${selectedId === item.id ? 'bg-primary/[.045] shadow-[inset_2px_0_hsl(var(--primary))]' : ''}`} data-testid={`button-ticket-${item.id}`}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><Hash size={13} className="shrink-0 text-accent" /><p className="truncate text-sm font-semibold">{item.channelName}</p></div><p className="mt-1 truncate pl-5 text-xs text-muted-foreground">{item.customerName ?? item.customerId ?? 'Unknown customer'} <span className="px-1 text-muted-foreground/40">/</span> {item.productName ?? 'Product not detected'}</p></div><StatusBadge label={item.status} tone={ticketTone(item.status)} /></div>
              <div className="mt-3 flex items-center gap-4 pl-5 font-mono-ops text-[9px] uppercase tracking-[.06em] text-muted-foreground"><span className={item.hasLitecoinEmbed ? 'text-accent' : ''}>{item.hasLitecoinEmbed ? 'LTC EMBED' : 'NO LTC EMBED'}</span><span>{item.attachmentCount} attachment{item.attachmentCount === 1 ? '' : 's'}</span><span className="ml-auto">{formatDate(item.updatedAt)}</span></div>
            </button>)}
          </div>
        </QueryState>
      </section>
      <aside className="rounded-xl border border-border bg-card shadow-sm animate-enter animate-enter-2">
        {!selected ? <div className="grid min-h-[420px] place-items-center p-8 text-center"><MessageSquare size={26} className="text-muted-foreground/40" /><p className="mt-3 text-sm font-medium">Select a ticket</p><p className="mt-1 text-xs text-muted-foreground">Operator details will appear here.</p></div> : <div>
          <div className="flex items-start justify-between border-b border-border p-5"><div><p className="font-mono-ops text-[10px] uppercase tracking-[.18em] text-accent">Selected ticket</p><h2 className="mt-2 max-w-[240px] truncate text-lg font-semibold">{selected.channelName}</h2><p className="mt-1 text-xs text-muted-foreground">{selected.channelId}</p></div><button onClick={() => setSelectedId(undefined)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Clear selected ticket" data-testid="button-clear-ticket"><X size={16} /></button></div>
          <div className="space-y-5 p-5"><div className="grid grid-cols-2 gap-3"><div className="rounded-lg border border-border bg-background p-3"><p className="font-mono-ops text-[9px] uppercase text-muted-foreground">Customer</p><p className="mt-2 truncate text-sm">{selected.customerName ?? 'Unknown'}</p><p className="mt-1 truncate font-mono-ops text-[9px] text-muted-foreground">{selected.customerId ?? 'No customer ID'}</p></div><div className="rounded-lg border border-border bg-background p-3"><p className="font-mono-ops text-[9px] uppercase text-muted-foreground">Product intent</p><p className="mt-2 truncate text-sm">{selected.productName ?? 'Not detected'}</p><p className="mt-1 font-mono-ops text-[9px] text-muted-foreground">{selected.detectedProductId ?? 'Needs matching'}</p></div></div>
            <div><label className="mb-2 block font-mono-ops text-[9px] uppercase tracking-[.14em] text-muted-foreground">Ticket state</label><div className="relative"><select value={selected.status} onChange={(event) => changeStatus(event.target.value as TicketState)} disabled={update.isPending} className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60" data-testid="select-selected-ticket-status"><option value="open">Open</option><option value="waiting_payment">Waiting payment</option><option value="paid">Paid</option><option value="closed">Closed</option></select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-3 text-muted-foreground" /></div>{update.isError && <p className="mt-2 text-xs text-destructive">{getErrorMessage(update.error)}</p>}</div>
            <div className="rounded-lg border border-border bg-background p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Paperclip size={15} className="text-accent" /><span className="text-sm font-medium">Attachments</span></div><span className="font-mono-ops text-xs text-muted-foreground">{selected.attachmentCount}</span></div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Upload proof, receipts, or customer context to this ticket record.</p><input ref={fileRef} type="file" className="hidden" onChange={(event) => uploadFile(event.target.files?.[0])} data-testid="input-ticket-attachment" /><button onClick={() => fileRef.current?.click()} disabled={upload.isPending} className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:opacity-50" data-testid="button-upload-attachment"><FileUp size={14} />{upload.isPending ? 'Registering file…' : 'Choose a file'}</button>{upload.isError && <p className="mt-2 text-xs text-destructive">{getErrorMessage(upload.error)}</p>}{upload.isSuccess && <p className="mt-2 flex items-center gap-1 text-xs text-primary"><Check size={13} />Attachment registered</p>}</div>
            <div className="border-t border-border pt-4 text-xs text-muted-foreground"><div className="flex justify-between py-1"><span>Created</span><span className="font-mono-ops text-[10px]">{formatDate(selected.createdAt)}</span></div><div className="flex justify-between py-1"><span>Updated</span><span className="font-mono-ops text-[10px]">{formatDate(selected.updatedAt)}</span></div><div className="flex justify-between py-1"><span>Litecoin signal</span><span className={selected.hasLitecoinEmbed ? 'text-accent' : 'text-muted-foreground'}>{selected.hasLitecoinEmbed ? 'Detected' : 'Not found'}</span></div></div>
          </div>
        </div>}
      </aside>
    </div>
  </div>;
}