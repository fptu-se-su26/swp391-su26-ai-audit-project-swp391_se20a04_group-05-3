import React from "react";
import { logger } from "../../utils/logger";
import { sanitizeHtml } from "../../utils/sanitizer";
import { ArrowLeft, BookOpen, Clock, Eye, Tag, BrainCircuit, ArrowRight, User } from "lucide-react";
import { BlogPost, Product } from "../../types";
import { ExpertCalloutBanner } from "./ExpertDirectoryView";
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
    <div className="bg-white border border-stone-250 rounded-[32px] p-6 sm:p-10 shadow-xs text-stone-800 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Back button & Category */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer font-mono uppercase tracking-wider bg-emerald-50 px-3 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại cẩm nang
        </button>

        <span className="inline-flex gap-2 items-center px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-mono text-[10px] font-bold uppercase tracking-wide">
          <BookOpen className="h-3.5 w-3.5" />
          {categoryLabelMap[localArticle.category] || localArticle.category}
        </span>
      </div>

      {/* Title & Metadata */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-stone-900 tracking-tight leading-snug">
          {localArticle.title}
        </h1>
        
        <div className="flex flex-wrap gap-4 text-xs font-mono text-stone-400 font-medium">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-stone-400" />
            Tác giả: <strong className="text-stone-700 font-bold ml-0.5">{localArticle.author}</strong>
          </span>
          <span>•</span>
          <span>Ngày đăng: {localArticle.date}</span>
          <span>•</span>
          <span>Thời gian đọc: {localArticle.readTime}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {localArticle.views || 0} lượt xem
          </span>
        </div>
      </div>

      {/* Featured Image */}
      <div className="aspect-video bg-stone-50 rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
        <img
          src={localArticle.image}
          alt={localArticle.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Article Content */}
      <div className="prose prose-stone max-w-none text-stone-600 text-sm sm:text-base leading-relaxed space-y-5">
        <p className="font-semibold text-stone-800 bg-stone-50 p-5 border-l-4 border-emerald-600 rounded-r-2xl leading-relaxed shadow-xs">
          {localArticle.summary}
        </p>
        
        <div className="space-y-4 font-sans text-stone-650">
          {localArticle.content.split("\n\n").map((part, index) => {
            // Clean up basic HTML tags or parse them directly
            return (
              <p 
                key={index} 
                className="leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }} 
              />
            );
          })}
        </div>
      </div>

      {/* Tagged Products Section */}
      {localArticle.taggedProductIds && localArticle.taggedProductIds.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-stone-100">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-100/50 inline-block">
            <Tag className="w-4 h-4 animate-pulse text-emerald-600" /> Sản phẩm khuyên dùng trong bài viết:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {localArticle.taggedProductIds.map((pId) => {
              const prod = products.find((p) => p.id === pId);
              if (!prod) return null;
              return (
                <div
                  key={pId}
                  onClick={() => onSelectProduct(prod)}
                  className="flex items-center justify-between p-4 bg-stone-50 hover:bg-white border border-stone-200 hover:border-emerald-500/30 rounded-2xl cursor-pointer transition-all group/item shadow-xs hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="w-12 h-12 object-cover rounded-xl border border-stone-200" 
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-stone-900 block truncate group-hover/item:text-emerald-700">
                        {prod.name}
                      </span>
                      <span className="text-[10px] text-emerald-650 font-mono mt-1 block font-bold">
                        {prod.price.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-750 font-mono font-bold shrink-0 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 group-hover/item:bg-emerald-600 group-hover/item:text-white group-hover/item:border-emerald-600 transition-all uppercase tracking-wider">
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
        <div className="p-6 bg-linear-to-r from-emerald-50 to-teal-50/50 border border-emerald-200 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl border border-emerald-200 text-emerald-600 shadow-sm">
              <BrainCircuit className="w-7 h-7 animate-pulse text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-sm sm:text-base">AI Plant Doctor Chẩn Đoán Cây Bệnh</h4>
              <p className="text-xs text-stone-500 mt-1">Cây cảnh nhà bạn cũng đang có triệu chứng bệnh này? Bấm vào đây để AI Plant Doctor chẩn đoán tức thì!</p>
            </div>
          </div>
          <button
            onClick={onDirectDiagnosis}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl cursor-pointer transition-all flex items-center gap-2 uppercase font-mono tracking-wider shrink-0 shadow-md shadow-emerald-750/10"
          >
            Chẩn Đoán Ngay <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Expert Callout Banner */}
      <div className="pt-6 border-t border-stone-100">
        <ExpertCalloutBanner onNavigateToDirectory={() => setCurrentPage("booking")} />
      </div>

      {/* Footer footer spacing */}
      <div className="flex items-center justify-between border-t border-stone-100 pt-6">
        <span className="text-[10px] text-stone-400 font-mono italic">Kiến thức vì cuộc sống xanh tươi • GreenLife</span>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 hover:text-stone-800 rounded-xl text-xs font-bold cursor-pointer transition-all"
        >
          Đóng bài đọc
        </button>
      </div>
    </div>
  );
};
