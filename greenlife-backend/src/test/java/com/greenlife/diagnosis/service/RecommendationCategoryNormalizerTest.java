package com.greenlife.diagnosis.service;

import org.junit.jupiter.api.Test;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RecommendationCategoryNormalizerTest {

    @Test
    void testNormalize_ValidInputs() {
        assertEquals("PEST_CONTROL", RecommendationCategoryNormalizer.normalize("PEST_CONTROL"));
        assertEquals("PEST_CONTROL", RecommendationCategoryNormalizer.normalize("pest_control"));
        assertEquals("PEST_CONTROL", RecommendationCategoryNormalizer.normalize("pest-control"));
        assertEquals("PEST_CONTROL", RecommendationCategoryNormalizer.normalize(" Pest Control "));
        
        assertEquals("NUTRITION_AND_FERTILIZATION", RecommendationCategoryNormalizer.normalize("nutrition-and-fertilization"));
        assertEquals("WATERING_AND_DRAINAGE", RecommendationCategoryNormalizer.normalize("watering_and_drainage"));
    }

    @Test
    void testNormalize_InvalidAndNullInputs() {
        assertNull(RecommendationCategoryNormalizer.normalize(null));
        assertNull(RecommendationCategoryNormalizer.normalize(""));
        assertNull(RecommendationCategoryNormalizer.normalize("   "));
        assertNull(RecommendationCategoryNormalizer.normalize("UNKNOWN_CATEGORY"));
        assertNull(RecommendationCategoryNormalizer.normalize("phu-kien")); // Rejected, not in allowlist
    }

    @Test
    void testNormalizeList_Success() {
        List<String> raw = Arrays.asList("pest-control", "UNKNOWN", "  nutrition-and-fertilization ", "pest_control");
        List<String> normalized = RecommendationCategoryNormalizer.normalizeList(raw);
        
        assertEquals(2, normalized.size());
        assertEquals("PEST_CONTROL", normalized.get(0));
        assertEquals("NUTRITION_AND_FERTILIZATION", normalized.get(1));
    }

    @Test
    void testNormalizeList_EmptyOrNull() {
        assertTrue(RecommendationCategoryNormalizer.normalizeList(null).isEmpty());
        assertTrue(RecommendationCategoryNormalizer.normalizeList(Collections.emptyList()).isEmpty());
    }
}
