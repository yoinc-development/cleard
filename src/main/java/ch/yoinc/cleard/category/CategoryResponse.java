package ch.yoinc.cleard.category;

import java.math.BigDecimal;

public record CategoryResponse(
        String id,
        String name,
        String colour,
        String direction,
        BigDecimal monthToDateTotal,
        long monthToDateCount,
        BigDecimal warningThreshold
) {
}
