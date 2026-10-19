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

class AccountsMigrationTest {

    private static final String CHANGELOG = "db/changelog/db.changelog-master.xml";
    private static final int CHANGESETS_BEFORE_006 = 5;

    @TempDir
    Path tempDir;

    private Connection connection;
    private Liquibase liquibase;

    @BeforeEach
    void migrateToVersion005() throws Exception {
        connection = DriverManager.getConnection("jdbc:sqlite:" + tempDir.resolve("test.db") + "?foreign_keys=true");
        Database database = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(connection));
        liquibase = new Liquibase(CHANGELOG, new ClassLoaderResourceAccessor(), database);
        liquibase.update(CHANGESETS_BEFORE_006, "");
    }

    @AfterEach
    void close() throws Exception {
        liquibase.close();
        connection.close();
    }

    @Test
    void movesEveryExistingTransactionToTheDefaultAccount() throws Exception {
        execute("INSERT INTO categories (id, name, color, direction) VALUES (1, 'Groceries', '#ff8000', 'EXPENSE')");
        execute("INSERT INTO transactions (id, tx_date, amount, currency, description, category_id) VALUES (7, '2026-09-05', '-10.0000', 'CHF', 'Migros', 1)");
        execute("INSERT INTO transactions (id, tx_date, amount, currency, description, category_id) VALUES (9, '2026-09-06', '-4.5000', 'CHF', 'Coop', 1)");

        liquibase.update("");

        try (Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery(
                     "SELECT t.id, t.amount, t.description, t.category_id, a.name FROM transactions t JOIN accounts a ON a.id = t.account_id ORDER BY t.id")) {
            assertTrue(rows.next());
            assertEquals(7, rows.getInt("id"));
            assertEquals("-10.0000", rows.getString("amount"));
            assertEquals("Migros", rows.getString("description"));
            assertEquals(1, rows.getInt("category_id"));
            assertEquals("Default", rows.getString("name"));

            assertTrue(rows.next());
            assertEquals(9, rows.getInt("id"));
            assertEquals("Default", rows.getString("name"));
        }
    }

    @Test
    void seedsExactlyOneDefaultAccountEvenWithoutTransactions() throws Exception {
        liquibase.update("");

        try (Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery("SELECT name, icon FROM accounts")) {
            assertTrue(rows.next());
            assertEquals("Default", rows.getString("name"));
            assertEquals("bank", rows.getString("icon"));
            assertTrue(!rows.next());
        }
    }

    @Test
    void requiresAnExistingAccountOnNewTransactions() throws Exception {
        execute("INSERT INTO categories (id, name, color, direction) VALUES (1, 'Groceries', '#ff8000', 'EXPENSE')");

        liquibase.update("");

        assertThrows(SQLException.class, () -> execute(
                "INSERT INTO transactions (tx_date, amount, currency, description, category_id, account_id) VALUES ('2026-09-05', '-1.0000', 'CHF', 'x', 1, NULL)"));
        assertThrows(SQLException.class, () -> execute(
                "INSERT INTO transactions (tx_date, amount, currency, description, category_id, account_id) VALUES ('2026-09-05', '-1.0000', 'CHF', 'x', 1, 99)"));
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
