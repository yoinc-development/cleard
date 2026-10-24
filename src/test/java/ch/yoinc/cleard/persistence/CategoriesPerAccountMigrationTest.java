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

class CategoriesPerAccountMigrationTest {

    private static final String CHANGELOG = "db/changelog/db.changelog-master.xml";
    private static final int CHANGESETS_BEFORE_007 = 6;

    @TempDir
    Path tempDir;

    private Connection connection;
    private Liquibase liquibase;

    @BeforeEach
    void migrateToVersion006() throws Exception {
        connection = DriverManager.getConnection("jdbc:sqlite:" + tempDir.resolve("test.db") + "?foreign_keys=true");
        Database database = DatabaseFactory.getInstance().findCorrectDatabaseImplementation(new JdbcConnection(connection));
        liquibase = new Liquibase(CHANGELOG, new ClassLoaderResourceAccessor(), database);
        liquibase.update(CHANGESETS_BEFORE_007, "");
    }

    @AfterEach
    void close() throws Exception {
        liquibase.close();
        connection.close();
    }

    @Test
    void movesEveryExistingCategoryToTheDefaultAccount() throws Exception {
        execute("INSERT INTO categories (id, name, color, direction) VALUES (1, 'Groceries', '#ff8000', 'EXPENSE')");
        execute("INSERT INTO categories (id, name, color, direction) VALUES (2, 'Salary', '#00ff80', 'INCOME')");
        execute("INSERT INTO transactions (id, tx_date, amount, currency, description, category_id, account_id) VALUES (7, '2026-09-05', '-10.0000', 'CHF', 'Migros', 1, 1)");

        liquibase.update("");

        try (Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery(
                     "SELECT c.id, c.name, c.target_account_id, c.counterpart_id, a.name AS account FROM categories c JOIN accounts a ON a.id = c.account_id ORDER BY c.id")) {
            assertTrue(rows.next());
            assertEquals("Groceries", rows.getString("name"));
            assertEquals("Default", rows.getString("account"));
            assertEquals(0, rows.getInt("target_account_id"));
            assertTrue(rows.wasNull());
            assertEquals(0, rows.getInt("counterpart_id"));
            assertTrue(rows.wasNull());

            assertTrue(rows.next());
            assertEquals("Salary", rows.getString("name"));
            assertEquals("Default", rows.getString("account"));
        }
        try (Statement statement = connection.createStatement();
             ResultSet rows = statement.executeQuery("SELECT COUNT(*) FROM transactions")) {
            assertTrue(rows.next());
            assertEquals(1, rows.getInt(1));
        }
    }

    @Test
    void enforcesTheForeignKeysOfTheNewColumns() throws Exception {
        liquibase.update("");

        assertThrows(SQLException.class, () -> execute(
                "INSERT INTO categories (name, color, direction, account_id) VALUES ('X', '#ff8000', 'EXPENSE', 99)"));
        assertThrows(SQLException.class, () -> execute(
                "INSERT INTO categories (name, color, direction, account_id, target_account_id) VALUES ('X', '#ff8000', 'EXPENSE', 1, 99)"));
        assertThrows(SQLException.class, () -> execute(
                "INSERT INTO categories (name, color, direction, account_id, counterpart_id) VALUES ('X', '#ff8000', 'EXPENSE', 1, 99)"));

        execute("INSERT INTO categories (name, color, direction, account_id) VALUES ('X', '#ff8000', 'EXPENSE', 1)");
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
