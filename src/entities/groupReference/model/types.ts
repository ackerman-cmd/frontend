export interface OperatorSummaryResponse {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface GroupWithOperatorsDto {
  id: string;
  name: string;
  operators: OperatorSummaryResponse[];
}

export interface AllGroupsWithOperatorsResponse {
  assignmentGroups: GroupWithOperatorsDto[];
  skillGroups: GroupWithOperatorsDto[];
}

