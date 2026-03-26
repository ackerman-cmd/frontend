import type { OperatorSummary } from '../../common/types';

export interface SkillGroupResponse {
  id: string;
  name: string;
  description?: string;
  skills: string[];
  operators: OperatorSummary[];
  operatorCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillGroupRequest {
  name: string;
  description?: string;
  skills: string[];
  operatorIds: string[];
}

export interface GroupOperatorsRequest {
  operatorIds: string[];
}
