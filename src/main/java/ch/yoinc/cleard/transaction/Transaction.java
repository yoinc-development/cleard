package ch.yoinc.cleard.transaction;

import ch.yoinc.cleard.account.Account;
import ch.yoinc.cleard.category.Category;
import ch.yoinc.cleard.persistence.BigDecimalStringConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate txDate;

    @Convert(converter = BigDecimalStringConverter.class)
    @Column(nullable = false, length = 40)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, length = 512)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paired_transaction_id")
    private Transaction pairedTransaction;
}
