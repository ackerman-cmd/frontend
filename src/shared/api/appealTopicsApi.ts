import { crmApi } from './crmBaseApi';
import type {
  AppealTopic,
  AppealTopicRequest,
  GroupedTopics,
} from '../../entities/appealTopic/model/types';

// Normalises whatever the server returns (plain array OR PageResponse) into AppealTopic[]
const toArray = (response: unknown): AppealTopic[] => {
  if (Array.isArray(response)) return response;
  const page = response as { content?: AppealTopic[] } | null;
  return page?.content ?? [];
};

export const appealTopicsApi = crmApi.injectEndpoints({
  endpoints: (build) => ({
    getAllTopics: build.query<AppealTopic[], void>({
      query: () => '/api/v1/appeal-topics',
      transformResponse: toArray,
      providesTags: ['AppealTopic' as any],
    }),

    getActiveTopics: build.query<AppealTopic[], void>({
      query: () => '/api/v1/appeal-topics/active',
      transformResponse: toArray,
      providesTags: ['AppealTopic' as any],
    }),

    getGroupedTopics: build.query<GroupedTopics, void>({
      query: () => '/api/v1/appeal-topics/grouped',
      // Normalise: each category value must be a plain array
      transformResponse: (raw: unknown): GroupedTopics => {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
        const result: GroupedTopics = {};
        for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
          result[key as keyof GroupedTopics] = Array.isArray(value) ? value : [];
        }
        return result;
      },
      providesTags: ['AppealTopic' as any],
    }),

    getTopicById: build.query<AppealTopic, string>({
      query: (id) => `/api/v1/appeal-topics/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AppealTopic' as any, id }],
    }),

    createTopic: build.mutation<AppealTopic, AppealTopicRequest>({
      query: (body) => ({ url: '/api/v1/appeal-topics', method: 'POST', body }),
      invalidatesTags: ['AppealTopic' as any],
    }),

    updateTopic: build.mutation<AppealTopic, { id: string; body: AppealTopicRequest }>({
      query: ({ id, body }) => ({ url: `/api/v1/appeal-topics/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['AppealTopic' as any, { type: 'AppealTopic' as any, id }],
    }),

    setTopicActive: build.mutation<AppealTopic, { id: string; active: boolean }>({
      query: ({ id, active }) => ({
        url: `/api/v1/appeal-topics/${id}/active`,
        method: 'PATCH',
        params: { active },
      }),
      invalidatesTags: (_r, _e, { id }) => ['AppealTopic' as any, { type: 'AppealTopic' as any, id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllTopicsQuery,
  useGetActiveTopicsQuery,
  useGetGroupedTopicsQuery,
  useGetTopicByIdQuery,
  useCreateTopicMutation,
  useUpdateTopicMutation,
  useSetTopicActiveMutation,
} = appealTopicsApi;
