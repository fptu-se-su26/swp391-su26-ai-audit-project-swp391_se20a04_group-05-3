import React, { useState, useEffect, useCallback } from "react";
import { 
  FileText, 
  Plus, 
  Upload, 
  Search, 
  Filter, 
  Eye, 
  Pencil, 
  Trash2, 
  Send, 
  RotateCcw, 
  ChevronLeft, 
  History, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  X,
  BookOpen,
  Image as ImageIcon
} from "lucide-react";
import { ArticleService } from "../../services/articleService";
import { AuthorBlogResponse, ImportDocumentResponse } from "../../types";
import toast from "react-hot-toast";

interface AuthorBlogWorkspaceProps {
  userRole: "CUSTOMER" | "STORE_OWNER";
}

export const AuthorBlogWorkspace: React.FC<AuthorBlogWorkspaceProps> = ({ userRole }) => {
  // Navigation & States
  const [view, setView] = useState<"list" | "edit" | "preview">("list");
  const [blogs, setBlogs] = useState<AuthorBlogResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  
  // Search & Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Editor states
  const [editingBlog, setEditingBlog] = useState<AuthorBlogResponse | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("GREEN_LIVING");
  const [formSummary, setFormSummary] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formVersion, setFormVersion] = useState<number>(0);
  
  // Import states
  const [importing, setImporting] = useState(false);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  
  // Modals / Details
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [historyBlog, setHistoryBlog] = useState<AuthorBlogResponse | null>(null);

  // Fetch blogs
  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ArticleService.getMyBlogs(
        search,
        categoryFilter,
        statusFilter,
        page,
        size
      );
      setBlogs(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải danh sách bài viết");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, page, size]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Handle document import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportWarnings([]);
    try {
      const result: ImportDocumentResponse = await ArticleService.importDocument(file);
      if (result.suggestedTitle) setFormTitle(result.suggestedTitle);
      if (result.contentHtml) setFormContent(result.contentHtml);
      if (result.warnings && result.warnings.length > 0) {
        setImportWarnings(result.warnings);
        toast.success("Tải tài liệu thành công với một số cảnh báo!");
      } else {
        toast.success("Nhập tài liệu thành công!");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi nhập tập tin. Vui lòng kiểm tra lại định dạng.");
    } finally {
      setImporting(false);
      if (e.target) e.target.value = "";
    }
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingBlog(null);
    setFormTitle("");
    setFormCategory("GREEN_LIVING");
    setFormSummary("");
    setFormContent("");
    setFormImageUrl("https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600");
    setFormVersion(0);
    setImportWarnings([]);
    setView("edit");
    setActiveTab("edit");
  };

  // Open Edit Form
  const handleOpenEdit = async (blog: AuthorBlogResponse) => {
    setLoading(true);
    try {
      // Fetch full details (revisions & history)
      const detail = await ArticleService.getAuthorBlogById(blog.id);
      setEditingBlog(detail);
      setFormTitle(detail.title);
      setFormCategory(detail.category);
      setFormSummary(detail.summary);
      setFormContent(detail.content);
      setFormImageUrl(detail.imageUrl || "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600");
      setFormVersion(detail.version);
      setImportWarnings([]);
      setView("edit");
      setActiveTab("edit");
    } catch (err: any) {
      toast.error(err.message || "Không thể tải chi tiết bài viết");
    } finally {
      setLoading(false);
    }
  };

  // Spawn New Revision Draft
  const handleSpawnRevision = async (blog: AuthorBlogResponse) => {
    setLoading(true);
    try {
      const updated = await ArticleService.createDraftRevision(blog.id);
      toast.success("Đã tạo bản nháp chỉnh sửa mới!");
      handleOpenEdit(updated);
    } catch (err: any) {
      toast.error(err.message || "Không thể tạo bản chỉnh sửa");
      setLoading(false);
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!formTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    setLoading(true);
    try {
      if (editingBlog) {
        // Update draft revision
        const updated = await ArticleService.updateBlog(editingBlog.id, {
          title: formTitle,
          category: formCategory,
          summary: formSummary,
          content: formContent,
          imageUrl: formImageUrl,
          version: formVersion
        });
        setEditingBlog(updated);
        setFormVersion(updated.version);
        toast.success("Lưu bản nháp thành công!");
      } else {
        // Create new blog
        const created = await ArticleService.createBlog({
          title: formTitle,
          category: formCategory,
          summary: formSummary,
          content: formContent,
          imageUrl: formImageUrl
        });
        setEditingBlog(created);
        setFormVersion(created.version);
        toast.success("Tạo bài viết nháp thành công!");
      }
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes("thay đổi bởi một phiên khác")) {
        toast.error("Dữ liệu bài viết đã được thay đổi bởi một phiên khác. Vui lòng tải lại và thử lại.");
      } else {
        toast.error(err.message || "Lỗi lưu bài viết");
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit for Moderation Review
  const handleSubmitReview = async () => {
    if (!editingBlog) return;
    if (!formTitle.trim() || !formSummary.trim() || !formContent.trim()) {
      toast.error("Vui lòng điền đầy đủ tiêu đề, tóm tắt và nội dung trước khi gửi duyệt");
      return;
    }

    setLoading(true);
    try {
      const updated = await ArticleService.submitBlog(editingBlog.id, formVersion);
      setEditingBlog(updated);
      setFormVersion(updated.version);
      toast.success("Đã gửi bài viết đi duyệt!");
      setView("list");
      fetchBlogs();
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes("thay đổi bởi một phiên khác")) {
        toast.error("Dữ liệu bài viết đã được thay đổi bởi một phiên khác. Vui lòng tải lại và thử lại.");
      } else {
        toast.error(err.message || "Lỗi gửi duyệt bài viết");
      }
    } finally {
      setLoading(false);
    }
  };

  // Withdraw Submission
  const handleWithdrawSubmission = async (blog: AuthorBlogResponse) => {
    if (!window.confirm("Bạn có chắc chắn muốn rút bài viết này về bản nháp không?")) return;
    setLoading(true);
    try {
      await ArticleService.withdrawBlog(blog.id, blog.version);
      toast.success("Đã rút yêu cầu duyệt bài viết!");
      fetchBlogs();
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes("thay đổi bởi một phiên khác")) {
        toast.error("Dữ liệu bài viết đã được thay đổi bởi một phiên khác. Vui lòng tải lại và thử lại.");
      } else {
        toast.error(err.message || "Lỗi rút yêu cầu duyệt");
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete Draft
  const handleDeleteBlog = async (blog: AuthorBlogResponse) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết nháp này không?")) return;
    setLoading(true);
    try {
      await ArticleService.deleteBlog(blog.id);
      toast.success("Xóa bài viết thành công!");
      fetchBlogs();
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa bài viết");
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const getStatusBadge = (status: string, revStatus?: string) => {
    const activeStatus = revStatus || status;
    switch (activeStatus) {
      case "DRAFT":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--gl-bg-muted)] text-[var(--gl-text-secondary)]">Bản nháp</span>;
      case "PENDING_REVIEW":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse">Chờ duyệt</span>;
      case "CHANGES_REQUESTED":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">Yêu cầu chỉnh sửa</span>;
      case "REJECTED":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">Từ chối</span>;
      case "PUBLISHED":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Đã xuất bản</span>;
      case "ARCHIVED":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--gl-bg-muted)] text-[var(--gl-text-muted)]">Đã lưu trữ</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--gl-bg-muted)] text-[var(--gl-text-secondary)]">{activeStatus}</span>;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "URBAN_FARMING":
        return "Làm nông đô thị";
      case "GREEN_LIVING":
      case "INSPIRATION":
        return "Sống xanh";
      case "BASIC_CARE":
      case "DISEASE":
        return "Chăm sóc cây";
      default:
        return cat;
    }
  };

  return (
    <div className="bg-[var(--gl-bg-surface)] rounded-2xl shadow-sm border border-[var(--gl-border)] overflow-hidden min-h-[600px] flex flex-col">
      {/* HEADER SECTION */}
      <div className="px-6 py-5 bg-[var(--gl-bg-muted)] border-b border-[var(--gl-border)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--gl-text-primary)] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            Quản lý bài viết của tôi
          </h2>
          <p className="text-sm text-[var(--gl-text-muted)] mt-1">
            {userRole === "STORE_OWNER" 
              ? "Soạn thảo bài viết chia sẻ kinh nghiệm làm vườn và gửi duyệt xuất bản." 
              : "Trở thành tác giả GreenLife bằng cách viết và gửi duyệt các bài viết sống xanh."
            }
          </p>
        </div>
        {view === "list" && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Viết bài mới
          </button>
        )}
      </div>

      {/* WARNINGS PANEL */}
      {importWarnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30 px-6 py-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-800 dark:text-amber-400 text-sm">Cảnh báo nhập tài liệu:</h4>
            <ul className="list-disc pl-5 mt-1 text-xs text-amber-700 dark:text-amber-500 space-y-1">
              {importWarnings.map((w, idx) => <li key={idx}>{w}</li>)}
            </ul>
          </div>
          <button type="button" onClick={() => setImportWarnings([])} className="ml-auto text-amber-500 hover:text-amber-700" aria-label="Đóng cảnh báo">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="flex-1 flex flex-col p-6">
          {/* SEARCH & FILTERS */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="urban-farming">Làm nông đô thị</option>
              <option value="eco-living">Sống xanh</option>
              <option value="plant-care">Chăm sóc cây cảnh</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="pending_review">Chờ duyệt</option>
              <option value="changes_requested">Cần chỉnh sửa</option>
              <option value="rejected">Từ chối</option>
              <option value="published">Đã xuất bản</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>

          {/* TABLE / LIST */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-[var(--gl-text-muted)] mt-4 text-sm font-medium">Đang tải danh sách bài viết...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[var(--gl-border)] rounded-2xl">
              <FileText className="w-16 h-16 text-[var(--gl-text-muted)]" />
              <h3 className="text-lg font-bold text-[var(--gl-text-primary)] mt-4">Không tìm thấy bài viết nào</h3>
              <p className="text-[var(--gl-text-muted)] max-w-md text-sm mt-2">
                Hãy bắt đầu viết bài đầu tiên của bạn để chia sẻ những kiến thức sống xanh bổ ích!
              </p>
              <button 
                type="button"
                onClick={handleOpenCreate}
                className="mt-6 px-4 py-2.5 min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition-all"
              >
                Tạo bài viết đầu tiên
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="overflow-x-auto rounded-xl border border-[var(--gl-border)]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--gl-bg-muted)] text-[var(--gl-text-secondary)] text-xs font-semibold uppercase border-b border-[var(--gl-border)]">
                      <th className="px-6 py-4">Bài viết</th>
                      <th className="px-6 py-4">Danh mục</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Phiên bản</th>
                      <th className="px-6 py-4">Ngày cập nhật</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--gl-border)] text-sm">
                    {blogs.map((blog) => (
                      <tr key={blog.id} className="hover:bg-[var(--gl-bg-muted)] transition-colors">
                        <td className="px-6 py-4 max-w-[320px]">
                          <div className="flex items-center gap-3">
                            <img 
                              src={blog.imageUrl || "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=200"}
                              alt={blog.title}
                              className="w-12 h-12 object-cover rounded-lg border border-[var(--gl-border)]"
                            />
                            <div className="truncate">
                              <h4 className="font-semibold text-[var(--gl-text-primary)] truncate" title={blog.title}>{blog.title}</h4>
                              <p className="text-[var(--gl-text-muted)] text-xs truncate mt-0.5" title={blog.summary}>{blog.summary}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-[var(--gl-text-secondary)]">{getCategoryLabel(blog.category)}</span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(blog.status, blog.currentRevisionStatus)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-[var(--gl-text-secondary)]">
                          v{blog.version}
                        </td>
                        <td className="px-6 py-4 text-[var(--gl-text-muted)]">
                          {new Date(blog.updatedAt || blog.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Editor triggers */}
                            {(blog.currentRevisionStatus === "DRAFT" || blog.currentRevisionStatus === "CHANGES_REQUESTED" || blog.currentRevisionStatus === "REJECTED") ? (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(blog)}
                                className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--gl-text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors"
                                title="Chỉnh sửa bản nháp"
                                aria-label="Chỉnh sửa bài viết"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            ) : blog.status === "PUBLISHED" ? (
                              <button
                                type="button"
                                onClick={() => handleSpawnRevision(blog)}
                                className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--gl-text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors"
                                title="Tạo bản chỉnh sửa mới"
                                aria-label="Tạo bản chỉnh sửa mới"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            ) : null}

                            {/* View history */}
                            <button
                              type="button"
                              onClick={() => setHistoryBlog(blog)}
                              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--gl-text-muted)] hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition-colors"
                              title="Xem lịch sử duyệt"
                              aria-label="Xem lịch sử duyệt"
                            >
                              <History className="w-4 h-4" />
                            </button>

                            {/* Withdraw Pending */}
                            {blog.currentRevisionStatus === "PENDING_REVIEW" && (
                              <button
                                type="button"
                                onClick={() => handleWithdrawSubmission(blog)}
                                className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--gl-text-muted)] hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors"
                                title="Rút yêu cầu duyệt"
                                aria-label="Rút yêu cầu duyệt"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete Draft */}
                            {blog.status !== "PUBLISHED" && blog.status !== "ARCHIVED" && (
                              <button
                                type="button"
                                onClick={() => handleDeleteBlog(blog)}
                                className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--gl-text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                                title="Xóa bản nháp"
                                aria-label="Xóa bài viết này"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--gl-border)] pt-4 mt-4">
                  <span className="text-sm text-[var(--gl-text-muted)]">
                    Tổng số bài viết: <strong>{totalElements}</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-3 py-1.5 min-h-[36px] rounded-lg border border-[var(--gl-border)] text-sm hover:bg-[var(--gl-bg-muted)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--gl-text-secondary)]"
                    >
                      Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPage(i)}
                        className={`px-3 py-1.5 min-h-[36px] rounded-lg text-sm transition-colors ${
                          page === i 
                            ? "bg-emerald-600 text-white font-semibold" 
                            : "border border-[var(--gl-border)] hover:bg-[var(--gl-bg-muted)] text-[var(--gl-text-secondary)]"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page === totalPages - 1}
                      className="px-3 py-1.5 min-h-[36px] rounded-lg border border-[var(--gl-border)] text-sm hover:bg-[var(--gl-bg-muted)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--gl-text-secondary)]"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* EDIT / PREVIEW VIEW */}
      {view === "edit" && (
        <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[var(--gl-border)] min-h-[500px]">
          {/* EDITOR SIDE */}
          <div className="flex-1 p-6 flex flex-col gap-5">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between gap-4 border-b border-[var(--gl-border)] pb-4">
              <button
                type="button"
                onClick={() => {
                  setView("list");
                  fetchBlogs();
                }}
                className="flex items-center gap-1.5 text-sm font-semibold text-[var(--gl-text-secondary)] hover:text-[var(--gl-text-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
              >
                <ChevronLeft className="w-5 h-5" />
                Quay lại danh sách
              </button>

              <div className="flex items-center gap-2">
                {/* File import */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--gl-border)] hover:bg-[var(--gl-bg-muted)] rounded-xl text-xs font-semibold cursor-pointer text-[var(--gl-text-secondary)] transition-all focus-within:ring-2 focus-within:ring-[var(--gl-focus-ring)]">
                  {importing ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 text-[var(--gl-text-muted)]" />
                  )}
                  Nhập tài liệu (.docx, .md, .txt)
                  <input
                    type="file"
                    accept=".docx,.md,.txt"
                    onChange={handleFileImport}
                    disabled={importing || loading}
                    className="sr-only"
                  />
                </label>

                {/* Tab selector */}
                <div className="flex bg-[var(--gl-bg-muted)] p-0.5 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab("edit")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === "edit" ? "bg-[var(--gl-bg-elevated)] text-[var(--gl-text-primary)] shadow-sm" : "text-[var(--gl-text-muted)] hover:text-[var(--gl-text-secondary)]"}`}
                  >
                    Biên tập
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === "preview" ? "bg-[var(--gl-bg-elevated)] text-[var(--gl-text-primary)] shadow-sm" : "text-[var(--gl-text-muted)] hover:text-[var(--gl-text-secondary)]"}`}
                  >
                    Xem trước HTML
                  </button>
                </div>
              </div>
            </div>

            {activeTab === "edit" ? (
              <div className="flex-1 flex flex-col gap-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-[var(--gl-text-secondary)] uppercase mb-1.5">Tiêu đề bài viết</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Nhập tiêu đề sinh động cho bài viết..."
                    className="w-full px-4 py-2.5 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-semibold"
                  />
                </div>

                {/* Category & Image URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--gl-text-secondary)] uppercase mb-1.5">Danh mục</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                    >
                      <option value="GREEN_LIVING">Sống xanh</option>
                      <option value="URBAN_FARMING">Làm nông đô thị</option>
                      <option value="BASIC_CARE">Chăm sóc cây cảnh</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--gl-text-secondary)] uppercase mb-1.5">Ảnh bìa (Đường dẫn URL)</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gl-text-muted)]" />
                      <input
                        type="text"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="Nhập URL hình ảnh minh họa..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-xs font-bold text-[var(--gl-text-secondary)] uppercase mb-1.5">Tóm tắt ngắn</label>
                  <textarea
                    rows={2}
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder="Mô tả tóm tắt nội dung bài viết để thu hút người đọc..."
                    className="w-full px-4 py-2.5 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm resize-none"
                  />
                </div>

                {/* Content editor */}
                <div className="flex-1 flex flex-col min-h-[300px]">
                  <label className="block text-xs font-bold text-[var(--gl-text-secondary)] uppercase mb-1.5">Nội dung bài viết (HTML / Văn bản)</label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Nhập nội dung bài viết tại đây. Sử dụng các thẻ HTML cơ bản như <p>, <h1>, <h2>, <strong>, <em>, <a>..."
                    className="w-full flex-1 p-4 bg-[var(--gl-bg-surface)] border border-[var(--gl-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-mono resize-none min-h-[250px]"
                  />
                </div>
              </div>
            ) : (
              // HTML preview
              <div className="flex-1 flex flex-col gap-4">
                <div className="border border-[var(--gl-border)] rounded-xl p-6 bg-[var(--gl-bg-muted)] flex-1 overflow-y-auto max-h-[500px]">
                  <h1 className="text-2xl font-bold text-[var(--gl-text-primary)] mb-4">{formTitle || "Tiêu đề bài viết"}</h1>
                  <div className="flex items-center gap-3 mb-6 text-xs text-[var(--gl-text-muted)]">
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                      {getCategoryLabel(formCategory)}
                    </span>
                    <span>•</span>
                    <span>Tác giả: Tôi</span>
                  </div>
                  {formImageUrl && (
                    <img
                      src={formImageUrl}
                      alt="Ảnh bìa"
                      className="w-full max-h-[240px] object-cover rounded-xl mb-6"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600";
                      }}
                    />
                  )}
                  {formSummary && (
                    <p className="text-[var(--gl-text-secondary)] font-medium italic border-l-4 border-emerald-500 pl-4 mb-6">
                      {formSummary}
                    </p>
                  )}
                  <div 
                    className="prose prose-sm prose-emerald max-w-none text-[var(--gl-text-primary)] space-y-4"
                    dangerouslySetInnerHTML={{ __html: formContent || "<p class='text-gray-400'>Chưa có nội dung bài viết.</p>" }}
                  />
                </div>
              </div>
            )}

            {/* Form actions */}
            <div className="flex justify-between items-center gap-4 mt-auto border-t border-[var(--gl-border)] pt-4">
              <div className="text-xs text-[var(--gl-text-muted)]">
                Phiên bản chỉnh sửa: <strong>v{formVersion}</strong>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="px-4 py-2 min-h-[40px] border border-[var(--gl-border)] hover:bg-[var(--gl-bg-muted)] text-[var(--gl-text-secondary)] rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                >
                  Lưu bản nháp
                </button>
                {editingBlog && (
                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                  >
                    <Send className="w-4 h-4" />
                    Gửi đi duyệt
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* EDITORIAL REVISIONS AND HISTORY SIDE PANEL */}
          {editingBlog && (
            <div className="w-full md:w-80 p-6 bg-[var(--gl-bg-muted)] flex flex-col gap-6">
              {/* Revision history */}
              <div>
                <h3 className="text-sm font-bold text-[var(--gl-text-primary)] flex items-center gap-2 mb-3">
                  <History className="w-4.5 h-4.5 text-emerald-600" />
                  Các phiên bản sửa đổi ({editingBlog.revisions?.length || 0})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {editingBlog.revisions?.map((rev) => (
                    <div 
                      key={rev.id} 
                      className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 transition-all ${
                        rev.revisionNumber === editingBlog.version 
                          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 shadow-sm"
                          : "bg-[var(--gl-bg-elevated)] border-[var(--gl-border)]"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[var(--gl-text-primary)]">Phiên bản {rev.revisionNumber}</span>
                        <span className="scale-90 font-medium">{getStatusBadge(rev.status)}</span>
                      </div>
                      <p className="text-[var(--gl-text-muted)] truncate">{rev.title}</p>
                      <span className="text-[10px] text-[var(--gl-text-muted)]">
                        {new Date(rev.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moderation History */}
              <div className="flex-1 flex flex-col min-h-0">
                <h3 className="text-sm font-bold text-[var(--gl-text-primary)] flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                  Lịch sử duyệt &amp; nhận xét
                </h3>
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {editingBlog.history && editingBlog.history.length > 0 ? (
                    editingBlog.history.map((hist) => (
                      <div key={hist.id} className="bg-[var(--gl-bg-elevated)] border border-[var(--gl-border)] rounded-xl p-3 text-xs shadow-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-[var(--gl-text-primary)]">{hist.actorName}</span>
                          <span className="text-[10px] text-[var(--gl-text-muted)]">
                            {new Date(hist.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--gl-bg-muted)] text-[10px] font-bold text-[var(--gl-text-secondary)]">
                            {hist.action}
                          </span>
                        </div>
                        {hist.note && (
                          <p className="bg-[var(--gl-bg-muted)] p-2 rounded text-[var(--gl-text-secondary)] italic">
                            &quot;{hist.note}&quot;
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-xs italic text-center py-6">Chưa có lịch sử kiểm duyệt.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY MODAL DETAILED VIEW */}
      {historyBlog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--gl-bg-surface)] rounded-2xl max-w-lg w-full max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain flex flex-col shadow-xl border border-[var(--gl-border)]">
            <div className="px-6 py-4 bg-[var(--gl-bg-muted)] border-b border-[var(--gl-border)] flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-[var(--gl-text-primary)] flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                Lịch sử duyệt của bài viết
              </h3>
              <button 
                type="button"
                onClick={() => setHistoryBlog(null)} 
                className="text-[var(--gl-text-muted)] hover:text-[var(--gl-text-primary)] bg-[var(--gl-bg-muted)] hover:bg-[var(--gl-bg-elevated)] p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h4 className="font-semibold text-sm text-[var(--gl-text-primary)]">{historyBlog.title}</h4>
              <p className="text-xs text-[var(--gl-text-muted)] mt-1">Trạng thái công khai: {getStatusBadge(historyBlog.status)}</p>

              <div className="border-t border-[var(--gl-border)] pt-4 space-y-3">
                <h5 className="text-xs font-bold text-[var(--gl-text-secondary)] uppercase">Dòng sự kiện kiểm duyệt:</h5>
                {historyBlog.history && historyBlog.history.length > 0 ? (
                  <div className="relative pl-6 border-l border-[var(--gl-border)] space-y-5 py-2">
                    {historyBlog.history.map((hist) => (
                      <div key={hist.id} className="relative">
                        {/* Dot indicator */}
                        <div className="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--gl-bg-surface)]" />
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[var(--gl-text-primary)]">{hist.actorName}</span>
                            <span className="text-[10px] text-[var(--gl-text-muted)]">
                              {new Date(hist.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                              {hist.action}
                            </span>
                          </div>
                          {hist.note && (
                            <p className="bg-[var(--gl-bg-muted)] p-2 rounded text-[var(--gl-text-secondary)] italic mt-1.5">
                              &quot;{hist.note}&quot;
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--gl-text-muted)] text-xs italic">Chưa ghi nhận sự kiện kiểm duyệt nào cho bài viết này.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-[var(--gl-bg-muted)] border-t border-[var(--gl-border)] flex justify-end flex-shrink-0">
              <button 
                type="button"
                onClick={() => setHistoryBlog(null)}
                className="px-4 py-2 min-h-[40px] bg-[var(--gl-bg-elevated)] hover:bg-[var(--gl-border)] text-[var(--gl-text-primary)] rounded-xl text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-focus-ring)]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
