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

class TransactionsPairedMigrationTest {

    private static final String CHANGELOG = "db/changelog/db.changelog-master.xml";
    private static final int CHANGESETS_BEFORE_008 = 7;

    @TempDir
    Path tempDir;

    private Connection connection;
    private Liquibase liquibase;

    @BeforeEach
    void migrateToVersion007() throws Exception {
        connection = DriverManager.getConnection("jdbc:sqlite:" + tempDir.resolve("test.db") + "?foreign_keys=true");
        Database database = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(connection));
        liquibase = new Liquibase(CHANGELOG, new ClassLoaderResourceAccessor(), database);
        liquibase.update(CHANGESETS_BEFORE_008, "");
    }

    @AfterEach
    void close() throws Exception {
        liquibase.close();
        connection.close();
    }

    @Test
    void existingTransactionsStayUnpaired() throws Exception {
        execute("INSERT INTO categories (id, name, color, direction, account_id) VALUES (1, 'Groceries', '#ff8000', 'EXPENSE', 1)");
        execute("INSERT INTO transactions (id, tx_date, amount, currency, description, category_id, account_id) VALUES (7, '2026-09-05', '-10.0000', 'CHF', 'Migros', 1, 1)");

        liquibase.update("");

        try (Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery("SELECT id, description, paired_transaction_id FROM transactions")) {
            assertTrue(rows.next());
            assertEquals(7, rows.getInt("id"));
            assertEquals("Migros", rows.getString("description"));
            assertEquals(0, rows.getInt("paired_transaction_id"));
            assertTrue(rows.wasNull());
        }
    }

    @Test
    void enforcesTheForeignKeyOfThePairColumn() throws Exception {
        execute("INSERT INTO categories (id, name, color, direction, account_id) VALUES (1, 'Groceries', '#ff8000', 'EXPENSE', 1)");

        liquibase.update("");

        assertThrows(SQLException.class, () -> execute(
                "INSERT INTO transactions (tx_date, amount, currency, description, category_id, account_id, paired_transaction_id) VALUES ('2026-09-05', '-1.0000', 'CHF', 'x', 1, 1, 99)"));
        execute("INSERT INTO transactions (id, tx_date, amount, currency, description, category_id, account_id) VALUES (1, '2026-09-05', '-1.0000', 'CHF', 'x', 1, 1)");
        execute("INSERT INTO transactions (tx_date, amount, currency, description, category_id, account_id, paired_transaction_id) VALUES ('2026-09-05', '1.0000', 'CHF', 'x', 1, 1, 1)");
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
