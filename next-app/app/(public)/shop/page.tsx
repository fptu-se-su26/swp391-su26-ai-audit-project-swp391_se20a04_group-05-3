'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, Leaf } from 'lucide-react';
import { plants } from '@/lib/mockData';
import PlantCard from '@/components/shop/PlantCard';
import { motion, AnimatePresence } from 'motion/react';

export default function Shop() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  
  // Advanced filters state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [lightFilter, setLightFilter] = useState('all');
  const [waterFilter, setWaterFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');

  // Check client-side viewport size
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsFilterOpen(true);
    }
  }, []);

  const categories = [
    { id: 'all', name: 'Tất cả' },
    { id: 'indoor', name: 'Cây trong nhà' },
    { id: 'outdoor', name: 'Cây ngoài trời' },
    { id: 'succulent', name: 'Sen đá & Xương rồng' },
    { id: 'office', name: 'Cây văn phòng' },
  ];

  const lightOptions = [
    { id: 'all', name: 'Tất cả' },
    { id: 'Thấp', name: 'Ánh sáng thấp' },
    { id: 'Trung bình', name: 'Ánh sáng trung bình' },
    { id: 'Cao', name: 'Ánh sáng mạnh' },
  ];

  const waterOptions = [
    { id: 'all', name: 'Tất cả' },
    { id: 'Thấp', name: 'Ít nước' },
    { id: 'Trung bình', name: 'Nước trung bình' },
    { id: 'Cao', name: 'Nhiều nước' },
  ];

  const priceOptions = [
    { id: 'all', name: 'Tất cả mức giá' },
    { id: 'under100', name: 'Dưới 100.000đ' },
    { id: '100to300', name: '100.000đ - 300.000đ' },
    { id: 'above300', name: 'Trên 300.000đ' },
  ];

  const filteredAndSortedPlants = useMemo(() => {
    let result = plants.filter(plant => {
      const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || plant.category === selectedCategory;
      const matchesLight = lightFilter === 'all' || plant.lightLevel === lightFilter;
      const matchesWater = waterFilter === 'all' || plant.waterLevel === waterFilter;
      
      let matchesPrice = true;
      if (priceRange === 'under100') matchesPrice = plant.price < 100000;
      else if (priceRange === '100to300') matchesPrice = plant.price >= 100000 && plant.price <= 300000;
      else if (priceRange === 'above300') matchesPrice = plant.price > 300000;

      return matchesSearch && matchesCategory && matchesLight && matchesWater && matchesPrice;
    });

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [searchQuery, selectedCategory, lightFilter, waterFilter, priceRange, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setLightFilter('all');
    setWaterFilter('all');
    setPriceRange('all');
    setSortBy('default');
  };

  const activeFiltersCount = (lightFilter !== 'all' ? 1 : 0) + (waterFilter !== 'all' ? 1 : 0) + (priceRange !== 'all' ? 1 : 0);

  return (
    <main className="pt-32 pb-24 px-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Cửa Hàng</h1>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="p-3 bg-white border border-slate-200 rounded-full text-slate-600 flex items-center gap-2 relative"
          >
            <SlidersHorizontal size={20} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-primary text-xs font-bold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Sidebar Filters */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.aside
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: -20, height: 0 }}
              className="lg:w-1/4 shrink-0 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:h-fit lg:sticky lg:top-24 z-10 w-full"
            >
              <div className="flex justify-between items-center mb-6 lg:mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-primary" /> Bộ lọc
                </h2>
                <button onClick={clearFilters} className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">
                  Xóa tất cả
                </button>
              </div>

              <div className="space-y-8">
                {/* Search */}
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Tìm tên cây..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Mức giá</h3>
                  <div className="space-y-2">
                    {priceOptions.map(option => (
                      <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" 
                          name="price"
                          value={option.id}
                          checked={priceRange === option.id}
                          onChange={() => setPriceRange(option.id)}
                          className="w-4 h-4 text-primary bg-slate-100 border-slate-300 focus:ring-primary" 
                        />
                        <span className={`text-sm group-hover:text-primary transition-colors ${priceRange === option.id ? 'text-primary font-medium' : 'text-slate-600'}`}>
                          {option.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Light */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Ánh sáng</h3>
                  <div className="flex flex-wrap gap-2">
                    {lightOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => setLightFilter(option.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                          lightFilter === option.id 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Water */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Nhu cầu nước</h3>
                  <div className="flex flex-wrap gap-2">
                    {waterOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => setWaterFilter(option.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                          waterFilter === option.id 
                            ? 'bg-blue-500 text-white border-blue-500' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header (Desktop) */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-4xl font-bold mb-2">Cửa Hàng Cây Xanh</h1>
            <p className="text-slate-500">Khám phá hàng trăm loại cây độc đáo cho không gian của bạn.</p>
          </div>

          {/* Top Categories */}
          <div className="flex overflow-x-auto gap-3 mb-8 pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-5 py-2 rounded-full font-medium transition-all text-sm ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort & Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 font-medium text-sm">Hiển thị <span className="font-bold text-slate-900">{filteredAndSortedPlants.length}</span> sản phẩm</p>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              Sắp xếp: 
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="name-asc">Tên: A-Z</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {filteredAndSortedPlants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedPlants.map((plant, index) => (
                <motion.div
                  key={plant.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <PlantCard plant={plant} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Leaf size={40} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy cây bạn cần</h3>
              <p className="text-slate-500">Hãy thử điều chỉnh lại bộ lọc để xem nhiều kết quả hơn.</p>
              <button 
                onClick={clearFilters}
                className="mt-6 px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
              >
                Xóa tất cả bộ lọc
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
