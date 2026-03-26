import { crmApi } from './crmBaseApi';
import type { PageResponse } from '../../entities/common/types';
import type {
  SkillGroupResponse,
  SkillGroupRequest,
  GroupOperatorsRequest,
} from '../../entities/skillGroup/model/types';

export const skillGroupsApi = crmApi.injectEndpoints({
  endpoints: (build) => ({
    getSkillGroups: build.query<
      PageResponse<SkillGroupResponse>,
      { page?: number; size?: number; sort?: string }
    >({
      query: ({ page = 0, size = 20, sort = 'name,ASC' } = {}) => ({
        url: '/api/v1/skill-groups',
        params: { page, size, sort },
      }),
      providesTags: ['SkillGroup'],
    }),

    createSkillGroup: build.mutation<SkillGroupResponse, SkillGroupRequest>({
      query: (body) => ({ url: '/api/v1/skill-groups', method: 'POST', body }),
      invalidatesTags: ['SkillGroup'],
    }),

    getSkillGroupById: build.query<SkillGroupResponse, string>({
      query: (id) => `/api/v1/skill-groups/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'SkillGroup', id }],
    }),

    updateSkillGroup: build.mutation<SkillGroupResponse, { id: string; body: SkillGroupRequest }>({
      query: ({ id, body }) => ({ url: `/api/v1/skill-groups/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['SkillGroup', { type: 'SkillGroup', id }],
    }),

    deleteSkillGroup: build.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/skill-groups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SkillGroup'],
    }),

    addOperatorsToSkillGroup: build.mutation<
      SkillGroupResponse,
      { id: string } & GroupOperatorsRequest
    >({
      query: ({ id, operatorIds }) => ({
        url: `/api/v1/skill-groups/${id}/operators`,
        method: 'POST',
        body: { operatorIds },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'SkillGroup', id }],
    }),

    removeOperatorFromSkillGroup: build.mutation<
      SkillGroupResponse,
      { id: string; operatorId: string }
    >({
      query: ({ id, operatorId }) => ({
        url: `/api/v1/skill-groups/${id}/operators/${operatorId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'SkillGroup', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSkillGroupsQuery,
  useCreateSkillGroupMutation,
  useGetSkillGroupByIdQuery,
  useUpdateSkillGroupMutation,
  useDeleteSkillGroupMutation,
  useAddOperatorsToSkillGroupMutation,
  useRemoveOperatorFromSkillGroupMutation,
} = skillGroupsApi;
