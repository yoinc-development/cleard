package ch.yoinc.cleard.persistence;

import liquibase.Liquibase;
import liquibase.database.Database;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.exception.LiquibaseException;
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

class TransactionsNotNullMigrationTest {

    private static final String CHANGELOG = "db/changelog/db.changelog-master.xml";
    private static final int CHANGESETS_BEFORE_005 = 4;
    private static final int CHANGESETS_IN_005 = 1;

    @TempDir
    Path tempDir;

    private Connection connection;
    private Liquibase liquibase;

    @BeforeEach
    void migrateToVersion004() throws Exception {
        connection = DriverManager.getConnection("jdbc:sqlite:" + tempDir.resolve("test.db") + "?foreign_keys=true");
        Database database = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(connection));
        liquibase = new Liquibase(CHANGELOG, new ClassLoaderResourceAccessor(), database);
        liquibase.update(CHANGESETS_BEFORE_005, "");
    }

    @AfterEach
    void close() throws Exception {
        liquibase.close();
        connection.close();
    }

    @Test
    void keepsRowsAndFillsInAMissingDescription() throws Exception {
        execute("INSERT INTO categories (id, name, color, direction) VALUES (1, 'Groceries', '#ff8000', 'EXPENSE')");
        execute("INSERT INTO transactions (id, tx_date, amount, currency, description, category_id) VALUES (7, '2026-09-05', '-10.0000', 'CHF', 'Migros', 1)");
        execute("INSERT INTO transactions (id, tx_date, amount, currency, description, category_id) VALUES (9, '2026-09-06', '-4.5000', 'CHF', NULL, 1)");

        liquibase.update(CHANGESETS_IN_005, "");

        try (Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery("SELECT id, tx_date, amount, currency, description, category_id FROM transactions ORDER BY id")) {
            assertTrue(rows.next());
            assertEquals(7, rows.getInt("id"));
            assertEquals("2026-09-05", rows.getString("tx_date"));
            assertEquals("-10.0000", rows.getString("amount"));
            assertEquals("CHF", rows.getString("currency"));
            assertEquals("Migros", rows.getString("description"));
            assertEquals(1, rows.getInt("category_id"));

            assertTrue(rows.next());
            assertEquals(9, rows.getInt("id"));
            assertEquals("(no description)", rows.getString("description"));
        }
    }

    @Test
    void enforcesTheNewConstraintsAndKeepsIdsAutoIncrementing() throws Exception {
        execute("INSERT INTO categories (id, name, color, direction) VALUES (1, 'Groceries', '#ff8000', 'EXPENSE')");
        execute("INSERT INTO transactions (id, tx_date, amount, currency, description, category_id) VALUES (7, '2026-09-05', '-10.0000', 'CHF', 'Migros', 1)");

        liquibase.update(CHANGESETS_IN_005, "");

        assertThrows(SQLException.class, () -> execute(
                "INSERT INTO transactions (tx_date, amount, currency, description, category_id) VALUES ('2026-09-05', '-1.0000', 'CHF', 'x', NULL)"));
        assertThrows(SQLException.class, () -> execute(
                "INSERT INTO transactions (tx_date, amount, currency, description, category_id) VALUES ('2026-09-05', '-1.0000', 'CHF', NULL, 1)"));
        assertThrows(SQLException.class, () -> execute(
                "INSERT INTO transactions (tx_date, amount, currency, description, category_id) VALUES ('2026-09-05', '-1.0000', 'CHF', 'x', 99)"));

        execute("INSERT INTO transactions (tx_date, amount, currency, description, category_id) VALUES ('2026-09-05', '-1.0000', 'CHF', 'x', 1)");
        try (Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery("SELECT MAX(id) FROM transactions")) {
            assertTrue(rows.next());
            assertEquals(8, rows.getInt(1));
        }
    }

    @Test
    void haltsWhenATransactionHasNoCategory() throws Exception {
        execute("INSERT INTO transactions (id, tx_date, amount, currency, description, category_id) VALUES (7, '2026-09-05', '-10.0000', 'CHF', 'Migros', NULL)");

        LiquibaseException exception = assertThrows(LiquibaseException.class, () -> liquibase.update(CHANGESETS_IN_005, ""));

        assertTrue(exception.getMessage().contains("category"), exception.getMessage());
        // the old table is untouched
        try (Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery("SELECT COUNT(*) FROM transactions")) {
            assertTrue(rows.next());
            assertEquals(1, rows.getInt(1));
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
