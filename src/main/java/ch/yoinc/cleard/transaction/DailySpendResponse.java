package ch.yoinc.cleard.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public record DailySpendResponse(LocalDate date, BigDecimal totalOut) {

    public static List<DailySpendResponse> listFrom(List<Transaction> rows) {
        Map<LocalDate, BigDecimal> totalsByDay = new TreeMap<>();
        for (Transaction row : rows) {
            BigDecimal amount = row.getAmount();
            if (amount.signum() < 0) {
                totalsByDay.merge(row.getTxDate(), amount.negate(), BigDecimal::add);
            }
        }
        return totalsByDay.entrySet().stream()
                .map(entry -> new DailySpendResponse(entry.getKey(), entry.getValue()))
                .toList();
    }
}
