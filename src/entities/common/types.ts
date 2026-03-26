export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface OperatorSummary {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
}

/** Used by /api/v1/references/* endpoints */
export interface ReferenceItemResponse {
  code: string;
  label: string;
  description?: string;
}
