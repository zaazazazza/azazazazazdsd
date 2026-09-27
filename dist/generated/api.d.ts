import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { Attachment, AttachmentInput, DashboardSummary, ErrorResponse, HealthStatus, ListProductsParams, ListTicketsParams, PaymentInvoice, PaymentInvoiceInput, PaymentVerificationInput, PaymentVerificationResult, Product, ProductSyncInput, ProductSyncResult, StorageUploadInput, StorageUploadResponse, SystemStatus, Ticket, TicketUpdate } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetDashboardSummaryUrl: () => string;
/**
 * @summary Get dashboard summary
 */
export declare const getDashboardSummary: (options?: Parameters<typeof customFetch>[1]) => Promise<DashboardSummary>;
export declare const getGetDashboardSummaryQueryKey: () => readonly ["/api/dashboard/summary"];
export declare const getGetDashboardSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardSummary>>>;
export type GetDashboardSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard summary
 */
export declare function useGetDashboardSummary<TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetSystemStatusUrl: () => string;
/**
 * @summary Get integration and system status
 */
export declare const getSystemStatus: (options?: Parameters<typeof customFetch>[1]) => Promise<SystemStatus>;
export declare const getGetSystemStatusQueryKey: () => readonly ["/api/system/status"];
export declare const getGetSystemStatusQueryOptions: <TData = Awaited<ReturnType<typeof getSystemStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSystemStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSystemStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSystemStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getSystemStatus>>>;
export type GetSystemStatusQueryError = ErrorType<unknown>;
/**
 * @summary Get integration and system status
 */
export declare function useGetSystemStatus<TData = Awaited<ReturnType<typeof getSystemStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSystemStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListProductsUrl: (params?: ListProductsParams) => string;
/**
 * @summary List synced products
 */
export declare const listProducts: (params?: ListProductsParams, options?: Parameters<typeof customFetch>[1]) => Promise<Product[]>;
export declare const getListProductsQueryKey: (params?: ListProductsParams) => readonly ["/api/products", ...ListProductsParams[]];
export declare const getListProductsQueryOptions: <TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params?: ListProductsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProductsQueryResult = NonNullable<Awaited<ReturnType<typeof listProducts>>>;
export type ListProductsQueryError = ErrorType<unknown>;
/**
 * @summary List synced products
 */
export declare function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params?: ListProductsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSyncProductsUrl: () => string;
/**
 * @summary Sync products from Komerza
 */
export declare const syncProducts: (productSyncInput?: ProductSyncInput, options?: Parameters<typeof customFetch>[1]) => Promise<ProductSyncResult>;
export declare const getSyncProductsMutationKey: () => readonly ["syncProducts"];
export declare const getSyncProductsMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof syncProducts>>, TError, SyncProductsMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof syncProducts>>, TError, SyncProductsMutationVariables, TContext>;
export type SyncProductsMutationResult = NonNullable<Awaited<ReturnType<typeof syncProducts>>>;
export type SyncProductsMutationBody = BodyType<ProductSyncInput> | undefined;
export type SyncProductsMutationError = ErrorType<ErrorResponse>;
export type SyncProductsMutationVariables = {
    data?: BodyType<ProductSyncInput>;
};
/**
* @summary Sync products from Komerza
*/
export declare const useSyncProducts: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof syncProducts>>, TError, SyncProductsMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof syncProducts>>, TError, SyncProductsMutationVariables, TContext>;
export declare const getListTicketsUrl: (params?: ListTicketsParams) => string;
/**
 * @summary List Discord ticket channels
 */
export declare const listTickets: (params?: ListTicketsParams, options?: Parameters<typeof customFetch>[1]) => Promise<Ticket[]>;
export declare const getListTicketsQueryKey: (params?: ListTicketsParams) => readonly ["/api/tickets", ...ListTicketsParams[]];
export declare const getListTicketsQueryOptions: <TData = Awaited<ReturnType<typeof listTickets>>, TError = ErrorType<unknown>>(params?: ListTicketsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTickets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTickets>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTicketsQueryResult = NonNullable<Awaited<ReturnType<typeof listTickets>>>;
export type ListTicketsQueryError = ErrorType<unknown>;
/**
 * @summary List Discord ticket channels
 */
export declare function useListTickets<TData = Awaited<ReturnType<typeof listTickets>>, TError = ErrorType<unknown>>(params?: ListTicketsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTickets>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetTicketUrl: (ticketId: string) => string;
/**
 * @summary Get one ticket
 */
export declare const getTicket: (ticketId: string, options?: Parameters<typeof customFetch>[1]) => Promise<Ticket>;
export declare const getGetTicketQueryKey: (ticketId: string) => readonly [`/api/tickets/${string}`];
export declare const getGetTicketQueryOptions: <TData = Awaited<ReturnType<typeof getTicket>>, TError = ErrorType<ErrorResponse>>(ticketId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTicket>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTicket>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTicketQueryResult = NonNullable<Awaited<ReturnType<typeof getTicket>>>;
export type GetTicketQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get one ticket
 */
export declare function useGetTicket<TData = Awaited<ReturnType<typeof getTicket>>, TError = ErrorType<ErrorResponse>>(ticketId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTicket>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateTicketUrl: (ticketId: string) => string;
/**
 * @summary Update ticket state
 */
export declare const updateTicket: (ticketId: string, ticketUpdate: TicketUpdate, options?: Parameters<typeof customFetch>[1]) => Promise<Ticket>;
export declare const getUpdateTicketMutationKey: () => readonly ["updateTicket"];
export declare const getUpdateTicketMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTicket>>, TError, UpdateTicketMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateTicket>>, TError, UpdateTicketMutationVariables, TContext>;
export type UpdateTicketMutationResult = NonNullable<Awaited<ReturnType<typeof updateTicket>>>;
export type UpdateTicketMutationBody = BodyType<TicketUpdate>;
export type UpdateTicketMutationError = ErrorType<unknown>;
export type UpdateTicketMutationVariables = {
    ticketId: string;
    data: BodyType<TicketUpdate>;
};
/**
* @summary Update ticket state
*/
export declare const useUpdateTicket: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTicket>>, TError, UpdateTicketMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateTicket>>, TError, UpdateTicketMutationVariables, TContext>;
export declare const getUploadTicketAttachmentUrl: (ticketId: string) => string;
/**
 * Stores attachment metadata. Byte storage is enabled when object storage is configured.
 * @summary Register a ticket attachment
 */
export declare const uploadTicketAttachment: (ticketId: string, attachmentInput: AttachmentInput, options?: Parameters<typeof customFetch>[1]) => Promise<Attachment>;
export declare const getUploadTicketAttachmentMutationKey: () => readonly ["uploadTicketAttachment"];
export declare const getUploadTicketAttachmentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof uploadTicketAttachment>>, TError, UploadTicketAttachmentMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof uploadTicketAttachment>>, TError, UploadTicketAttachmentMutationVariables, TContext>;
export type UploadTicketAttachmentMutationResult = NonNullable<Awaited<ReturnType<typeof uploadTicketAttachment>>>;
export type UploadTicketAttachmentMutationBody = BodyType<AttachmentInput>;
export type UploadTicketAttachmentMutationError = ErrorType<unknown>;
export type UploadTicketAttachmentMutationVariables = {
    ticketId: string;
    data: BodyType<AttachmentInput>;
};
/**
* @summary Register a ticket attachment
*/
export declare const useUploadTicketAttachment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof uploadTicketAttachment>>, TError, UploadTicketAttachmentMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof uploadTicketAttachment>>, TError, UploadTicketAttachmentMutationVariables, TContext>;
export declare const getRequestStorageUploadUrlUrl: () => string;
/**
 * @summary Request a direct object storage upload URL
 */
export declare const requestStorageUploadUrl: (storageUploadInput: StorageUploadInput, options?: Parameters<typeof customFetch>[1]) => Promise<StorageUploadResponse>;
export declare const getRequestStorageUploadUrlMutationKey: () => readonly ["requestStorageUploadUrl"];
export declare const getRequestStorageUploadUrlMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestStorageUploadUrl>>, TError, RequestStorageUploadUrlMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof requestStorageUploadUrl>>, TError, RequestStorageUploadUrlMutationVariables, TContext>;
export type RequestStorageUploadUrlMutationResult = NonNullable<Awaited<ReturnType<typeof requestStorageUploadUrl>>>;
export type RequestStorageUploadUrlMutationBody = BodyType<StorageUploadInput>;
export type RequestStorageUploadUrlMutationError = ErrorType<ErrorResponse>;
export type RequestStorageUploadUrlMutationVariables = {
    data: BodyType<StorageUploadInput>;
};
/**
* @summary Request a direct object storage upload URL
*/
export declare const useRequestStorageUploadUrl: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestStorageUploadUrl>>, TError, RequestStorageUploadUrlMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof requestStorageUploadUrl>>, TError, RequestStorageUploadUrlMutationVariables, TContext>;
export declare const getListPaymentInvoicesUrl: () => string;
/**
 * @summary List Litecoin invoices
 */
export declare const listPaymentInvoices: (options?: Parameters<typeof customFetch>[1]) => Promise<PaymentInvoice[]>;
export declare const getListPaymentInvoicesQueryKey: () => readonly ["/api/payments/invoices"];
export declare const getListPaymentInvoicesQueryOptions: <TData = Awaited<ReturnType<typeof listPaymentInvoices>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPaymentInvoices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPaymentInvoices>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPaymentInvoicesQueryResult = NonNullable<Awaited<ReturnType<typeof listPaymentInvoices>>>;
export type ListPaymentInvoicesQueryError = ErrorType<unknown>;
/**
 * @summary List Litecoin invoices
 */
export declare function useListPaymentInvoices<TData = Awaited<ReturnType<typeof listPaymentInvoices>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPaymentInvoices>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreatePaymentInvoiceUrl: () => string;
/**
 * @summary Create a Litecoin invoice
 */
export declare const createPaymentInvoice: (paymentInvoiceInput: PaymentInvoiceInput, options?: Parameters<typeof customFetch>[1]) => Promise<PaymentInvoice>;
export declare const getCreatePaymentInvoiceMutationKey: () => readonly ["createPaymentInvoice"];
export declare const getCreatePaymentInvoiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPaymentInvoice>>, TError, CreatePaymentInvoiceMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPaymentInvoice>>, TError, CreatePaymentInvoiceMutationVariables, TContext>;
export type CreatePaymentInvoiceMutationResult = NonNullable<Awaited<ReturnType<typeof createPaymentInvoice>>>;
export type CreatePaymentInvoiceMutationBody = BodyType<PaymentInvoiceInput>;
export type CreatePaymentInvoiceMutationError = ErrorType<unknown>;
export type CreatePaymentInvoiceMutationVariables = {
    data: BodyType<PaymentInvoiceInput>;
};
/**
* @summary Create a Litecoin invoice
*/
export declare const useCreatePaymentInvoice: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPaymentInvoice>>, TError, CreatePaymentInvoiceMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPaymentInvoice>>, TError, CreatePaymentInvoiceMutationVariables, TContext>;
export declare const getGetPaymentInvoiceUrl: (invoiceId: string) => string;
/**
 * @summary Get invoice status
 */
export declare const getPaymentInvoice: (invoiceId: string, options?: Parameters<typeof customFetch>[1]) => Promise<PaymentInvoice>;
export declare const getGetPaymentInvoiceQueryKey: (invoiceId: string) => readonly [`/api/payments/invoices/${string}`];
export declare const getGetPaymentInvoiceQueryOptions: <TData = Awaited<ReturnType<typeof getPaymentInvoice>>, TError = ErrorType<ErrorResponse>>(invoiceId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPaymentInvoice>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPaymentInvoice>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPaymentInvoiceQueryResult = NonNullable<Awaited<ReturnType<typeof getPaymentInvoice>>>;
export type GetPaymentInvoiceQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get invoice status
 */
export declare function useGetPaymentInvoice<TData = Awaited<ReturnType<typeof getPaymentInvoice>>, TError = ErrorType<ErrorResponse>>(invoiceId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPaymentInvoice>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getVerifyPaymentInvoiceUrl: (invoiceId: string) => string;
/**
 * @summary Verify a Litecoin transaction
 */
export declare const verifyPaymentInvoice: (invoiceId: string, paymentVerificationInput: PaymentVerificationInput, options?: Parameters<typeof customFetch>[1]) => Promise<PaymentVerificationResult>;
export declare const getVerifyPaymentInvoiceMutationKey: () => readonly ["verifyPaymentInvoice"];
export declare const getVerifyPaymentInvoiceMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof verifyPaymentInvoice>>, TError, VerifyPaymentInvoiceMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof verifyPaymentInvoice>>, TError, VerifyPaymentInvoiceMutationVariables, TContext>;
export type VerifyPaymentInvoiceMutationResult = NonNullable<Awaited<ReturnType<typeof verifyPaymentInvoice>>>;
export type VerifyPaymentInvoiceMutationBody = BodyType<PaymentVerificationInput>;
export type VerifyPaymentInvoiceMutationError = ErrorType<unknown>;
export type VerifyPaymentInvoiceMutationVariables = {
    invoiceId: string;
    data: BodyType<PaymentVerificationInput>;
};
/**
* @summary Verify a Litecoin transaction
*/
export declare const useVerifyPaymentInvoice: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof verifyPaymentInvoice>>, TError, VerifyPaymentInvoiceMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof verifyPaymentInvoice>>, TError, VerifyPaymentInvoiceMutationVariables, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map