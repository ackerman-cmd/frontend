import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store/store';
import { logout } from '../../features/auth/model/authSlice';
import { API_BASE_URL } from '../lib/constants';

const PUBLIC_ENDPOINTS: string[] = [
  'register',
  'verifyEmail',
  'exchangeCodeForToken',
  'serverLogout',
];

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState, endpoint }) => {
    if (endpoint && PUBLIC_ENDPOINTS.includes(endpoint)) {
      return headers;
    }
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (
      result.error?.status === 401 &&
      api.endpoint &&
      !PUBLIC_ENDPOINTS.includes(api.endpoint)
    ) {
      api.dispatch(logout());
      window.location.href = '/signin';
    }

    return result;
  };

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['CurrentUser', 'User', 'AdminUser'],
  endpoints: () => ({}),
});
