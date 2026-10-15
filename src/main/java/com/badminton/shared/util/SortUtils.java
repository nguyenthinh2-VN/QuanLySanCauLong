package com.badminton.shared.util;

import com.badminton.shared.exception.AppException;
import com.badminton.shared.exception.ErrorCode;
import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;

import java.util.Set;

/**
 * Utility helper class for parsing and validating Sort parameters with whitelist validation.
 * Prevents internal server errors (500) caused by invalid sorting property names.
 */
public final class SortUtils {

    private SortUtils() {
        // Private constructor for utility class
    }

    /**
     * Parses a sort string and validates the sort property against an allowed whitelist.
     *
     * @param sort              the sort parameter (e.g., "name,asc" or "createdAt,desc")
     * @param defaultProperty   the default entity property to sort by if sort is empty
     * @param allowedProperties the set of allowed entity property names for sorting
     * @return the resolved {@link Sort} instance
     * @throws AppException with {@link ErrorCode#INVALID_SORT_FIELD} if the property is not in the whitelist
     */
    public static Sort parseSort(String sort, String defaultProperty, Set<String> allowedProperties) {
        return parseSort(sort, defaultProperty, Sort.Direction.DESC, allowedProperties);
    }

    /**
     * Parses a sort string with explicit default direction and validates against a whitelist.
     *
     * @param sort              the sort parameter (e.g., "name,asc" or "createdAt,desc")
     * @param defaultProperty   the default entity property to sort by if sort is empty
     * @param defaultDirection  the default sort direction (ASC or DESC)
     * @param allowedProperties the set of allowed entity property names for sorting
     * @return the resolved {@link Sort} instance
     * @throws AppException with {@link ErrorCode#INVALID_SORT_FIELD} if the property is not in the whitelist
     */
    public static Sort parseSort(String sort, String defaultProperty, Sort.Direction defaultDirection,
            Set<String> allowedProperties) {
        if (!StringUtils.hasText(sort)) {
            return Sort.by(defaultDirection, defaultProperty);
        }

        String[] parts = sort.split(",");
        String property = parts[0].trim();

        if (allowedProperties != null && !allowedProperties.contains(property)) {
            throw new AppException(ErrorCode.INVALID_SORT_FIELD,
                    "Trường sắp xếp không hợp lệ: '" + property + "'. Các trường hợp lệ: " + allowedProperties);
        }

        Sort.Direction direction = (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return Sort.by(direction, property);
    }
}
