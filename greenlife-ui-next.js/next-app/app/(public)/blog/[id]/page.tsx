'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, User, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { blogPosts } from '@/lib/mockData';

export default function BlogPostDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const post = blogPosts.find(p => p.id === id);

  if (!post) {
    return (
      <main className="pt-32 pb-24 px-6 min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Không tìm thấy bài viết</h1>
          <p className="text-slate-500 mb-8">Bài viết này không tồn tại hoặc đã bị gỡ bỏ.</p>
          <Link href="/blog" className="btn-primary">Quay lại danh sách blog</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-24 min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100 py-4 px-6 mb-8">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => router.back()} className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
            <ArrowLeft size={16} /> Quay lại
          </button>
          <span>/</span>
          <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium line-clamp-1">{post.title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <article className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden p-6 sm:p-10 lg:p-12 animate-fade-in">
          {/* Category Tag */}
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-emerald-100">
            {post.category}
          </span>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
            {post.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-slate-400 pb-8 border-b border-slate-100 mb-8">
            <span className="flex items-center gap-1.5"><Calendar size={16} /> {post.date}</span>
            <span className="flex items-center gap-1.5"><User size={16} /> {post.author}</span>
            <span className="flex items-center gap-1.5"><Clock size={16} /> 5 phút đọc</span>
          </div>

          {/* Banner Image */}
          <div className="aspect-[21/9] rounded-3xl overflow-hidden mb-10 bg-slate-100 shadow-inner">
            <img 
              src={post.image} 
              alt={post.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Content */}
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-lg space-y-6">
            <p className="font-semibold text-slate-800 text-xl leading-relaxed">
              {post.excerpt}
            </p>
            <p>
              {post.content || "Cây xanh không chỉ đóng vai trò lọc không khí mà còn giúp cải thiện đáng kể tâm trạng, giảm bớt căng thẳng và làm mát nhiệt độ trong phòng. Nghiên cứu thực vật cho thấy việc ngắm nhìn và chăm sóc cây xanh giúp sản sinh ra hormone dễ chịu, hỗ trợ sự tập trung và gia tăng hiệu suất làm việc lên đến 15%."}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-8 pt-4">Lợi ích thực tế từ việc trang trí cây xanh</h3>
            <p>
              Đối với các loại cây như Lưỡi Hổ hay Monstera, cơ chế trao đổi khí CAM đặc thù hoặc kích thước lá rộng cho phép chúng giải phóng lượng lớn oxy sạch, đồng thời trung hòa các hợp chất hữu cơ dễ bay hơi (VOCs) từ sơn tường, thiết bị điện tử hay chất tẩy rửa gia dụng.
            </p>
            <blockquote className="border-l-4 border-primary pl-6 py-2 my-8 italic text-slate-700 bg-slate-50 rounded-r-2xl">
              "Hãy đưa một chút thiên nhiên vào góc phòng của bạn ngay hôm nay. Chỉ cần một chậu cây để bàn nhỏ cũng có thể khởi đầu cho một phong cách sống xanh đầy tích cực."
            </blockquote>
            <p>
              Để chăm sóc cây đạt hiệu quả cao, bạn chỉ cần ghi nhớ nguyên tắc vàng: quan sát độ ẩm của đất trước khi tưới, bố trí ánh sáng phù hợp theo tập tính sinh học của từng giống cây, và giữ lá luôn sạch bụi để cây quang hợp tối đa.
            </p>
          </div>
        </article>

        {/* Back Link bottom */}
        <div className="text-center mt-12">
          <Link href="/blog" className="inline-flex items-center gap-2 font-bold text-primary hover:text-emerald-700 transition-colors">
            <BookOpen size={20} /> Quay lại danh sách bài viết blog
          </Link>
        </div>
      </div>
    </main>
  );
}
