import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store/store';
import { logout } from '../../features/auth/model/authSlice';
import { CRM_API_BASE_URL } from '../lib/constants';

const rawCrmQuery = fetchBaseQuery({
  baseUrl: CRM_API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const crmBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, api, extraOptions) => {
    const result = await rawCrmQuery(args, api, extraOptions);
    if (result.error?.status === 401) {
      api.dispatch(logout());
      window.location.href = '/login';
    }
    return result;
  };

export const crmApi = createApi({
  reducerPath: 'crmApi',
  baseQuery: crmBaseQuery,
  tagTypes: ['Appeal', 'AppealMessages', 'Organization', 'AssignmentGroup', 'SkillGroup', 'AppealTopic'],
  endpoints: () => ({}),
});
