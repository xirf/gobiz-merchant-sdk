export interface GoPayErrorItem {
  scope: 'F' | 'G' | string;
  field?: string;
  message?: string;
  description?: string;
  error_code?: number;
  error_name?: string;
}

export interface GoPayErrorResponseBody {
  errors?: GoPayErrorItem[];
  error_code?: number;
  message?: string;
  description?: string;
}
