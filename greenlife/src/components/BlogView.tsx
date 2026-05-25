import React, { useState, useMemo } from "react";
import { Newspaper, Search, Leaf, Clock, ArrowRight, X, Heart, Sparkles, BookOpen } from "lucide-react";
import { BlogPost } from "../types";
import { BLOG_POSTS } from "../data";

export const BlogView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);
  const [likedArticles, setLikedArticles] = useState<string[]>([]);

  const filteredBlogPosts = useMemo(() => {
    let result = [...BLOG_POSTS];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.summary.toLowerCase().includes(q) ||
          b.content.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter((b) => b.category === selectedCategory);
    }

    return result;
  }, [searchQuery, selectedCategory]);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedArticles.includes(id)) {
      setLikedArticles(likedArticles.filter((x) => x !== id));
    } else {
      setLikedArticles([...likedArticles, id]);
    }
  };

  const categories = [
    { id: "all", label: "Tất cả bài viết" },
    { id: "urban-farming", label: "Nông Nghiệp Đô Thị" },
    { id: "eco-living", label: "Sống Xanh Thượng Lưu" },
    { id: "plant-care", label: "Y Học Bệnh Cây" }
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Page Header */}
      <div className="space-y-2">
        <span className="text-xs text-emerald-500 font-mono tracking-widest uppercase font-semibold">TRUYỀN THÔNG & KIẾN THỨC</span>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight flex items-center gap-2">
          <Newspaper className="h-8 w-8 text-emerald-400" />
          Cẩm Nang Xanh & Cải Tạo Đất Sinh Học
        </h1>
        <p className="text-stone-400 text-sm max-w-2xl leading-relaxed">
          Nơi chia sẻ các phác đồ y học thực vật từ nghệ nhân bản địa, bí quyết canh tác vườn rau ban công lầu cao và triết lý sống tối giản trung hòa dấu chân Carbon.
        </p>
      </div>

      {/* Inputs Controlling Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-stone-900/30 p-5 rounded-3xl border border-stone-850">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
          <input
            type="text"
            placeholder="Tìm kiến thức cẩm nang, tự làm dầu lốt nhện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-950 text-stone-200 border border-stone-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 items-center">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                selectedCategory === c.id
                  ? "bg-emerald-500 text-black font-semibold shadow-md"
                  : "bg-stone-950 text-stone-500 border border-stone-850 hover:text-stone-300"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Standard Blog Grid */}
      {filteredBlogPosts.length === 0 ? (
        <div className="text-center py-20 bg-stone-900/10 border border-dashed border-stone-800 rounded-3xl font-medium">
          Không tìm thấy bài viết nào khớp với nội dung gõ.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogPosts.map((post) => {
            const isLiked = likedArticles.includes(post.id);
            return (
              <div
                key={post.id}
                onClick={() => setActiveArticle(post)}
                className="group bg-[#151515] border border-[#252525] hover:border-emerald-900/40 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between cursor-pointer transition-all h-[420px]"
              >
                {/* Image Stage */}
                <div className="relative h-48 bg-stone-950 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/90 border border-stone-800 px-2.5 py-1 rounded-lg text-[9px] font-mono text-emerald-400">
                    {post.category === "urban-farming" ? "Nông Nghiệp Đô Thị" : post.category === "eco-living" ? "Sống Xanh" : "Y Học Thực Vật"}
                  </div>
                </div>

                {/* Info Text */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <span className="text-[10px] text-stone-500 font-mono block">{post.date}</span>
                    <h3 className="text-sm font-semibold text-stone-100 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-stone-400 text-xs line-clamp-2 leading-relaxed">
                      {post.summary}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-stone-800/40 text-xs">
                    <span className="text-stone-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                    <button
                      onClick={(e) => toggleLike(post.id, e)}
                      className={`text-xs flex items-center gap-1 cursor-pointer ${
                        isLiked ? "text-rose-500" : "text-stone-500 hover:text-stone-300"
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
                      <span>{isLiked ? "Đã lưu" : "Lưu trữ"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Article Full Viewer Modal overlay */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/90 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-stone-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setActiveArticle(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="inline-flex gap-2 items-center px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] uppercase">
              <BookOpen className="h-3 w-3" />
              {activeArticle.category}
            </span>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-display font-medium text-white tracking-tight leading-snug pr-8">
                {activeArticle.title}
              </h2>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-stone-500">
                <span>Tác giả: <strong className="text-stone-300">{activeArticle.author}</strong></span>
                <span>•</span>
                <span>Ngày đăng: {activeArticle.date}</span>
                <span>•</span>
                <span>Thời gian: {activeArticle.readTime}</span>
              </div>
            </div>

            <div className="aspect-video bg-stone-950 rounded-2xl overflow-hidden border border-stone-850">
              <img
                src={activeArticle.image}
                alt={activeArticle.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="prose prose-invert max-w-none text-stone-300 text-xs sm:text-sm leading-relaxed space-y-4">
              <p className="font-medium text-stone-200 bg-stone-900/40 p-4 border-l-4 border-emerald-500 rounded-r-xl">
                {activeArticle.summary}
              </p>
              
              {/* Splitting block text for enhanced paragraphs rendering */}
              {activeArticle.content.split("\n\n").map((part, index) => (
                <p key={index}>{part}</p>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-stone-800 pt-5">
              <span className="text-[10px] text-stone-500 font-mono italic">Kiến thức vì trái đất xanh tươi</span>
              <button
                onClick={() => setActiveArticle(null)}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:text-white rounded-xl text-xs text-stone-300 cursor-pointer transition-all"
              >
                Đóng bài đọc
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
