export type MenuItem = {
  category: string;
  name: string;
  description?: string;
};

export type DailyMenu = {
  date: string; // YYYY-MM-DD
  items: MenuItem[];
  updated_at: string;
};

export type Reservation = {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  party_size: number;
  notes: string | null;
  status: string;
  created_at: string;
};

export type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: string;
  specify: string | null;
  event_type: string | null;
  pax: number | null;
  event_date: string | null;
  message: string | null;
  created_at: string;
};

export type GalleryImage = {
  id: string;
  url: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
};
