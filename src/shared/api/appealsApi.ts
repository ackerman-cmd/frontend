import { crmApi } from './crmBaseApi';
import type { PageResponse } from '../../entities/common/types';
import type {
  AppealResponse,
  AppealRequest,
  AppealUpdateRequest,
  AppealFilterRequest,
  AppealMessageResponse,
  AppealMessageRequest,
  AssignOperatorRequest,
  ChangeStatusRequest,
  AvailableActionsResponse,
} from '../../entities/appeal/model/types';

export const appealsApi = crmApi.injectEndpoints({
  endpoints: (build) => ({
    filterAppeals: build.query<PageResponse<AppealResponse>, AppealFilterRequest>({
      query: (filter) => ({ url: '/api/v1/appeals', params: filter }),
      providesTags: ['Appeal'],
    }),

    createAppeal: build.mutation<AppealResponse, AppealRequest>({
      query: (body) => ({ url: '/api/v1/appeals', method: 'POST', body }),
      invalidatesTags: ['Appeal'],
    }),

    getAppealById: build.query<AppealResponse, string>({
      query: (id) => `/api/v1/appeals/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Appeal', id }],
    }),

    updateAppeal: build.mutation<AppealResponse, { id: string; body: AppealUpdateRequest }>({
      query: ({ id, body }) => ({ url: `/api/v1/appeals/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['Appeal', { type: 'Appeal', id }],
    }),

    deleteAppeal: build.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/appeals/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Appeal'],
    }),

    takeAppeal: build.mutation<AppealResponse, string>({
      query: (id) => ({ url: `/api/v1/appeals/${id}/take`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => ['Appeal', { type: 'Appeal', id }],
    }),

    closeAppeal: build.mutation<AppealResponse, string>({
      query: (id) => ({ url: `/api/v1/appeals/${id}/close`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => ['Appeal', { type: 'Appeal', id }],
    }),

    markAppealAsSpam: build.mutation<AppealResponse, string>({
      query: (id) => ({ url: `/api/v1/appeals/${id}/spam`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => ['Appeal', { type: 'Appeal', id }],
    }),

    assignOperator: build.mutation<AppealResponse, { id: string } & AssignOperatorRequest>({
      query: ({ id, operatorId, assignmentGroupId, skillGroupId }) => ({
        url: `/api/v1/appeals/${id}/assign`,
        method: 'POST',
        body: {
          ...(operatorId ? { operatorId } : {}),
          ...(assignmentGroupId ? { assignmentGroupId } : {}),
          ...(skillGroupId ? { skillGroupId } : {}),
        },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Appeal', id }],
    }),

    changeAppealStatus: build.mutation<AppealResponse, { id: string } & ChangeStatusRequest>({
      query: ({ id, status }) => ({
        url: `/api/v1/appeals/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_r, _e, { id }) => ['Appeal', { type: 'Appeal', id }],
    }),

    getAppealMessages: build.query<
      PageResponse<AppealMessageResponse>,
      { id: string; page?: number; size?: number }
    >({
      query: ({ id, page = 0, size = 50 }) => ({
        url: `/api/v1/appeals/${id}/messages`,
        params: { page, size, sort: 'createdAt,ASC' },
      }),
      providesTags: (_r, _e, { id }) => [{ type: 'AppealMessages', id }],
    }),

    sendOperatorMessage: build.mutation<
      AppealMessageResponse,
      { id: string; body: AppealMessageRequest }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/appeals/${id}/messages`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'AppealMessages', id },
        { type: 'Appeal', id },
      ],
    }),

    getAvailableActions: build.query<AvailableActionsResponse, string>({
      query: (id) => `/api/v1/appeals/${id}/actions`,
      providesTags: (_r, _e, id) => [{ type: 'Appeal', id }],
    }),

    fetchAppeals: build.mutation<AppealResponse[], { ids: string[] }>({
      query: (body) => ({ url: '/api/v1/appeals/fetch', method: 'POST', body }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useFilterAppealsQuery,
  useCreateAppealMutation,
  useGetAppealByIdQuery,
  useUpdateAppealMutation,
  useDeleteAppealMutation,
  useTakeAppealMutation,
  useCloseAppealMutation,
  useMarkAppealAsSpamMutation,
  useAssignOperatorMutation,
  useChangeAppealStatusMutation,
  useGetAppealMessagesQuery,
  useSendOperatorMessageMutation,
  useGetAvailableActionsQuery,
  useFetchAppealsMutation,
} = appealsApi;
