'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Heart, Eye, Check } from 'lucide-react';
import { Plant } from '@/lib/types';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';

interface PlantCardProps {
  plant: Plant;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useStore();
  const isWishlisted = isInWishlist(plant.id);
  const [added, setAdded] = React.useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(plant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(plant);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        <img
          src={plant.image}
          alt={plant.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-primary uppercase tracking-wider shadow-sm">
            {plant.careLevel}
          </span>
        </div>
        <button 
          onClick={handleWishlist}
          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-full transition-colors shadow-sm z-10"
        >
          <Heart size={18} className={isWishlisted ? "fill-red-500 text-red-500" : "text-slate-400 hover:text-red-500"} />
        </button>

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button 
            onClick={handleAddToCart}
            className={`p-3 rounded-full transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 delay-[0ms] ${added ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-primary hover:text-white'}`}
          >
            {added ? <Check size={20} /> : <ShoppingCart size={20} />}
          </button>
          <Link href={`/product/${plant.id}`} className="p-3 bg-white text-primary rounded-full hover:bg-primary hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 delay-[50ms]">
            <Eye size={20} />
          </Link>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-4">
          <div>
            <Link href={`/product/${plant.id}`}>
              <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{plant.name}</h3>
            </Link>
            <p className="text-xs text-slate-400 italic line-clamp-1">{plant.scientificName}</p>
          </div>
          <span className="font-bold text-primary shrink-0">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plant.price)}
          </span>
        </div>
        
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1">
          {plant.description}
        </p>

        <div className="flex flex-wrap gap-2">
          {plant.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-nature-50 text-emerald-700 text-[10px] font-medium rounded-md">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PlantCard;
