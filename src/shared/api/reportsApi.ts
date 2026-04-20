import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store/store';
import { REPORT_API_BASE_URL } from '../lib/constants';

export interface ReportHistoryDto {
  id: string;
  reportType: string;
  generatedAt: string;
  sentAt?: string;
  status: string;
  periodStart?: string;
  periodEnd?: string;
  totalAppeals?: number;
  slaBreachesCount?: number;
  s3Url?: string;
  fileSizeBytes?: number;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: REPORT_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Reports'],
  endpoints: (builder) => ({
    getReports: builder.query<PageResponse<ReportHistoryDto>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 20 } = {}) =>
        `/api/v1/reports?page=${page}&size=${size}`,
      providesTags: ['Reports'],
    }),

    generateReport: builder.mutation<void, void>({
      query: () => ({ url: '/api/v1/reports/generate', method: 'POST' }),
      invalidatesTags: ['Reports'],
    }),
  }),
});

export const { useGetReportsQuery, useGenerateReportMutation } = reportsApi;
