package com.greenlife.blog.service;

import com.greenlife.blog.dto.ImportDocumentResponse;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class DocumentImportService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    public ImportDocumentResponse importDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tập tin tải lên không được để trống");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Dung lượng tập tin không được vượt quá 5MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("Tên tập tin không hợp lệ");
        }

        String lowerName = originalFilename.toLowerCase();
        String extension = "";
        if (lowerName.lastIndexOf('.') > 0) {
            extension = lowerName.substring(lowerName.lastIndexOf('.'));
        }

        String sourceType;
        String contentHtml;
        String suggestedTitle = "";
        List<String> warnings = new ArrayList<>();

        try (InputStream is = file.getInputStream()) {
            if (extension.equals(".txt")) {
                sourceType = "TXT";
                byte[] bytes = is.readAllBytes();
                String rawText = new String(bytes, StandardCharsets.UTF_8);
                // HTML escape to prevent injection in TXT content
                String escapedText = rawText.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
                contentHtml = parseText(escapedText);
                // Try to infer title from first line
                String[] lines = rawText.split("\\r?\\n");
                if (lines.length > 0 && !lines[0].trim().isEmpty()) {
                    suggestedTitle = lines[0].trim();
                    if (suggestedTitle.length() > 220) {
                        suggestedTitle = suggestedTitle.substring(0, 220);
                    }
                }
            } else if (extension.equals(".md")) {
                sourceType = "MD";
                byte[] bytes = is.readAllBytes();
                String markdown = new String(bytes, StandardCharsets.UTF_8);
                contentHtml = parseMarkdown(markdown);
                
                // Try to find first H1 heading for title
                String[] lines = markdown.split("\\r?\\n");
                for (String line : lines) {
                    String trimmed = line.trim();
                    if (trimmed.startsWith("# ")) {
                        suggestedTitle = trimmed.substring(2).trim();
                        break;
                    }
                }
            } else if (extension.equals(".docx")) {
                sourceType = "DOCX";
                DocxResult docxResult = parseDocx(is);
                contentHtml = docxResult.html;
                suggestedTitle = docxResult.suggestedTitle;
                warnings.addAll(docxResult.warnings);
            } else {
                throw new IllegalArgumentException("Chỉ hỗ trợ các định dạng .docx, .md, .txt");
            }
        } catch (Exception e) {
            if (e instanceof IllegalArgumentException) {
                throw (IllegalArgumentException) e;
            }
            throw new RuntimeException("Lỗi đọc tập tin: " + e.getMessage(), e);
        }

        // Sanitize the HTML
        String sanitizedHtml = sanitizeHtml(contentHtml);

        return ImportDocumentResponse.builder()
                .suggestedTitle(suggestedTitle)
                .contentHtml(sanitizedHtml)
                .sourceType(sourceType)
                .sourceFileName(originalFilename)
                .warnings(warnings)
                .build();
    }

    private String parseText(String text) {
        String[] paragraphs = text.split("\\r?\\n{2,}");
        StringBuilder html = new StringBuilder();
        for (String p : paragraphs) {
            String trimmed = p.trim().replace("\r\n", "<br/>").replace("\n", "<br/>");
            if (!trimmed.isEmpty()) {
                html.append("<p>").append(trimmed).append("</p>");
            }
        }
        return html.toString();
    }

    private String parseMarkdown(String markdown) {
        Parser parser = Parser.builder().build();
        Node document = parser.parse(markdown);
        HtmlRenderer renderer = HtmlRenderer.builder().build();
        return renderer.render(document);
    }

    private static class DocxResult {
        String html;
        String suggestedTitle = "";
        List<String> warnings = new ArrayList<>();
    }

    private DocxResult parseDocx(InputStream is) throws Exception {
        DocxResult result = new DocxResult();
        StringBuilder html = new StringBuilder();

        try (XWPFDocument doc = new XWPFDocument(is)) {
            boolean hasImages = false;
            for (XWPFParagraph p : doc.getParagraphs()) {
                String style = p.getStyleID();
                
                StringBuilder paraHtml = new StringBuilder();
                boolean isHeading = false;
                String tag = "p";

                if (style != null) {
                    if (style.equalsIgnoreCase("Heading1") || style.contains("Heading1") || style.equals("1")) {
                        tag = "h1";
                        isHeading = true;
                    } else if (style.equalsIgnoreCase("Heading2") || style.contains("Heading2") || style.equals("2")) {
                        tag = "h2";
                        isHeading = true;
                    } else if (style.equalsIgnoreCase("Heading3") || style.contains("Heading3") || style.equals("3")) {
                        tag = "h3";
                        isHeading = true;
                    } else if (style.equalsIgnoreCase("Heading4") || style.contains("Heading4") || style.equals("4")) {
                        tag = "h4";
                        isHeading = true;
                    }
                }

                for (XWPFRun run : p.getRuns()) {
                    if (!run.getEmbeddedPictures().isEmpty()) {
                        hasImages = true;
                    }

                    String runText = run.getText(0);
                    if (runText == null) continue;
                    
                    String cleanRunText = runText.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");

                    if (run.isBold()) {
                        cleanRunText = "<strong>" + cleanRunText + "</strong>";
                    }
                    if (run.isItalic()) {
                        cleanRunText = "<em>" + cleanRunText + "</em>";
                    }
                    paraHtml.append(cleanRunText);
                }

                String pContent = paraHtml.toString().trim();
                if (!pContent.isEmpty()) {
                    html.append("<").append(tag).append(">").append(pContent).append("</").append(tag).append(">");
                    if (isHeading && result.suggestedTitle.isEmpty()) {
                        result.suggestedTitle = p.getText().trim();
                        if (result.suggestedTitle.length() > 220) {
                            result.suggestedTitle = result.suggestedTitle.substring(0, 220);
                        }
                    }
                }
            }

            if (hasImages) {
                result.warnings.add("Bài viết chứa hình ảnh nhúng, tính năng này không được hỗ trợ. Hình ảnh đã bị bỏ qua.");
            }
            if (result.suggestedTitle.isEmpty() && !doc.getParagraphs().isEmpty()) {
                for (XWPFParagraph p : doc.getParagraphs()) {
                    String txt = p.getText().trim();
                    if (!txt.isEmpty()) {
                        result.suggestedTitle = txt;
                        if (result.suggestedTitle.length() > 220) {
                            result.suggestedTitle = result.suggestedTitle.substring(0, 220);
                        }
                        break;
                    }
                }
            }
        }

        result.html = html.toString();
        return result;
    }

    public String sanitizeHtml(String rawHtml) {
        if (rawHtml == null) return "";
        
        Safelist safelist = new Safelist()
                .addTags("p", "br", "h1", "h2", "h3", "h4", "strong", "em", "ul", "ol", "li", "blockquote", "a")
                .addAttributes("a", "href")
                .addProtocols("a", "href", "http", "https");

        String cleaned = Jsoup.clean(rawHtml, safelist);
        
        org.jsoup.nodes.Document doc = Jsoup.parseBodyFragment(cleaned);
        for (org.jsoup.nodes.Element link : doc.select("a")) {
            link.attr("rel", "noopener noreferrer nofollow");
            link.attr("target", "_blank");
        }
        
        return doc.body().html();
    }
}
