import { createApi } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '../config.js';
import { buildBaseQueryWithReauth } from './baseQueryWithReauth';

export const notificationsApi = createApi({
    reducerPath: 'notificationsApi',
    baseQuery: buildBaseQueryWithReauth(`${API_BASE}/api/notifications`),
    tagTypes: ['Notifications'],
    endpoints: (builder) => ({
        getMyNotifications: builder.query({
            query: (userId) => `/my?userId=${userId}`,
            providesTags: ['Notifications'],
        }),
        sendNotification: builder.mutation({
            query: (body) => ({
                url: '/send',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Notifications'],
        }),
        markAsRead: builder.mutation({
            query: (id) => ({
                url: `/${id}/read`,
                method: 'PATCH',
            }),
            invalidatesTags: ['Notifications'],
        }),
        markAllAsRead: builder.mutation({
            queryFn: async (ids, _api, _opts, baseQuery) => {
                await Promise.all(ids.map(id => baseQuery({ url: `/${id}/read`, method: 'PATCH' })));
                return { data: { success: true } };
            },
            invalidatesTags: ['Notifications'],
        }),
    }),
});

export const {
    useGetMyNotificationsQuery,
    useSendNotificationMutation,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
} = notificationsApi;
