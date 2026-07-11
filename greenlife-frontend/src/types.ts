export interface Product {
  id: string;
  name: string;
  category: "plants" | "care" | "nutrients" | "smarthome";
  price: number; // in VND
  rating: number;
  image: string;
  description: string;
  ecoScore: number; // 1-100 indicating green standards
  details: string[];
  specs: Record<string, string>;
  stock: number;
  shopId?: string;
  sku?: string;
  isBestSeller?: boolean;
}

export interface CartItem {
  id?: number;
  product: Product;
  quantity: number;
}

export interface DiagnosisLog {
  id: string;
  date: string;
  plantName: string;
  diseaseName: string;
  severity: "nhẹ" | "trung bình" | "nặng";
  symptoms: string;
  treatment: string[];
  recommendedProductIds: string[];
  imageUrl: string;
  accuracy?: number; // percent confidence 0-100
  notes?: string;
}

export interface Appointment {
  id: string;
  expertName: string;
  title: string;
  date: string;
  time: string;
  type: "online" | "offline";
  price: number;
  status: "pending" | "confirmed" | "completed";
  durationMinutes?: number;
  expertAvatar?: string;
  userNotes?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: "urban-farming" | "eco-living" | "plant-care";
  image: string;
  likes?: number;
  views?: number;
  taggedProductIds?: string[];
  status?: string;
}

export interface Expert {
  id: string | number;
  name: string;
  title: string;
  specialty: string[];
  location: string;
  avatar: string;
  phone: string;
  zaloLink: string;
  facebookLink: string;
  bio: string;
}

export interface StoreOrder {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: "pending" | "processing" | "shipped" | "cancelled" | "completed" | "received" | "return_requested" | "return_approved" | "return_rejected";
  itemsCount: number;
  recipientPhone?: string;
  shippingAddress?: string;
  note?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentUrl?: string | null;
  paymentProvider?: string;
  payosCheckoutUrl?: string | null;
  payosQrCode?: string | null;
  items?: string;
  backendStatus?: string;
  returnRejectReason?: string;
  returnRequestReason?: string;
  returnRequestReasonCode?: string;
  evidenceImages?: string[];
  itemsList?: Array<{
    productId: string;
    productName: string;
    imageUrl: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface EnergySimulation {
  solarProduction: number; // kWh
  carbonReduced: number; // kg CO2
  moneySaved: number; // VND
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "customer" | "store" | "admin";
  carbonCredits: number; // in CPT
  co2SavedKg: number;
  registeredDate: string;
  savedProductIds: string[];
  is_seller?: boolean;
  shop_name?: string;
  shop_address?: string;
  bank_account?: string;
  shop_email?: string;
  shop_phone?: string;
  shipping_green_express?: boolean;
  shipping_hoa_toc?: boolean;
  shipping_spx?: boolean;
  shipping_ghtk?: boolean;
  kyc_front_image?: string;
  kyc_back_image?: string;
}

export interface UserAddress {
  address_id?: number;
  user_id: string;
  fullname: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detail_address: string;
  is_default: boolean;
  is_pickup: boolean;
  type: "home" | "office";
}

export interface EcoStore {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  rating: number;
  avatar: string;
  bannerImage: string;
  address: string;
  workingHours: string;
  carbonOffsetKg: number;
  productsCount: number;
  verified: boolean;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  serviceArea?: string;
}

export interface Plant {
  id: string;
  commonName: string;
  botanicalName: string;
  wateringInstructions: string;
  sunlightRequirement: string;
  difficulty: "dễ" | "trung bình" | "khó";
  bestSeason: string;
  description: string;
  purifyingProperties: string[];
}

export interface RoutePermission {
  allowedRoles: Array<"customer" | "store" | "admin">;
  fallbackPage: string;
}

export interface Feedback {
  id: number;
  productId: string;
  userId: string;
  orderId: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
  userName?: string;
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  referenceType: "ORDER" | "PAYMENT" | "REVIEW" | "PLANT" | "STORE" | "SYSTEM" | "BOOKING";
  referenceId: number;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface BroadcastRequest {
  title: string;
  message: string;
}


