package ch.yoinc.cleard.transaction;

import ch.yoinc.cleard.account.Account;
import ch.yoinc.cleard.category.Category;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public Transaction create(Transaction transaction) {
        Transaction saved = transactionRepository.save(transaction);
        syncPair(saved);
        return saved;
    }

    @Transactional
    public Transaction update(Long id, Transaction changes) {
        Transaction transaction = transactionRepository.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Transaction " + id + " not found"));

        transaction.setTxDate(changes.getTxDate());
        transaction.setAmount(changes.getAmount());
        transaction.setCurrency(changes.getCurrency());
        transaction.setDescription(changes.getDescription());
        transaction.setCategory(changes.getCategory());
        transaction.setAccount(changes.getAccount());
        replaceTags(transaction, changes.getTags());
        transactionRepository.save(transaction);

        syncPair(transaction);
        return transaction;
    }

    @Transactional
    public void delete(Long id) {
        transactionRepository.findById(id).ifPresent(transaction -> {
            removePair(transaction);
            transactionRepository.delete(transaction);
        });
    }

    @Transactional
    public void reassignCategory(Long transactionId, Long fromCategoryId, Category target) {
        transactionRepository.findById(transactionId)
                .filter(transaction -> transaction.getCategory().getId().equals(fromCategoryId))
                .ifPresent(transaction -> {
                    transaction.setCategory(target);
                    transactionRepository.save(transaction);
                    syncPair(transaction);
                });
    }

    private void syncPair(Transaction transaction) {
        Category category = transaction.getCategory();
        Account target = category.getTargetAccount();
        Category counterpartCategory = category.getCounterpart();

        if (target == null || counterpartCategory == null) {
            removePair(transaction);
            return;
        }

        Transaction pair = transaction.getPairedTransaction() != null ? transaction.getPairedTransaction() : new Transaction();
        pair.setTxDate(transaction.getTxDate());
        pair.setAmount(transaction.getAmount().negate());
        pair.setCurrency(transaction.getCurrency());
        pair.setDescription(transaction.getDescription());
        pair.setCategory(counterpartCategory);
        pair.setAccount(target);
        replaceTags(pair, transaction.getTags());
        pair.setPairedTransaction(transaction);
        pair = transactionRepository.save(pair);

        transaction.setPairedTransaction(pair);
        transactionRepository.save(transaction);
    }

    private void replaceTags(Transaction transaction, Set<String> tags) {
        Set<String> copy = new HashSet<>(tags);
        transaction.getTags().clear();
        transaction.getTags().addAll(copy);
    }

    private void removePair(Transaction transaction) {
        Transaction pair = transaction.getPairedTransaction();
        if (pair == null) {
            return;
        }
        transaction.setPairedTransaction(null);
        pair.setPairedTransaction(null);
        transactionRepository.saveAll(List.of(transaction, pair));
        transactionRepository.flush();
        transactionRepository.delete(pair);
    }
}
