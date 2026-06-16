import React from "react";
import { Search, Clock, Eye, Heart, BookOpen, Newspaper } from "lucide-react";
import { BlogPost } from "../../types";

interface BlogListViewProps {
  filteredBlogPosts: BlogPost[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  likedArticles: string[];
  toggleLike: (id: string, e: React.MouseEvent) => void;
  onSelectArticle: (post: BlogPost) => void;
}

export const BlogListView: React.FC<BlogListViewProps> = ({
  filteredBlogPosts,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  likedArticles,
  toggleLike,
  onSelectArticle,
}) => {
  const categories = [
    { id: "all", label: "Tất cả bài viết" },
    { id: "urban-farming", label: "Nông Nghiệp Đô Thị" },
    { id: "eco-living", label: "Sống Xanh Thượng Lưu" },
    { id: "plant-care", label: "Y Học Bệnh Cây" }
  ];

  const categoryNames: Record<string, string> = {
    "plant-care": "Y Học Bệnh Cây",
    "urban-farming": "Nông Nghiệp Đô Thị",
    "eco-living": "Sống Xanh Thượng Lưu"
  };

  return (
    <div className="bg-stone-50/60 p-6 sm:p-10 rounded-[32px] border border-stone-200/60 shadow-xs space-y-10">
      {/* Page Header */}
      <div className="space-y-3 max-w-3xl">
        <span className="text-[11px] text-emerald-600 font-mono tracking-widest uppercase font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50 inline-block">
          TRUYỀN THÔNG & CẨM NANG HƯỚNG DẪN
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold text-stone-900 tracking-tight flex items-center gap-2">
          <Newspaper className="h-8 w-8 text-emerald-600 animate-pulse" />
          Cẩm Nang Xanh & Y Học Bản Địa
        </h1>
        <p className="text-stone-550 text-sm leading-relaxed">
          Nơi quy tụ các phác đồ y học thực vật từ chuyên gia nông sinh học, bí quyết canh tác vườn rau sạch căn hộ chung cư và những bài viết truyền cảm hứng cho phong cách sống bền vững.
        </p>
      </div>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4.5 rounded-2xl border border-stone-200 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm kiến thức cẩm nang, tự làm dầu lốt nhện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 text-stone-800 border border-stone-200 focus:border-emerald-500/80 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition-all placeholder-stone-400 font-medium"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 items-center">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                selectedCategory === c.id
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10"
                  : "bg-white text-stone-500 border-stone-200 hover:text-stone-850 hover:bg-stone-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {filteredBlogPosts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-stone-300 rounded-3xl font-medium text-stone-450">
          Không tìm thấy bài viết nào khớp với nội dung tìm kiếm của bạn.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBlogPosts.map((post) => {
            const isLiked = likedArticles.includes(post.id);
            return (
              <div
                key={post.id}
                onClick={() => onSelectArticle(post)}
                className="group bg-white border border-stone-200/85 hover:border-emerald-500/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between cursor-pointer transition-all duration-300 h-[430px]"
              >
                {/* Image Area */}
                <div className="relative h-48 bg-stone-100 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-xs border border-emerald-100/60 px-3 py-1 rounded-full text-[9px] font-mono font-bold text-emerald-700 shadow-sm uppercase tracking-wide">
                    {categoryNames[post.category] || post.category}
                  </div>
                </div>

                {/* Content text */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    <span className="text-[10px] text-stone-400 font-mono block font-medium">{post.date}</span>
                    <h3 className="text-sm font-bold text-stone-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-stone-500 text-xs line-clamp-2 leading-relaxed font-medium">
                      {post.summary}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex justify-between items-center pt-4 border-t border-stone-100 text-xs">
                    <span className="text-stone-400 flex items-center gap-3 font-mono font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-stone-400" />
                        {post.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-stone-400" />
                        {post.views || 0}
                      </span>
                    </span>
                    
                    <button
                      onClick={(e) => toggleLike(post.id, e)}
                      className={`text-xs flex items-center gap-1.5 cursor-pointer font-bold transition-colors ${
                        isLiked ? "text-rose-600" : "text-stone-400 hover:text-stone-600"
                      }`}
                    >
                      <Heart className={`h-4.5 w-4.5 ${isLiked ? "fill-current" : ""}`} />
                      <span>{isLiked ? "Đã lưu" : "Lưu tin"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
