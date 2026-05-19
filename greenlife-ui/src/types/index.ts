export interface Plant {
  id: string;
  name: string;
  scientificName: string;
  price: number;
  category: 'indoor' | 'outdoor' | 'succulent' | 'office';
  image: string;
  description: string;
  careLevel: 'Dễ' | 'Trung bình' | 'Khó';
  lightLevel: 'Thấp' | 'Trung bình' | 'Cao';
  waterLevel: 'Thấp' | 'Trung bình' | 'Cao';
  light: string;
  water: string;
  tags: string[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  icon: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  image: string;
  date: string;
  author: string;
  category: string;
}

export interface Expert {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  rating: number;
  reviews: number;
}
