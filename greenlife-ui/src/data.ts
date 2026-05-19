import { Plant, BlogPost, Service } from './types';

export const plants: Plant[] = [
  {
    id: '1',
    name: 'Cây Lưỡi Hổ',
    scientificName: 'Sansevieria trifasciata',
    price: 150000,
    category: 'indoor',
    image: 'https://images.unsplash.com/photo-1593482892290-f54927ae1b6c?auto=format&fit=crop&q=80&w=800',
    description: 'Cây Lưỡi Hổ không chỉ đẹp mà còn có khả năng lọc không khí cực tốt, đặc biệt là vào ban đêm.',
    careLevel: 'Dễ',
    light: 'Ánh sáng gián tiếp hoặc bóng râm',
    water: 'Tưới khi đất khô hoàn toàn (2-3 tuần/lần)',
    tags: ['Lọc không khí', 'Phong thủy', 'Dễ chăm']
  },
  {
    id: '2',
    name: 'Cây Monstera Deliciosa',
    scientificName: 'Monstera deliciosa',
    price: 450000,
    category: 'indoor',
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=800',
    description: 'Loài cây "quốc dân" trong trang trí nội thất hiện đại với những chiếc lá xẻ độc đáo.',
    careLevel: 'Trung bình',
    light: 'Ánh sáng tán xạ mạnh',
    water: 'Giữ ẩm đất, tưới 1-2 lần/tuần',
    tags: ['Nhiệt đới', 'Trang trí', 'Trending']
  },
  {
    id: '3',
    name: 'Sen Đá Thạch Ngọc',
    scientificName: 'Sedum pachyphyllum',
    price: 85000,
    category: 'succulent',
    image: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&q=80&w=800',
    description: 'Nhỏ nhắn, xinh xắn và vô cùng dễ thương, phù hợp để bàn làm việc.',
    careLevel: 'Dễ',
    light: 'Nắng trực tiếp hoặc sáng mạnh',
    water: 'Tưới ít, 1 tuần/lần',
    tags: ['Để bàn', 'Quà tặng', 'Mini']
  },
  {
    id: '4',
    name: 'Cây Bàng Singapore',
    scientificName: 'Ficus lyrata',
    price: 280000,
    category: 'office',
    image: 'https://images.unsplash.com/photo-1520412099548-6a38b69113ef?auto=format&fit=crop&q=80&w=800',
    description: 'Lá to, xanh mướt, mang lại vẻ đẹp sang trọng và hiện đại cho không gian văn phòng.',
    careLevel: 'Trung bình',
    light: 'Ánh sáng gián tiếp',
    water: 'Tưới khi bề mặt đất khô',
    tags: ['Sang trọng', 'Văn phòng', 'Bền bỉ']
  }
];

export const services: Service[] = [
  {
    id: 's1',
    title: 'Thiết Kế Cảnh Quan',
    description: 'Tư vấn và thiết kế không gian xanh cho nhà phố, biệt thự và văn phòng.',
    price: 'Từ 2.000.000đ',
    icon: 'Leaf'
  },
  {
    id: 's2',
    title: 'Chăm Sóc Định Kỳ',
    description: 'Gói chăm sóc cây tận nơi: tưới nước, bón phân, tỉa cành và phòng bệnh.',
    price: 'Từ 500.000đ/tháng',
    icon: 'Droplets'
  },
  {
    id: 's3',
    title: 'Bệnh Viện Cây Xanh',
    description: 'Chẩn đoán và điều trị các vấn đề về sức khỏe của cây bởi chuyên gia.',
    price: 'Liên hệ',
    icon: 'Stethoscope'
  }
];

export const blogPosts: BlogPost[] = [
  {
    id: 'b1',
    title: '5 Loại Cây Tuyệt Vời Để Lọc Không Khí Trong Nhà',
    excerpt: 'Khám phá những loại cây không chỉ làm đẹp mà còn giúp bầu không khí trong lành hơn.',
    image: 'https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?auto=format&fit=crop&q=80&w=800',
    date: '2024-03-20',
    author: 'Minh Anh',
    category: 'Kiến thức'
  },
  {
    id: 'b2',
    title: 'Hướng Dẫn Chăm Sóc Sen Đá Cho Người Mới Bắt Đầu',
    excerpt: 'Những sai lầm thường gặp khi mới trồng sen đá và cách khắc phục đơn giản nhất.',
    image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&q=80&w=800',
    date: '2024-03-15',
    author: 'Đức Huy',
    category: 'Hướng dẫn'
  }
];
