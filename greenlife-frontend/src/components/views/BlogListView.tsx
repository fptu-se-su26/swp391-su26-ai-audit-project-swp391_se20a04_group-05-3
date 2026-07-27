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
    <div className="bg-[var(--gl-bg-surface)] p-6 sm:p-10 rounded-[32px] border border-[var(--gl-border)] shadow-xs space-y-10 text-[var(--gl-text-primary)]">
      {/* Page Header */}
      <div className="space-y-3 max-w-3xl">
        <span className="text-[11px] text-[var(--gl-accent)] font-mono tracking-widest uppercase font-bold bg-[var(--gl-accent-soft)] px-3 py-1 rounded-full border border-[var(--gl-accent)]/20 inline-block">
          TRUYỀN THÔNG & CẨM NANG HƯỚNG DẪN
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold text-[var(--gl-text-primary)] tracking-tight flex items-center gap-2">
          <Newspaper className="h-8 w-8 text-[var(--gl-accent)] animate-pulse" />
          Cẩm Nang Xanh & Y Học Bản Địa
        </h1>
        <p className="text-[var(--gl-text-secondary)] text-sm leading-relaxed">
          Nơi quy tụ các phác đồ y học thực vật từ chuyên gia nông sinh học, bí quyết canh tác vườn rau sạch căn hộ chung cư và những bài viết truyền cảm hứng cho phong cách sống bền vững.
        </p>
      </div>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-[var(--gl-bg-muted)] p-4.5 rounded-2xl border border-[var(--gl-border)] shadow-sm">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gl-text-muted)]" />
          <input
            type="text"
            placeholder="Tìm kiến thức cẩm nang, tự làm dầu lốt nhện..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full min-h-[40px] bg-[var(--gl-bg-surface)] text-[var(--gl-text-primary)] border border-[var(--gl-border)] focus:border-[var(--gl-accent)] focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition-all placeholder:text-[var(--gl-text-muted)] font-medium"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 items-center">
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => handleCategoryChange(c.id)}
              className={`px-4 py-2 min-h-[40px] rounded-xl text-xs font-semibold cursor-pointer transition-all border focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
                selectedCategory === c.id
                  ? "bg-[var(--gl-accent)] border-[var(--gl-accent)] text-white dark:text-emerald-950 font-bold shadow-xs"
                  : "bg-[var(--gl-bg-surface)] text-[var(--gl-text-secondary)] border-[var(--gl-border)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)]"
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
            <div key={i} className="animate-pulse bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-2xl h-[430px] flex flex-col justify-between p-6">
              <div className="h-48 bg-[var(--gl-bg-muted)] rounded-xl mb-4"></div>
              <div className="h-4 bg-[var(--gl-bg-muted)] rounded w-1/3 mb-2"></div>
              <div className="h-6 bg-[var(--gl-bg-muted)] rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-[var(--gl-bg-muted)] rounded w-full mb-4"></div>
              <div className="h-10 bg-[var(--gl-bg-muted)] rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl font-medium text-xs text-rose-600 dark:text-rose-400 text-center">
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
                  className="group bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] hover:border-[var(--gl-accent)]/50 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between cursor-pointer transition-all duration-300 h-[430px]"
                >
                  {/* Image Area */}
                  <div className="relative h-48 bg-[var(--gl-bg-muted)] overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute top-3.5 left-3.5 bg-[var(--gl-bg-surface)]/95 backdrop-blur-xs border border-[var(--gl-accent)]/20 px-3 py-1 rounded-full text-[9px] font-mono font-bold text-[var(--gl-accent)] shadow-sm uppercase tracking-wide">
                      {categoryNames[post.category] || post.category}
                    </div>
                  </div>

                  {/* Content text */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5">
                      <span className="text-[10px] text-[var(--gl-text-muted)] font-mono block font-medium">{post.date}</span>
                      <h3 className="text-sm font-bold text-[var(--gl-text-primary)] group-hover:text-[var(--gl-accent)] transition-colors line-clamp-2 leading-snug break-words">
                        {post.title}
                      </h3>
                      <p className="text-[var(--gl-text-secondary)] text-xs line-clamp-2 leading-relaxed font-medium break-words">
                        {post.summary}
                      </p>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex justify-between items-center pt-4 border-t border-[var(--gl-border)] text-xs">
                      <span className="text-[var(--gl-text-muted)] flex items-center gap-3 font-mono font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                          {post.readTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5 text-[var(--gl-text-muted)]" />
                          {post.views || 0}
                        </span>
                      </span>
                      
                      <button
                        type="button"
                        aria-label="Lưu bài viết"
                        onClick={(e) => toggleLike(post.id, e)}
                        className={`text-xs flex items-center gap-1.5 min-w-[40px] min-h-[40px] px-2 rounded-lg cursor-pointer font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)] ${
                          isLiked ? "text-rose-500" : "text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)]"
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
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0 || loading}
                className="px-4 py-2 min-h-[40px] rounded-xl text-xs font-semibold bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
              >
                Trang trước
              </button>
              
              <span className="text-xs font-mono font-bold text-[var(--gl-text-muted)]">
                Trang {currentPage + 1} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1 || loading}
                className="px-4 py-2 min-h-[40px] rounded-xl text-xs font-semibold bg-[var(--gl-bg-muted)] border border-[var(--gl-border)] text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] hover:bg-[var(--gl-bg-elevated)] disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
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
