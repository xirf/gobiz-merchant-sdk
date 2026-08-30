export interface OutletAddress {
  address?: string;
  city?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
}

export interface OutletInfo {
  id: string;
  name: string;
  brand_name?: string;
  address?: OutletAddress;
  phone_number?: string;
  email?: string;
  status?: string;
  merchant_id?: string;
  pop_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LinkedOutletsResponse {
  outlets: OutletInfo[];
  page_info?: {
    page: number;
    page_size: number;
    total_count: number;
  };
}

export interface LinkOutletRequest {
  outlet_id: string;
  product?: string;
}
