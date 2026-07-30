import React, { useState, useMemo, useEffect } from "react";
import { BlogPost } from "../../types";
import { useAppContext } from "../../context/AppContext";
import { BlogListView } from "./BlogListView";
import { BlogDetailView } from "./BlogDetailView";

interface BlogViewProps {
  initialSearch?: string;
}

export const BlogView: React.FC<BlogViewProps> = ({
  initialSearch = "",
}) => {
  const { blogPosts, products, setSelectedProduct, setCurrentPage, savedArticleIds, toggleSavedArticle } = useAppContext();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const articles = blogPosts;

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeArticle, setActiveArticle] = useState<BlogPost | null>(null);

  const filteredBlogPosts = useMemo(() => {
    let result = [...articles];

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
  }, [articles, searchQuery, selectedCategory]);

  return (
    <div className="space-y-12 pb-20">
      {activeArticle ? (
        <BlogDetailView
          article={activeArticle}
          onBack={() => setActiveArticle(null)}
          products={products}
          onSelectProduct={(p) => {
            setSelectedProduct(p);
            setActiveArticle(null);
          }}
          onDirectDiagnosis={() => {
            setCurrentPage("ai-diagnosis");
            setActiveArticle(null);
          }}
        />
      ) : (
        <BlogListView
          filteredBlogPosts={filteredBlogPosts}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          likedArticles={savedArticleIds}
          toggleLike={(id, e) => toggleSavedArticle(id, e)}
          onSelectArticle={setActiveArticle}
        />
      )}
    </div>
  );
};
