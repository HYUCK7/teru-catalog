export type SiteSettings = {
  id: number;
  shop_name: string;
  intro: string;
  logo_url: string | null;
  banner_url: string | null;
  kakao_channel_url: string | null;
  kakao_label: string | null;
  phone: string | null;
  phone_label: string | null;
  instagram: string | null;
  instagram_label: string | null;
  closed_weekdays: number[];
  updated_at: string;
};

export type BlockedTime = {
  id: string;
  block_date: string;
  block_time: string;
};

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  design_enabled: boolean;
  created_at: string;
};

export type ChoiceKind = "flavor" | "option";

export type CategoryChoice = {
  id: string;
  category_id: string;
  kind: ChoiceKind;
  label: string;
  price: number;
  sort_order: number;
  created_at: string;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  price: number;
  description: string;
  is_visible: boolean;
  sort_order: number;
  flavor_enabled: boolean;
  option_enabled: boolean;
  created_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
};

export type ProductWithImages = Product & { images: ProductImage[] };

export type SelectedChoice = {
  label: string;
  price: number;
  kind: ChoiceKind;
};

export type OrderStatus = "confirmed" | "pickup_waiting" | "picked_up";

export type Order = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  customer_name: string;
  phone: string;
  pickup_date: string;
  pickup_time: string;
  lettering: string;
  request_memo: string;
  selected_choices: SelectedChoice[];
  design_image_url: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
};
