// WooCommerce API response types

export interface WooCommerceSubscription {
  id: number;
  status?: string;
  date_created?: string;
  date_created_gmt?: string;
  date_modified?: string;
  date_modified_gmt?: string;
  next_payment_date?: string;
  next_payment_date_gmt?: string;
  end_date?: string;
  end_date_gmt?: string;
  billing_period?: string;
  billing_interval?: string;
  total?: string;
  currency?: string;
  line_items?: Array<{
    id: number;
    name?: string;
    quantity?: number;
    total?: string;
  }>;
  billing?: unknown;
  shipping?: unknown;
  payment_method?: string;
  payment_method_title?: string;
  related_orders?: number[];
}

export interface WooCommerceOrder {
  id: number;
  number?: string;
  status?: string;
  date_created?: string;
  date_created_gmt?: string;
  date_modified?: string;
  date_modified_gmt?: string;
  date_completed?: string;
  date_completed_gmt?: string;
  date_paid?: string;
  date_paid_gmt?: string;
  total?: string;
  currency?: string;
  line_items?: Array<{
    id: number;
    name?: string;
    quantity?: number;
    price?: string;
    subtotal?: string;
    total?: string;
    sku?: string;
    product_id?: number;
    variation_id?: number;
  }>;
  billing?: unknown;
  shipping?: unknown;
  meta_data?: Array<{
    key?: string;
    value?: unknown;
  }>;
}

export interface WooCommerceCustomer {
  id: number;
  email?: string;
  billing?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  shipping?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}
