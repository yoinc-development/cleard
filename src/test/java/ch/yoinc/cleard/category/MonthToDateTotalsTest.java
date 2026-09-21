package ch.yoinc.cleard.category;

import ch.yoinc.cleard.transaction.Transaction;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MonthToDateTotalsTest {

    @Test
    void netsAnExpenseCategoryByOffsettingIncome() {
        MonthToDateTotals totals = totalsOf("EXPENSE", "-50", "+30");

        assertBigDecimal("50", totals.out());
        assertBigDecimal("30", totals.in());
        assertBigDecimal("20", totals.net());
        assertEquals(2, totals.count());
    }

    @Test
    void netsAnIncomeCategoryByOffsettingExpense() {
        MonthToDateTotals totals = totalsOf("INCOME", "+100", "-25");

        assertBigDecimal("100", totals.in());
        assertBigDecimal("25", totals.out());
        assertBigDecimal("75", totals.net());
        assertEquals(2, totals.count());
    }

    @Test
    void doesNotClampANegativeNet() {
        MonthToDateTotals totals = totalsOf("EXPENSE", "-10", "+30");

        assertBigDecimal("-20", totals.net());
    }

    @Test
    void unrecognisedOrMissingDirectionNetsAsExpense() {
        for (String direction : new String[] {null, "", "expense", "banana"}) {
            MonthToDateTotals totals = totalsOf(direction, "-50", "+30");
            assertBigDecimal("20", totals.net(), "direction=" + direction);
        }
    }

    @Test
    void directionMatchingIsCaseAndWhitespaceInsensitive() {
        for (String direction : new String[] {"income", " INCOME "}) {
            MonthToDateTotals totals = totalsOf(direction, "+100", "-25");
            assertBigDecimal("75", totals.net(), "direction=" + direction);
        }
    }

    @Test
    void emptyListNetsToZero() {
        MonthToDateTotals totals = MonthToDateTotals.of(List.of(), "EXPENSE");

        assertBigDecimal("0", totals.in());
        assertBigDecimal("0", totals.out());
        assertBigDecimal("0", totals.net());
        assertEquals(0, totals.count());
    }

    @Test
    void zeroAmountRowCountsButContributesToNeitherSide() {
        MonthToDateTotals totals = totalsOf("EXPENSE", "0.00");

        assertBigDecimal("0", totals.in());
        assertBigDecimal("0", totals.out());
        assertEquals(1, totals.count());
    }

    @Test
    void sumsFractionalOutflowsExactly() {
        MonthToDateTotals totals = totalsOf("EXPENSE", "-0.10", "-0.20");

        assertBigDecimal("0.30", totals.out());
    }

    private static MonthToDateTotals totalsOf(String direction, String... amounts) {
        List<Transaction> rows = List.of(amounts).stream().map(MonthToDateTotalsTest::transaction).toList();
        return MonthToDateTotals.of(rows, direction);
    }

    private static Transaction transaction(String amount) {
        Transaction transaction = new Transaction();
        transaction.setTxDate(LocalDate.of(2026, 9, 1));
        transaction.setAmount(new BigDecimal(amount));
        transaction.setCurrency("CHF");
        return transaction;
    }

    private static void assertBigDecimal(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual), () -> expected + " != " + actual);
    }

    private static void assertBigDecimal(String expected, BigDecimal actual, String message) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual), () -> message + ": " + expected + " != " + actual);
    }
}
