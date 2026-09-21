package ch.yoinc.cleard.category;

import ch.yoinc.cleard.transaction.Transaction;

import java.math.BigDecimal;
import java.util.List;

record MonthToDateTotals(BigDecimal in, BigDecimal out, BigDecimal net, long count) {

    static MonthToDateTotals of(List<Transaction> rows, String direction) {
        BigDecimal in = BigDecimal.ZERO;
        BigDecimal out = BigDecimal.ZERO;
        for (Transaction row : rows) {
            BigDecimal amount = row.getAmount();
            int signum = amount.signum();
            if (signum > 0) {
                in = in.add(amount);
            } else if (signum < 0) {
                out = out.add(amount.negate());
            }
        }
        BigDecimal net = isIncome(direction) ? in.subtract(out) : out.subtract(in);
        return new MonthToDateTotals(in, out, net, rows.size());
    }

    /**
     * {@code direction} is a free-text column; anything other than "INCOME"
     * (case/whitespace-insensitive) nets as an expense. Don't think this will change in the future.
     */
    private static boolean isIncome(String direction) {
        return direction != null && "INCOME".equalsIgnoreCase(direction.trim());
    }
}
