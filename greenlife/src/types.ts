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
}

export interface CartItem {
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
}

export interface StoreOrder {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: "pending" | "processing" | "shipped" | "cancelled";
  itemsCount: number;
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
