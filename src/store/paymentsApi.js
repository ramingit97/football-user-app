import { createApi } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';
import { buildBaseQueryWithReauth } from './baseQueryWithReauth';

export const paymentsApi = createApi({
    reducerPath: 'paymentsApi',
    baseQuery: buildBaseQueryWithReauth(`${API_BASE}/api/payments`),
    endpoints: (builder) => ({
        processPayment: builder.mutation({
            query: (body) => ({
                url: '/pay',
                method: 'POST',
                body,
            }),
        }),
        refundPayment: builder.mutation({
            query: (body) => ({
                url: '/refund',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useProcessPaymentMutation,
    useRefundPaymentMutation,
} = paymentsApi;
