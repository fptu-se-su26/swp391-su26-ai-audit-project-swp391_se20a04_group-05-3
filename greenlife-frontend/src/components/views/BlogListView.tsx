import React, { useState, useEffect } from "react";
import { Search, Clock, Eye, Heart, BookOpen, Newspaper } from "lucide-react";
import { BlogPost } from "../../types";
import { ArticleService } from "../../services/articleService";
import { EmptyState } from "../common/EmptyState";

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

  // Local state for debouncing and fetching
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with prop if it changes externally
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce search query updates by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
        setCurrentPage(0);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Fetch articles on search query, category, or page index change
  useEffect(() => {
    let active = true;
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ArticleService.getArticles(searchQuery, selectedCategory, currentPage, 6);
        if (active) {
          setArticles(res.content);
          setTotalPages(res.totalPages);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Không thể tải danh sách cẩm nang xanh.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchArticles();
    return () => {
      active = false;
    };
  }, [searchQuery, selectedCategory, currentPage]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(0);
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
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-stone-50 text-stone-800 border border-stone-200 focus:border-emerald-500/80 focus:bg-white rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition-all placeholder-stone-400 font-medium"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 items-center">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCategoryChange(c.id)}
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

      {/* Grid List or loading/error */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white border border-stone-200 rounded-2xl h-[430px] flex flex-col justify-between p-6">
              <div className="h-48 bg-stone-100 rounded-xl mb-4"></div>
              <div className="h-4 bg-stone-200 rounded w-1/3 mb-2"></div>
              <div className="h-6 bg-stone-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-stone-200 rounded w-full mb-4"></div>
              <div className="h-10 bg-stone-150 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-rose-50 border border-rose-200 rounded-3xl font-medium text-rose-600">
          {error}
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Không tìm thấy bài viết"
          description="Không tìm thấy bài viết nào khớp với nội dung tìm kiếm của bạn."
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((post) => {
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
                      loading="lazy"
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
                      <p className="text-stone-550 text-xs line-clamp-2 leading-relaxed font-medium">
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0 || loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-600 hover:text-stone-850 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Trang trước
              </button>
              
              <span className="text-xs font-mono font-bold text-stone-500">
                Trang {currentPage + 1} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1 || loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-600 hover:text-stone-850 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
