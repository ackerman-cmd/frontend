import type { OperatorSummary } from '../../common/types';

export interface AssignmentGroupResponse {
  id: string;
  name: string;
  description?: string;
  operators: OperatorSummary[];
  operatorCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentGroupRequest {
  name: string;
  description?: string;
  operatorIds: string[];
}

export interface GroupOperatorsRequest {
  operatorIds: string[];
}
