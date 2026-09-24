package ch.yoinc.cleard.transaction;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MonthSummaryResponseTest {

    @Test
    void countsAndSumsIncomeAndExpenseSeparately() {
        MonthSummaryResponse summary = summaryOf("+7450", "-1690", "-812.45");

        assertEquals(3, summary.count());
        assertEquals(1, summary.countIn());
        assertEquals(2, summary.countOut());
        assertBigDecimal("7450", summary.totalIn());
        assertBigDecimal("2502.45", summary.totalOut());
        assertBigDecimal("4947.55", summary.net());
    }

    @Test
    void allExpenseMonthHasNoIncome() {
        MonthSummaryResponse summary = summaryOf("-50", "-30");

        assertEquals(0, summary.countIn());
        assertEquals(2, summary.countOut());
        assertBigDecimal("0", summary.totalIn());
        assertBigDecimal("80", summary.totalOut());
        assertBigDecimal("-80", summary.net());
    }

    @Test
    void zeroAmountRowCountsButContributesToNeitherSide() {
        MonthSummaryResponse summary = summaryOf("0.00");

        assertEquals(1, summary.count());
        assertEquals(0, summary.countIn());
        assertEquals(0, summary.countOut());
        assertBigDecimal("0", summary.totalIn());
        assertBigDecimal("0", summary.totalOut());
    }

    @Test
    void emptyListSummarisesToZero() {
        MonthSummaryResponse summary = MonthSummaryResponse.from(List.of());

        assertEquals(0, summary.count());
        assertEquals(0, summary.countIn());
        assertEquals(0, summary.countOut());
        assertBigDecimal("0", summary.totalIn());
        assertBigDecimal("0", summary.totalOut());
        assertBigDecimal("0", summary.net());
    }

    private static MonthSummaryResponse summaryOf(String... amounts) {
        List<Transaction> rows = List.of(amounts).stream().map(MonthSummaryResponseTest::transaction).toList();
        return MonthSummaryResponse.from(rows);
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
}
