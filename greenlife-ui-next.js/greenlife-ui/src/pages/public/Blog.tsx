import { motion } from 'motion/react';
import { blogPosts } from '@/src/services/mockData';
import { ArrowRight, Calendar, User, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Blog() {
  return (
    <main className="pt-32 pb-24 px-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">Blog Cây Xanh</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Khám phá những kiến thức bổ ích, mẹo chăm sóc cây và xu hướng xanh mới nhất từ các chuyên gia của GreenLife.
          </p>
        </div>

        {/* Featured Post (First post) */}
        {blogPosts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-100 flex flex-col lg:flex-row group cursor-pointer"
          >
            <div className="lg:w-1/2 relative overflow-hidden">
              <img 
                src={blogPosts[0].image} 
                alt={blogPosts[0].title} 
                className="w-full h-full min-h-[300px] object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute top-6 left-6">
                <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-primary uppercase tracking-wider shadow-sm">
                  {blogPosts[0].category}
                </span>
              </div>
            </div>
            <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
              <div className="flex gap-4 text-sm text-slate-400 mb-4">
                <span className="flex items-center gap-1.5"><Calendar size={16} /> {blogPosts[0].date}</span>
                <span className="flex items-center gap-1.5"><User size={16} /> {blogPosts[0].author}</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4 group-hover:text-primary transition-colors line-clamp-2">
                {blogPosts[0].title}
              </h2>
              <p className="text-slate-600 leading-relaxed mb-8 line-clamp-3">
                {blogPosts[0].content || blogPosts[0].excerpt}
              </p>
              <Link to={`/blog/${blogPosts[0].id}`} className="mt-auto inline-flex items-center gap-2 font-bold text-primary group-hover:gap-3 transition-all">
                Đọc tiếp <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Other Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.slice(1).map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 group cursor-pointer flex flex-col"
            >
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-primary uppercase tracking-wider shadow-sm">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <User size={14} />
                    <span>{post.author}</span>
                  </div>
                  <Link to={`/blog/${post.id}`} className="text-primary hover:text-emerald-700 transition-colors">
                    <BookOpen size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Pagination placeholder */}
        <div className="mt-16 flex justify-center gap-2">
          <button className="w-10 h-10 rounded-xl bg-primary text-white font-bold flex items-center justify-center">1</button>
          <button className="w-10 h-10 rounded-xl bg-white text-slate-600 font-bold border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors">2</button>
          <button className="w-10 h-10 rounded-xl bg-white text-slate-600 font-bold border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors">...</button>
        </div>
      </div>
    </main>
  );
}
