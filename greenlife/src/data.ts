import { Product, BlogPost, Appointment, StoreOrder, User, EcoStore, Plant, DiagnosisLog } from "./types";

export const PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Sen Đá Đô La Cẩm Thạch (Premium)",
    category: "plants",
    price: 120000,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
    description: "Dòng sen đá đột biến lá sọc cẩm thạch cực kỳ quý hiếm, dễ trồng, lọc không khí tốt và thu hút tài lộc phong thủy.",
    ecoScore: 95,
    details: [
      "Xuất xứ: Đà Lạt, Lâm Đồng (vườn canh tác hữu cơ 100%)",
      "Kích thước chậu: Đất nung tự chế tác 9x9cm",
      "Yêu cầu ánh sáng: Ánh sáng gián tiếp nhiều, 4-6h nắng nhẹ một ngày",
      "Tần suất tưới: 7-10 ngày/lần tùy độ khô của đất"
    ],
    specs: {
      "Độ tuổi": "1.5 năm",
      "Hệ rễ": "Rễ thuần, phát triển khỏe mạnh",
      "Chất liệu chậu": "Đất nung không tráng men bản địa",
      "Dấu chân Carbon": "Cực thấp (-12kg CO2eq/đời sống cây)"
    },
    stock: 24
  },
  {
    id: "prod-2",
    name: "Phân Trùn Quế Cao Cấp GreenLife Organic",
    category: "nutrients",
    price: 95000,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&auto=format&fit=crop&q=80",
    description: "Dinh dưỡng hữu cơ vi sinh đậm đặc tăng đề kháng cho cây trồng, kích rễ vượt trội và đất tơi xốp tự nhiên.",
    ecoScore: 100,
    details: [
      "Thành phần: 100% phân trùn quế nguyên chất xử lý nhiệt vi sinh",
      "Khối lượng tịnh: 2.5 kg đựng trong túi phân hủy sinh học tự nhiên",
      "Hiệu quả: Cải tạo đất bạc màu, bổ sung vi sinh có lợi bản địa",
      "An toàn tuyệt đối đối với trẻ em và thú cưng tại nhà"
    ],
    specs: {
      "Hàm lượng hữu cơ": "Trên 45%",
      "Độ ẩm lý tưởng": "30% - 40%",
      "Chứng nhận": "Organic Việt Nam & ISO 9001",
      "Đóng gói": "Túi tinh bột khoai mì tự phân hủy trong 6 tháng"
    },
    stock: 150
  },
  {
    id: "prod-3",
    name: "Cây Trầu Bà Đế Vương Xanh (Noble Green)",
    category: "plants",
    price: 320000,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&auto=format&fit=crop&q=80",
    description: "Cây nội thất phân khúc xa xỉ có khả năng khử sóng điện từ, lọc khí độc benzen, formadehyde vượt trội.",
    ecoScore: 88,
    details: [
      "Kích thước: Chiều cao cây 45-50cm gồm chậu tối giản",
      "Chậu cây: Chậu gốm thủ công tráng men chảy nghệ thuật",
      "Thích hợp: Đặt bàn làm việc lớn, phòng khách, phòng họp tinh tế",
      "Bảo dưỡng: Lau bụi trên mặt lá hàng tuần bằng khăn cotton ẩm"
    ],
    specs: {
      "Phạm vi lọc khí": "Lên tới 15m2 một chậu tiêu chuẩn",
      "Mức lọc sóng từ": "Giảm 65% sóng Wi-Fi / điện tử lân cận",
      "Kiểu chậu": "Gốm thủ công Bát Tràng nghệ thuật",
      "Tuổi thọ": "Lâu năm, phát triển tự nhiên trong nhà"
    },
    stock: 12
  },
  {
    id: "prod-4",
    name: "Cảm Biến Độ Ẩm Khí Quyển Smart-Grow IoT",
    category: "smarthome",
    price: 450000,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
    description: "Tích hợp Wi-Fi Bluetooth năng lượng mặt trời giúp giám sát thời gian thực độ ẩm đất, nhiệt độ và lượng quang phổ tại vườn.",
    ecoScore: 92,
    details: [
      "Năng lượng: Pin mặt trời Monocrystalline tích hợp siêu nhạy",
      "Kết nối: Đồng bộ app GreenLife real-time quản lý qua cloud",
      "Chuẩn kháng nước: IP67 chống chịu thời tiết mưa giông nhiệt đới",
      "Cảnh báo: Tự động gửi thông tin tưới nước trực tiếp về điện thoại"
    ],
    specs: {
      "Độ chính xác độ ẩm": "+/- 2%",
      "Thời lượng pin": "Tự duy trì trọn đời nhờ năng lượng sạch tích hợp",
      "Module không dây": "ESP32 S3 Ultra Low Power",
      "Thương hiệu": "GreenLife IoT Việt Nam"
    },
    stock: 45
  },
  {
    id: "prod-5",
    name: "Chế Phẩm Sinh Học Trừ Sâu Neem Ép Lạnh",
    category: "care",
    price: 150000,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&auto=format&fit=crop&q=80",
    description: "Dầu Neem nguyên chất hữu cơ diệt trừ hiệu quả rệp sáp, nhện đỏ, bọ trĩ mà không gây độc hại môi trường.",
    ecoScore: 100,
    details: [
      "Thành phần: 100% tinh chất sầu đông (neem) ép lạnh tự nhiên",
      "Cơ chế tác dụng: Phá hủy vòng đời sinh trưởng của sâu hại, cắt nguồn dinh dưỡng",
      "Liều dùng: Pha 5ml tinh dầu + 2ml nước rửa chén hữu cơ với 1 lít nước",
      "Ưu điểm: Hương dưa chuột dịu mát tự nhiên, xua đuổi ruồi muỗi"
    ],
    specs: {
      "Thời hạn sử dụng": "24 tháng kể từ ngày sản xuất",
      "Tính chất thuốc": "An toàn sinh học hoàn toàn, không cách ly hoa quả",
      "Nơi đóng chai": "Phân xưởng Bio-Tech GreenLife Hòa Lạc",
      "Hiệu quả phòng ngừa": "Ức chế tái nhiễm trong 30 ngày"
    },
    stock: 80
  },
  {
    id: "prod-6",
    name: "Hệ Thống Đèn LED Solar Sun-Mimic 120W",
    category: "smarthome",
    price: 580000,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80",
    description: "Đèn nuôi cây trong nhà giả lập hoàn hảo ánh sáng mặt trời tự nhiên giúp cây quang hợp toàn diện 365 ngày.",
    ecoScore: 94,
    details: [
      "Quang phổ: Thiết kế Full-Spectrum chuyên sâu cho tăng trưởng thực vật",
      "Tiết kiệm điện: Công nghệ LED thế hệ mới giảm 40% điện năng tiêu thụ",
      "Chân đế: Giá đỡ thép carbon sơn tĩnh điện sang trọng xoay 360 độ",
      "Timer: Chức năng hẹn giờ thông minh 3 chế độ (3h/9h/12h)"
    ],
    specs: {
      "Công suất tiêu thụ": "18W thực tế (Cho quang năng tương đương 120W halogen)",
      "Tuổi thọ bóng": "50.000 giờ thắp sáng liên tục",
      "Số bóng LED": "80 chip LED Samsung chuyên dụng",
      "Hiệu suất năng lượng": "Nhãn năng lượng 5 sao bền vững"
    },
    stock: 18
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "blog-1",
    title: "Nông nghiệp đô thị 4.0: Biến ban công nhà bạn thành nguồn thực phẩm sạch xanh",
    summary: "Hướng dẫn thực chiến từ chuyên gia để khởi tạo một hệ sinh thái vườn rau, thảo mộc khép kín tại căn hộ đô thị chỉ từ 2 mét vuông.",
    content: "Nông nghiệp đô thị không chỉ là trào lưu nhất thời mà đang nhanh chóng trở thành phong cách sống bền vững của thế hệ cư dân thông thái mới. Tại các thành phố lớn như Hà Nội, Hồ Chí Minh, không gian ban công thường khá khiêm tốn. Sách cẩm nang này sẽ hướng dẫn bạn cách phân tầng ánh sáng, sử dụng hệ giá đỡ bento thông minh, và lắp đặt các cảm biến độ ẩm vi điểm IoT. Kết quả, bạn không chỉ thu hoạch được xà lách sạch dồi dào mà còn giảm trực tiếp 5 độ C nhiệt bức xạ chiếu vào căn hộ của mình vào những đợt nắng nóng đỉnh điểm của mùa hè nhiệt đới.",
    author: "Kỹ sư nông nghiệp Nguyễn Minh Tiến",
    date: "2026-05-15",
    readTime: "6 phút đọc",
    category: "urban-farming",
    image: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: "blog-2",
    title: "Bí mật đằng sau 'Eco-Score' và lối sống giảm thiểu dấu chân Carbon",
    summary: "Đọc vị các con số tác động sinh thái trên dòng sản phẩm GreenLife và cách lựa chọn thông minh để góp phần bảo vệ hành tinh xanh.",
    content: "Mỗi sản phẩm tại GreenLife đều trải qua quá trình đánh giá vòng đời nghiêm ngặt LCA (Life Cycle Assessment) từ nguồn nguyên liệu nhập, quy trình nung đất sét bản địa không hóa chất, cho tới túi đóng gói tự hủy sinh học làm từ tinh bột mì nương. Eco-Score phản ánh từ thang số 1-100 độ thân thiện môi trường của sản phẩm đó. Bằng cách ưu tiên sử dụng các sản phẩm có chỉ số thân thiện trên 90, mỗi gia đình Việt Nam trung bình có thể cắt giảm tới 450kg lượng phát thải CO2 mỗi năm, tương đương với sự đóng góp bền bỉ của một cây cổ thụ 20 tuổi ngoài tự nhiên.",
    author: "TS. Phạm Hải Yến (Director of Ecology)",
    date: "2026-05-10",
    readTime: "8 phút đọc",
    category: "eco-living",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80"
  },
  {
    id: "blog-3",
    title: "Cách chẩn đoán và xử lý thối nhũn lá ở những dòng phong lan, sen đá quý hiếm",
    summary: "Bệnh thối nhũn do vi khuẩn Erwinia carotovora gây hoang mang cho mọi tín đồ yêu cây. Tìm hiểu phác đồ điều trị sinh học thần tốc.",
    content: "Mùa ẩm ướt chuyển giao tại Việt Nam thường kéo theo sự bùng nổ của các ổ vi khuẩn cơ hội. Đối với dòng sen đá cẩm thạch quý hiếm hay phong lan đắt đỏ, chỉ một vệt nước đọng qua đêm ở nách lá cũng có thể biến thành vết hoại tử thối nhũn chỉ sau 12 giờ ngắn ngủi phá hủy hệ mô liên kết. Khi phát hiện vệt sũng nước chuyển màu thâm kim, việc đầu tiên cần làm là ngưng tưới hoàn toàn, cách ly nhiệt đối, dùng dao cạo gỗ đã sát trùng rạch tế bào hỏng, sau đó bôi cốt dầu sầu đông Neem ép lạnh kết hợp vôi nông nghiệp tôi siêu mịn lên rìa vết hoại tử.",
    author: "Nghệ nhân cây cảnh Trần Xuân Sơn",
    date: "2026-04-28",
    readTime: "5 phút đọc",
    category: "plant-care",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80"
  }
];

export const EXPERTS = [
  {
    id: "exp-1",
    name: "ThS. Nguyễn Thành Trung",
    role: "Chuyên gia Sinh học Thực vật",
    rating: 4.9,
    reviews: 142,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    experience: "12 năm công tác Trung tâm Nghiên cứu Giống cây Lâm nghiệp",
    price: 350000, // VND / hour consult
    topic: "Chẩn đoán sâu bệnh công nghệ cao & Lai tạo giống gen khỏe"
  },
  {
    id: "exp-2",
    name: "KTS. Lê Thị Mai Chi",
    role: "Nhà thiết kế Không gian Xanh cảnh quan",
    rating: 5.0,
    reviews: 98,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    experience: "Cố vấn kiến trúc cảnh quan bền vững cho các dự án Eco-Resort",
    price: 500000,
    topic: "Vườn bento đa năng trong căn hộ nhỏ & Decor phong thủy"
  },
  {
    id: "exp-3",
    name: "KS. Đào Hoàng Long",
    role: "Kỹ sư IoT & Canh tác Nông nghiệp Thông minh",
    rating: 4.8,
    reviews: 115,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    experience: "Tác giả bộ module chip thông minh kiểm soát dinh dưỡng đất nông trại",
    price: 400000,
    topic: "Giải pháp nhà kính tự động, tiết kiệm tuần hoàn nước hiện đại"
  }
];

export const INITIAL_ORDERS: StoreOrder[] = [
  {
    id: "GL-9524",
    customerName: "Lê Văn Tiến",
    date: "2026-05-22",
    total: 570000,
    status: "processing",
    itemsCount: 3
  },
  {
    id: "GL-9523",
    customerName: "Nguyễn Thị Kim Ngân",
    date: "2026-05-21",
    total: 120000,
    status: "shipped",
    itemsCount: 1
  },
  {
    id: "GL-9522",
    customerName: "Trần Minh Hoàng",
    date: "2026-05-19",
    total: 1050000,
    status: "pending",
    itemsCount: 4
  },
  {
    id: "GL-9521",
    customerName: "Phạm Thúy Hằng",
    date: "2026-05-18",
    total: 300000,
    status: "completed" as any, // mapping to shipped/completed
    itemsCount: 2
  }
];

export const MOCK_DIAGNOSIS_PRESETS = [
  {
    id: "preset-1",
    name: "Cà chua bị mốc sương (Phytophthora infestans)",
    plantType: "Cây cà chua hữu cơ ban công",
    description: "Lá xuất hiện vết đốm sũng nước, chuyển màu nâu sẫm, viền vàng nhạt. Đục trái và hỏng cấu trúc.",
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "preset-2",
    name: "Sen đá úng nước (Thối nhũn gốc do rễ thừa ẩm)",
    plantType: "Sen đá thạch ngọc quý",
    description: "Lá tầng dưới mọng trong suốt, sờ mủn nước, nát nhão đầu nhánh, rụng liên hoàn khi chạm.",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "preset-3",
    name: "Bọ trĩ mặt dưới lá và héo ngọn hoa hồng",
    plantType: "Hồng leo cổ Hải Phòng",
    description: "Mặt lá mất diệp lục, lốm đốm bạc màu xám, búp hoa quăn queo, rìa cánh hoa thâm đen.",
    imageUrl: "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=500&auto=format&fit=crop&q=80"
  }
];

export const MOCK_USERS: User[] = [
  {
    id: "user-1",
    name: "Nguyễn Hoàng Long",
    email: "vip.customer@greenlife.vn",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    role: "customer",
    carbonCredits: 4250,
    co2SavedKg: 342.5,
    registeredDate: "2025-01-10",
    savedProductIds: ["prod-1", "prod-3"]
  },
  {
    id: "user-2",
    name: "Lê Minh Dương",
    email: "nursery.partner@greenlife.vn",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    role: "store",
    carbonCredits: 12800,
    co2SavedKg: 705.0,
    registeredDate: "2024-06-15",
    savedProductIds: ["prod-2", "prod-5"]
  },
  {
    id: "user-3",
    name: "TS. Nguyễn Thành Trung",
    email: "ecology.root@greenlife.vn",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    role: "admin",
    carbonCredits: 99999,
    co2SavedKg: 1490.0,
    registeredDate: "2023-10-01",
    savedProductIds: []
  }
];

export const MOCK_STORES: EcoStore[] = [
  {
    id: "store-1",
    name: "Nhà Vườn Thảo Mộc Đô Thị GreenLife Hòa Lạc",
    ownerName: "Lê Minh Dương",
    ownerEmail: "nursery.partner@greenlife.vn",
    rating: 4.9,
    avatar: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=150&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80",
    address: "Khu Công Nghệ Cao Hòa Lạc, Thạch Thất, Hà Nội, Việt Nam",
    workingHours: "07:30 - 18:00 (Hằng ngày)",
    carbonOffsetKg: 705,
    productsCount: 15,
    verified: true,
    city: "Hà Nội",
    district: "Thạch Thất",
    latitude: 21.0135,
    longitude: 105.5245,
    serviceArea: "Thạch Thất, Cầu Giấy, Hoàn Kiếm"
  },
  {
    id: "store-2",
    name: "Nông Trại Sen Đá & Đất Sét Nung Lâm Đồng",
    ownerName: "Trần Xuân Sơn",
    ownerEmail: "dalat.succulent@greenlife.vn",
    rating: 4.8,
    avatar: "https://images.unsplash.com/photo-1520301255226-85d1e83877b6?w=150&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
    address: "Xã Lát, Lạc Dương, Lâm Đồng, Việt Nam",
    workingHours: "08:00 - 17:30 (Thứ 2 - Thứ 7)",
    carbonOffsetKg: 1250,
    productsCount: 32,
    verified: true,
    city: "Lâm Đồng",
    district: "Lạc Dương",
    latitude: 12.0234,
    longitude: 108.4321,
    serviceArea: "Đà Lạt, Lạc Dương"
  },
  {
    id: "store-3",
    name: "Nhà Vườn Thảo Mộc Đô Thị GreenLife Đà Nẵng",
    ownerName: "Nguyễn Văn Hùng",
    ownerEmail: "danang.herb@greenlife.vn",
    rating: 4.9,
    avatar: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=150&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80",
    address: "250 Điện Biên Phủ, Thanh Khê, Đà Nẵng, Việt Nam",
    workingHours: "07:30 - 18:00 (Hằng ngày)",
    carbonOffsetKg: 420,
    productsCount: 22,
    verified: true,
    city: "Đà Nẵng",
    district: "Thanh Khê",
    latitude: 16.0645,
    longitude: 108.2045,
    serviceArea: "Thanh Khê, Hải Châu, Cẩm Lệ"
  },
  {
    id: "store-4",
    name: "Cửa Hàng Cây Cảnh & Decor Bản Địa Sơn Trà",
    ownerName: "Phạm Thúy Hằng",
    ownerEmail: "sontra.plant@greenlife.vn",
    rating: 4.7,
    avatar: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=150&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
    address: "45 Lê Tấn Trung, Sơn Trà, Đà Nẵng, Việt Nam",
    workingHours: "08:00 - 18:30 (Thứ 2 - Chủ Nhật)",
    carbonOffsetKg: 310,
    productsCount: 18,
    verified: true,
    city: "Đà Nẵng",
    district: "Sơn Trà",
    latitude: 16.0984,
    longitude: 108.2432,
    serviceArea: "Sơn Trà, Ngũ Hành Sơn, Hải Châu"
  },
  {
    id: "store-5",
    name: "Hợp Tác Xã Ươm Mầm Sinh Học Hòa Vang",
    ownerName: "Lê Văn Tiến",
    ownerEmail: "hoavang.nursery@greenlife.vn",
    rating: 4.8,
    avatar: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=150&auto=format&fit=crop&q=80",
    bannerImage: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&auto=format&fit=crop&q=80",
    address: "Quốc lộ 14B, Hòa Vang, Đà Nẵng, Việt Nam",
    workingHours: "07:00 - 17:00 (Hằng ngày)",
    carbonOffsetKg: 580,
    productsCount: 14,
    verified: true,
    city: "Đà Nẵng",
    district: "Hòa Vang",
    latitude: 16.0021,
    longitude: 108.1567,
    serviceArea: "Hòa Vang, Liên Chiểu, Cẩm Lệ"
  }
];

export const MOCK_PLANTS: Plant[] = [
  {
    id: "plant-1",
    commonName: "Sen Đá Đô La Cẩm Thạch",
    botanicalName: "Portulacaria afra 'Variegata'",
    wateringInstructions: "Chỉ tưới khi bầu đất khô hoàn toàn, trung bình 7-10 ngày một lần. Tránh đọng nước nách lá gây úng mốc.",
    sunlightRequirement: "Cần nhiều nắng gián tiếp, tối thiểu 4-6 giờ quang năng một ngày để giữ vân lá đột biến sắc nét.",
    difficulty: "dễ",
    bestSeason: "Quanh năm",
    description: "Thân cây mọng nước hóa gỗ nhỏ, lá cẩm thạch xinh xắn biểu trưng cho dòng tiền đô la, phát lộc dồi dào.",
    purifyingProperties: ["Cân bằng bức xạ wifi", "Lọc CO2 ngược vào ban đêm"]
  },
  {
    id: "plant-2",
    commonName: "Trầu Bà Đế Vương Xanh",
    botanicalName: "Philodendron Erubescens 'Imperial Green'",
    wateringInstructions: "Giữ độ ẩm đất vừa phải, tưới 2-3 lần/tuần. Có thể phun sương lên mặt lá vào ngày hanh khô.",
    sunlightRequirement: "Ưa bóng râm bán phần hoặc ánh sáng đèn huỳnh quang văn phòng, tránh ánh nắng gắt trực xạ thiêu cháy lá.",
    difficulty: "dễ",
    bestSeason: "Xuân - Thu",
    description: "Cây nội thất quý phái thanh cao, lá to dày, tràn trề nhựa sống, tượng trưng cho quyền lực tối thượng và tài vận thịnh vượng.",
    purifyingProperties: ["Lọc chất độc Benzen & Formaldehyde", "Khử từ trường sóng cực ngắn thiết bị văn phòng"]
  },
  {
    id: "plant-3",
    commonName: "Lan Hồ Điệp Phú Quý",
    botanicalName: "Phalaenopsis Sogo Yukidian",
    wateringInstructions: "Chỉ tưới dốc gốc qua giá thể vỏ thông ẩm một lần mỗi tuần, không làm ướt gốc rễ trực tiếp bằng vòi áp suất cao.",
    sunlightRequirement: "Tán xạ râm tốt dưới rèm cửa sổ, nhiệt độ ổn định mát mẻ 18-28 độ C.",
    difficulty: "khó",
    bestSeason: "Mùa Đông - Xuân hằng năm",
    description: "Nữ hoàng phong lan đài các, hoa nở bền lâu tới 3 tháng, yêu cầu chăm sóc tỉ mỉ dưỡng ẩm cao.",
    purifyingProperties: ["Hấp thụ độc tố trong không khí kín", "Tăng nồng độ an tĩnh tinh thần"]
  }
];

export const MOCK_BOOKINGS: Appointment[] = [
  {
    id: "booking-1",
    expertName: "ThS. Nguyễn Thành Trung",
    title: "Tư vấn cải tạo đất nặn hữu cơ vườn ban công phủ sương",
    date: "2026-05-28",
    time: "09:00",
    type: "online",
    price: 350000,
    status: "confirmed",
    durationMinutes: 60,
    expertAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    userNotes: "Muốn trồng thêm cải kale và cà chua bi hữu cơ nương râm lầu cao."
  },
  {
    id: "booking-2",
    expertName: "KTS. Lê Thị Mai Chi",
    title: "Thiết kế hệ giàn bento tuần hoàn nước tưới nhỏ giọt ban công lửng",
    date: "2026-06-02",
    time: "14:35",
    type: "offline",
    price: 500000,
    status: "pending",
    durationMinutes: 90,
    expertAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    userNotes: "Diện tích ban công chung cư thô 2.4m2 cần tối ưu bệ nằm."
  }
];

export const MOCK_AI_DIAGNOSES: DiagnosisLog[] = [
  {
    id: "log-1",
    date: "2026-05-23",
    plantName: "Cây cà chua hữu cơ ban công lướt",
    diseaseName: "Mốc sương cà chua (Phytophthora infestans)",
    severity: "trung bình",
    symptoms: "Lá lốm đốm thâm nâu như sũng nước, xuất hiện bụi nấm phấn trắng mảnh ở viền lá dưới tầng thấp.",
    treatment: [
      "Ngưng tưới phun dạng sương mưa ngay.",
      "Cắt bỏ gọn ghẽ các lá nhiễm nấm đem tiêu hủy bằng cách vùi rác hoại.",
      "Phun dung dịch đồng sunfat loãng hoặc dấm tỏi thảo mộc 3 ngày/lần."
    ],
    recommendedProductIds: ["prod-5"],
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=500&auto=format&fit=crop&q=80",
    accuracy: 94,
    notes: "Tỷ lệ hồi phục dự kiến 85% nếu áp dụng phác đồ khô ráo trong vòng 48 giờ."
  }
];

