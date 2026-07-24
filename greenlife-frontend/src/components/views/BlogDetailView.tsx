import React from "react";
import { logger } from "../../utils/logger";
import { sanitizeHtml } from "../../utils/sanitizer";
import { ArrowLeft, BookOpen, Clock, Eye, Tag, BrainCircuit, ArrowRight, User } from "lucide-react";
import { BlogPost, Product } from "../../types";
import { useAppContext } from "../../context/AppContext";
import { ArticleService } from "../../services/articleService";

interface BlogDetailViewProps {
  article: BlogPost;
  onBack: () => void;
  products: Product[];
  onSelectProduct: (p: Product) => void;
  onDirectDiagnosis: () => void;
}

export const BlogDetailView: React.FC<BlogDetailViewProps> = ({
  article,
  onBack,
  products,
  onSelectProduct,
  onDirectDiagnosis,
}) => {
  const { setCurrentPage } = useAppContext();
  const [localArticle, setLocalArticle] = React.useState<BlogPost>(article);

  React.useEffect(() => {
    setLocalArticle(article);

    const controller = new AbortController();
    const fetchFreshDetail = async () => {
      try {
        const fresh = await ArticleService.getArticleById(article.id, controller.signal);
        setLocalArticle(fresh);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          logger.warn("Lỗi đồng bộ chi tiết bài viết ngầm:", err);
        }
      }
    };

    fetchFreshDetail();

    return () => {
      controller.abort();
    };
  }, [article]);

  const isPlantCare = localArticle.category === "plant-care" || 
                      localArticle.title.toLowerCase().includes("bệnh") || 
                      localArticle.title.toLowerCase().includes("nhện") ||
                      localArticle.title.toLowerCase().includes("rệp") || 
                      localArticle.title.toLowerCase().includes("sâu");

  const categoryLabelMap: Record<string, string> = {
    "plant-care": "Y Học Bệnh Cây",
    "urban-farming": "Nông Nghiệp Đô Thị",
    "eco-living": "Lối Sống Xanh Thượng Lưu"
  };

  return (
    <div className="bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-[32px] p-6 sm:p-10 shadow-xs text-[var(--gl-text-primary)] max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Back button & Category */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--gl-border)] pb-5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 text-xs font-bold text-[var(--gl-accent)] hover:underline cursor-pointer font-mono uppercase tracking-wider bg-[var(--gl-accent-soft)] rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại cẩm nang
        </button>

        <span className="inline-flex gap-2 items-center px-3.5 py-1.5 rounded-full bg-[var(--gl-accent-soft)] border border-[var(--gl-accent)]/20 text-[var(--gl-accent)] font-mono text-[10px] font-bold uppercase tracking-wide">
          <BookOpen className="h-3.5 w-3.5" />
          {categoryLabelMap[localArticle.category] || localArticle.category}
        </span>
      </div>

      {/* Title & Metadata */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--gl-text-primary)] tracking-tight leading-snug break-words">
          {localArticle.title}
        </h1>
        
        <div className="flex flex-wrap gap-4 text-xs font-mono text-[var(--gl-text-muted)] font-medium">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-[var(--gl-text-muted)]" />
            Tác giả: <strong className="text-[var(--gl-text-primary)] font-bold ml-0.5">{localArticle.author}</strong>
          </span>
          <span>•</span>
          <span>Ngày đăng: {localArticle.date}</span>
          <span>•</span>
          <span>Thời gian đọc: {localArticle.readTime}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-[var(--gl-text-muted)]" /> {localArticle.views || 0} lượt xem
          </span>
        </div>
      </div>

      {/* Featured Image */}
      <div className="aspect-video bg-[var(--gl-bg-muted)] rounded-2xl overflow-hidden border border-[var(--gl-border)] shadow-sm">
        <img
          src={localArticle.image}
          alt={localArticle.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Article Content */}
      <div className="prose max-w-none text-[var(--gl-text-secondary)] text-sm sm:text-base leading-relaxed space-y-5">
        <p className="font-semibold text-[var(--gl-text-primary)] bg-[var(--gl-bg-muted)] p-5 border-l-4 border-[var(--gl-accent)] rounded-r-2xl leading-relaxed shadow-xs break-words">
          {localArticle.summary}
        </p>
        
        <div className="space-y-4 font-sans text-[var(--gl-text-secondary)] break-words">
          {localArticle.content.split("\n\n").map((part, index) => {
            // Clean up basic HTML tags or parse them directly
            return (
              <p
                key={index}
                className="leading-relaxed break-words"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }}
              />
            );
          })}
        </div>
      </div>

      {/* Tagged Products Section */}
      {localArticle.taggedProductIds && localArticle.taggedProductIds.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-[var(--gl-border)]">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--gl-accent)] flex items-center gap-2 bg-[var(--gl-accent-soft)] px-3.5 py-1.5 rounded-lg border border-[var(--gl-accent)]/20 inline-block">
            <Tag className="w-4 h-4 animate-pulse text-[var(--gl-accent)]" /> Sản phẩm khuyên dùng trong bài viết:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {localArticle.taggedProductIds.map((pId) => {
              const prod = products.find((p) => p.id === pId);
              if (!prod) return null;
              return (
                <div
                  key={pId}
                  onClick={() => onSelectProduct(prod)}
                  className="flex items-center justify-between p-4 bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] hover:border-[var(--gl-accent)]/30 rounded-2xl cursor-pointer transition-all group/item shadow-xs hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="w-12 h-12 object-cover rounded-xl border border-[var(--gl-border)] shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[var(--gl-text-primary)] block truncate group-hover/item:text-[var(--gl-accent)]">
                        {prod.name}
                      </span>
                      <span className="text-[10px] text-[var(--gl-accent)] font-mono mt-1 block font-bold">
                        {prod.price.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--gl-accent)] font-mono font-bold shrink-0 bg-[var(--gl-accent-soft)] px-3 py-1.5 rounded-lg border border-[var(--gl-accent)]/20 group-hover/item:bg-[var(--gl-accent)] group-hover/item:text-white dark:group-hover/item:text-emerald-950 transition-all uppercase tracking-wider">
                    Mua ngay
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Special Eco-AI Diagnosis Banner */}
      {isPlantCare && (
        <div className="p-6 bg-[var(--gl-accent-soft)]/40 border border-[var(--gl-accent)]/20 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[var(--gl-bg-muted)] rounded-2xl border border-[var(--gl-border)] text-[var(--gl-accent)] shadow-sm">
              <BrainCircuit className="w-7 h-7 animate-pulse text-[var(--gl-accent)]" />
            </div>
            <div>
              <h4 className="font-bold text-[var(--gl-text-primary)] text-sm sm:text-base">AI Plant Doctor Chẩn Đoán Cây Bệnh</h4>
              <p className="text-xs text-[var(--gl-text-secondary)] mt-1">Cây cảnh nhà bạn cũng đang có triệu chứng bệnh này? Bấm vào đây để AI Plant Doctor chẩn đoán tức thì!</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDirectDiagnosis}
            className="px-5 py-3 min-h-[44px] bg-[var(--gl-accent)] hover:bg-[var(--gl-accent-hover)] text-white dark:text-emerald-950 text-xs font-bold rounded-2xl cursor-pointer transition-all flex items-center gap-2 uppercase font-mono tracking-wider shrink-0 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
          >
            Chẩn Đoán Ngay <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer spacing */}
      <div className="flex items-center justify-between border-t border-[var(--gl-border)] pt-6">
        <span className="text-[10px] text-[var(--gl-text-muted)] font-mono italic">Kiến thức vì cuộc sống xanh tươi • GreenLife</span>
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 min-h-[40px] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] text-[var(--gl-text-primary)] rounded-xl text-xs font-bold cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
        >
          Đóng bài đọc
        </button>
      </div>
    </div>
  );
};
