import { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, Leaf } from 'lucide-react';
import { plants } from '../data';
import PlantCard from '../components/PlantCard';
import { motion } from 'motion/react';

export default function Shop() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'indoor', name: 'Cây trong nhà' },
    { id: 'outdoor', name: 'Cây ngoài trời' },
    { id: 'succulent', name: 'Sen đá & Xương rồng' },
    { id: 'office', name: 'Cây văn phòng' },
  ];

  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || plant.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="pt-32 pb-24 px-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Cửa Hàng Cây Xanh</h1>
            <p className="text-slate-500">Khám phá hàng trăm loại cây độc đáo cho không gian của bạn.</p>
          </div>

          <div className="w-full md:w-auto flex items-center gap-4">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm cây của bạn..."
                className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="p-3 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 transition-all">
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex overflow-x-auto gap-4 mb-12 pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center mb-8">
          <p className="text-slate-500 font-medium">Tìm thấy {filteredPlants.length} kết quả</p>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 cursor-pointer">
            Sắp xếp theo <ChevronDown size={16} />
          </div>
        </div>

        {/* Grid */}
        {filteredPlants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredPlants.map((plant, index) => (
              <motion.div
                key={plant.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PlantCard plant={plant} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Leaf size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy cây bạn cần</h3>
            <p className="text-slate-500">Hãy thử từ khóa khác hoặc xóa bộ lọc.</p>
            <button 
              onClick={() => {setSearchQuery(''); setSelectedCategory('all');}}
              className="mt-6 text-primary font-bold hover:underline"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
