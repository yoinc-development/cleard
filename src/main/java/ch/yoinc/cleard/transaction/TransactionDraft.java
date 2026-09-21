package ch.yoinc.cleard.transaction;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class TransactionDraft {

    private Long id;

    private LocalDate txDate;

    private BigDecimal amount;

    private String currency;

    private String description;

    private Long categoryId;
}
