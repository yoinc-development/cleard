package ch.yoinc.cleard.transaction;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DailySpendResponseTest {

    @Test
    void sumsMultipleExpensesOnTheSameDay() {
        List<Transaction> rows = List.of(
                transaction(LocalDate.of(2026, 9, 5), "-30.00"),
                transaction(LocalDate.of(2026, 9, 5), "-18.90")
        );

        List<DailySpendResponse> result = DailySpendResponse.listFrom(rows);

        assertEquals(1, result.size());
        assertEquals(LocalDate.of(2026, 9, 5), result.get(0).date());
        assertBigDecimal("48.90", result.get(0).totalOut());
    }

    @Test
    void excludesIncome() {
        List<Transaction> rows = List.of(
                transaction(LocalDate.of(2026, 9, 5), "-30.00"),
                transaction(LocalDate.of(2026, 9, 5), "1200.00")
        );

        List<DailySpendResponse> result = DailySpendResponse.listFrom(rows);

        assertEquals(1, result.size());
        assertBigDecimal("30.00", result.get(0).totalOut());
    }

    @Test
    void omitsADayWithNoExpense() {
        List<Transaction> rows = List.of(transaction(LocalDate.of(2026, 9, 5), "1200.00"));

        assertTrue(DailySpendResponse.listFrom(rows).isEmpty());
    }

    @Test
    void sortsByDateAscending() {
        List<Transaction> rows = List.of(
                transaction(LocalDate.of(2026, 9, 20), "-10"),
                transaction(LocalDate.of(2026, 9, 3), "-20"),
                transaction(LocalDate.of(2026, 9, 12), "-5")
        );

        List<DailySpendResponse> result = DailySpendResponse.listFrom(rows);

        assertEquals(
                List.of(LocalDate.of(2026, 9, 3), LocalDate.of(2026, 9, 12), LocalDate.of(2026, 9, 20)),
                result.stream().map(DailySpendResponse::date).toList()
        );
    }

    @Test
    void emptyListProducesNoEntries() {
        assertTrue(DailySpendResponse.listFrom(List.of()).isEmpty());
    }

    private static Transaction transaction(LocalDate date, String amount) {
        Transaction transaction = new Transaction();
        transaction.setTxDate(date);
        transaction.setAmount(new BigDecimal(amount));
        transaction.setCurrency("CHF");
        return transaction;
    }

    private static void assertBigDecimal(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual), () -> expected + " != " + actual);
    }
}
