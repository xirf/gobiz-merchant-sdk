export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  in_stock: boolean;
  category_id?: string;
  image_url?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface FoodCatalog {
  categories: MenuCategory[];
}

export interface GoFoodOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface GoFoodOrder {
  order_id: string;
  outlet_id: string;
  status: string;
  items: GoFoodOrderItem[];
  total_amount: number;
  customer_name?: string;
  customer_phone?: string;
  driver_name?: string;
  driver_phone?: string;
  created_at: string;
}
