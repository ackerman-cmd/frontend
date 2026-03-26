import { crmApi } from './crmBaseApi';
import type { AllGroupsWithOperatorsResponse } from '../../entities/groupReference/model/types';

export const referencesApi = crmApi.injectEndpoints({
  endpoints: (build) => ({
    getGroupsWithOperators: build.query<AllGroupsWithOperatorsResponse, void>({
      query: () => '/api/v1/references/groups-with-operators',
      providesTags: ['AssignmentGroup' as any, 'SkillGroup' as any],
      transformResponse: (raw: unknown) => raw as AllGroupsWithOperatorsResponse,
    }),
  }),
  overrideExisting: false,
});

export const { useGetGroupsWithOperatorsQuery } = referencesApi;

