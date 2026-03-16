import { baseApi } from './baseApi';
import type {
  UserResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserStatus,
} from '../../entities/user/model/types';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query<UserResponse, void>({
      query: () => '/api/v1/users/me',
      providesTags: ['CurrentUser'],
    }),

    updateProfile: builder.mutation<UserResponse, UpdateProfileRequest>({
      query: (body) => ({
        url: '/api/v1/users/me/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CurrentUser'],
    }),

    changeOwnStatus: builder.mutation<UserResponse, UserStatus>({
      query: (status) => ({
        url: '/api/v1/users/me/status',
        method: 'PATCH',
        params: { status },
      }),
      invalidatesTags: ['CurrentUser'],
    }),

    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (body) => ({
        url: '/api/v1/users/me/password',
        method: 'PATCH',
        body,
      }),
    }),

    getUserById: builder.query<UserResponse, string>({
      query: (id) => `/api/v1/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),

    getUserByUsername: builder.query<UserResponse, string>({
      query: (username) => ({
        url: '/api/v1/users/username',
        params: { username },
      }),
      providesTags: (result) =>
        result ? [{ type: 'User', id: result.id }] : [],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangeOwnStatusMutation,
  useChangePasswordMutation,
  useGetUserByIdQuery,
  useGetUserByUsernameQuery,
} = usersApi;
