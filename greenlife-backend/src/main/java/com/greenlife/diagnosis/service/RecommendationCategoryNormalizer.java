package com.greenlife.diagnosis.service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class RecommendationCategoryNormalizer {

    private static final Set<String> ALLOWED_CATEGORIES = Arrays.stream(new String[]{
            "PLANT_HEALTH_INSPECTION",
            "EXPERT_CONSULTATION",
            "PEST_CONTROL",
            "FUNGAL_DISEASE_CARE",
            "NUTRITION_AND_FERTILIZATION",
            "WATERING_AND_DRAINAGE",
            "SOIL_AND_ROOT_CARE",
            "PRUNING_AND_RECOVERY",
            "GENERAL_PLANT_CARE"
    }).collect(Collectors.toSet());

    /**
     * Normalizes a raw category string.
     * E.g. "pest-control" or "Pest Control" -> "PEST_CONTROL"
     * Returns null if the category is not recognized.
     */
    public static String normalize(String rawCategory) {
        if (rawCategory == null) {
            return null;
        }
        // 1. Trim and convert to upper case
        String clean = rawCategory.trim().toUpperCase();
        // 2. Replace hyphens and spaces with underscores
        clean = clean.replace("-", "_").replace(" ", "_");
        // 3. Match against the allowlist
        if (ALLOWED_CATEGORIES.contains(clean)) {
            return clean;
        }
        return null;
    }

    /**
     * Normalizes a list of raw categories, filtering out unknown ones.
     */
    public static List<String> normalizeList(List<String> rawList) {
        if (rawList == null) {
            return Collections.emptyList();
        }
        return rawList.stream()
                .map(RecommendationCategoryNormalizer::normalize)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }
}
