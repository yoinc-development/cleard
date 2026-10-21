package ch.yoinc.cleard.persistence;

import liquibase.Liquibase;
import liquibase.database.Database;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.resource.ClassLoaderResourceAccessor;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TransactionTagsMigrationTest {

    private static final String CHANGELOG = "db/changelog/db.changelog-master.xml";
    private static final int CHANGESETS_BEFORE_009 = 8;

    @TempDir
    Path tempDir;

    private Connection connection;
    private Liquibase liquibase;

    @BeforeEach
    void migrateToVersion008() throws Exception {
        connection = DriverManager.getConnection("jdbc:sqlite:" + tempDir.resolve("test.db") + "?foreign_keys=true");
        Database database = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(connection));
        liquibase = new Liquibase(CHANGELOG, new ClassLoaderResourceAccessor(), database);
        liquibase.update(CHANGESETS_BEFORE_009, "");
    }

    @AfterEach
    void close() throws Exception {
        liquibase.close();
        connection.close();
    }

    @Test
    void existingTransactionsAreKeptAndHaveNoTags() throws Exception {
        execute("INSERT INTO categories (id, name, color, direction, account_id) VALUES (1, 'Groceries', '#ff8000', 'EXPENSE', 1)");
        execute("INSERT INTO transactions (id, tx_date, amount, currency, description, category_id, account_id) VALUES (7, '2026-09-05', '-10.0000', 'CHF', 'Migros', 1, 1)");

        liquibase.update("");

        assertEquals(1, count("SELECT COUNT(*) FROM transactions"));
        assertEquals(0, count("SELECT COUNT(*) FROM transaction_tags"));
    }

    @Test
    void enforcesTheForeignKeyAndTheUniquenessOfATransactionsTag() throws Exception {
        execute("INSERT INTO categories (id, name, color, direction, account_id) VALUES (1, 'Groceries', '#ff8000', 'EXPENSE', 1)");
        execute("INSERT INTO transactions (id, tx_date, amount, currency, description, category_id, account_id) VALUES (7, '2026-09-05', '-10.0000', 'CHF', 'Migros', 1, 1)");

        liquibase.update("");

        assertThrows(SQLException.class, () -> execute("INSERT INTO transaction_tags (transaction_id, name) VALUES (99, 'weekly')"));
        execute("INSERT INTO transaction_tags (transaction_id, name) VALUES (7, 'weekly')");
        assertThrows(SQLException.class, () -> execute("INSERT INTO transaction_tags (transaction_id, name) VALUES (7, 'weekly')"));
    }

    @Test
    void deletingATransactionCascadesToItsTags() throws Exception {
        execute("INSERT INTO categories (id, name, color, direction, account_id) VALUES (1, 'Groceries', '#ff8000', 'EXPENSE', 1)");
        execute("INSERT INTO transactions (id, tx_date, amount, currency, description, category_id, account_id) VALUES (7, '2026-09-05', '-10.0000', 'CHF', 'Migros', 1, 1)");
        liquibase.update("");
        execute("INSERT INTO transaction_tags (transaction_id, name) VALUES (7, 'weekly')");

        execute("DELETE FROM transactions WHERE id = 7");

        assertEquals(0, count("SELECT COUNT(*) FROM transaction_tags"));
    }

    private int count(String sql) throws SQLException {
        try (Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery(sql)) {
            assertTrue(rows.next());
            return rows.getInt(1);
        }
    }

    private void execute(String sql) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
        if (!connection.getAutoCommit()) {
            connection.commit();
        }
    }
}
