package ch.yoinc.cleard.transaction;

import java.math.BigDecimal;
import java.util.List;

public record MonthSummaryResponse(long count, long countIn, long countOut, BigDecimal totalIn, BigDecimal totalOut,
                                   BigDecimal net) {

    public static MonthSummaryResponse from(List<Transaction> rows) {
        BigDecimal totalIn = BigDecimal.ZERO;
        BigDecimal totalOut = BigDecimal.ZERO;
        long countIn = 0;
        long countOut = 0;
        for (Transaction row : rows) {
            BigDecimal amount = row.getAmount();
            int signum = amount.signum();
            if (signum > 0) {
                totalIn = totalIn.add(amount);
                countIn++;
            } else if (signum < 0) {
                totalOut = totalOut.add(amount.negate());
                countOut++;
            }
        }
        BigDecimal net = totalIn.subtract(totalOut);
        return new MonthSummaryResponse(rows.size(), countIn, countOut, totalIn, totalOut, net);
    }
}
