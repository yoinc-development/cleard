package ch.yoinc.cleard.transaction;

import java.math.BigDecimal;
import java.util.List;

public record MonthSummaryResponse(long count, BigDecimal totalIn, BigDecimal totalOut, BigDecimal net) {

    public static MonthSummaryResponse from(List<Transaction> rows) {
        BigDecimal totalIn = BigDecimal.ZERO;
        BigDecimal totalOut = BigDecimal.ZERO;
        for (Transaction row : rows) {
            BigDecimal amount = row.getAmount();
            int signum = amount.signum();
            if (signum > 0) {
                totalIn = totalIn.add(amount);
            } else if (signum < 0) {
                totalOut = totalOut.add(amount.negate());
            }
        }
        BigDecimal net = totalIn.subtract(totalOut);
        return new MonthSummaryResponse(rows.size(), totalIn, totalOut, net);
    }
}
