package com.greenlife.blog.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportDocumentResponse {
    private String suggestedTitle;
    private String contentHtml;
    private String sourceType;
    private String sourceFileName;
    private List<String> warnings;
}
