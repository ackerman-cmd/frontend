export interface OrganizationResponse {
  id: string;
  name: string;
  inn: string;
  kpp?: string;
  ogrn?: string;
  legalAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationRequest {
  name: string;
  inn: string;
  kpp?: string;
  ogrn?: string;
  legalAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
}
