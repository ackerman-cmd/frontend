import { baseApi } from './baseApi';
import type { UserResponse, UserStatus } from '../../entities/user/model/types';
import type { PageResponse } from '../../entities/common/types';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    adminGetUserById: builder.query<UserResponse, string>({
      query: (id) => `/api/v1/admin/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AdminUser', id }],
    }),

    adminGetUserByUsername: builder.query<UserResponse, string>({
      query: (username) => ({
        url: '/api/v1/admin/users/username',
        params: { username },
      }),
      providesTags: (result) =>
        result ? [{ type: 'AdminUser', id: result.id }] : [],
    }),

    adminChangeUserStatus: builder.mutation<
      UserResponse,
      { id: string; status: UserStatus }
    >({
      query: ({ id, status }) => ({
        url: `/api/v1/admin/users/${id}/status`,
        method: 'PATCH',
        params: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'AdminUser', id }],
    }),

    listOperators: builder.query<
      PageResponse<UserResponse>,
      { page?: number; size?: number } | void
    >({
      query: (params) => ({
        url: '/api/v1/admin/users',
        params: { page: params?.page ?? 0, size: params?.size ?? 200 },
      }),
      providesTags: ['AdminUser'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useAdminGetUserByIdQuery,
  useAdminGetUserByUsernameQuery,
  useAdminChangeUserStatusMutation,
  useListOperatorsQuery,
} = adminApi;
