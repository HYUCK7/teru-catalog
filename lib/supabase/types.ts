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
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
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
  created_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
};

export type ProductWithImages = Product & { images: ProductImage[] };
