package com.greenlife.diagnosis.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DiagnosisStructuredFieldMappingTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testSerializeList_Success() throws Exception {
        List<String> list = Arrays.asList("Triệu chứng 1", "Triệu chứng 2");
        String json = serializeListHelper(list);
        assertEquals("[\"Triệu chứng 1\",\"Triệu chứng 2\"]", json);
        
        // Verify round-trip parsing
        List<String> parsed = parseListHelper(json);
        assertEquals(2, parsed.size());
        assertEquals("Triệu chứng 1", parsed.get(0));
        assertEquals("Triệu chứng 2", parsed.get(1));
    }

    @Test
    void testSerializeList_NullOrEmpty() {
        assertEquals("[]", serializeListHelper(null));
        assertEquals("[]", serializeListHelper(Collections.emptyList()));
        
        assertEquals(0, parseListHelper(null).size());
        assertEquals(0, parseListHelper("").size());
        assertEquals(0, parseListHelper("[]").size());
    }

    @Test
    void testParseList_MalformedJsonFallback() {
        String malformedJson = "Item 1\nItem 2; Item 3";
        List<String> parsed = parseListHelper(malformedJson);
        
        assertEquals(3, parsed.size());
        assertEquals("Item 1", parsed.get(0));
        assertEquals("Item 2", parsed.get(1));
        assertEquals("Item 3", parsed.get(2));
    }

    private String serializeListHelper(List<String> list) {
        if (list == null || list.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<String> parseListHelper(String str) {
        if (str == null || str.isBlank()) {
            return Collections.emptyList();
        }
        if (str.trim().startsWith("[") && str.trim().endsWith("]")) {
            try {
                return objectMapper.readValue(
                    str, 
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {}
                );
            } catch (Exception e) {
                // fallback
            }
        }
        return Arrays.stream(str.split("[\n;]+"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toList());
    }
}
