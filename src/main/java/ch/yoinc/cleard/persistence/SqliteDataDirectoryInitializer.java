package ch.yoinc.cleard.persistence;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Creates the SQLite data file's parent directory before the datasource bean is built.
 * jpackage installs to a machine where {@code ~/.cleard} has never existed.
 */
@Component
public class SqliteDataDirectoryInitializer implements BeanFactoryPostProcessor, EnvironmentAware {

    private static final String JDBC_SQLITE_PREFIX = "jdbc:sqlite:";

    private Environment environment;

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        Path dbFile = resolveFilePath(environment.getProperty("spring.datasource.url"));
        if (dbFile == null) {
            return;
        }
        try {
            Files.createDirectories(dbFile.toAbsolutePath().getParent());
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to create SQLite data directory for " + dbFile, e);
        }
    }

    private static Path resolveFilePath(String jdbcUrl) {
        if (jdbcUrl == null || !jdbcUrl.startsWith(JDBC_SQLITE_PREFIX)) {
            return null;
        }
        String rest = jdbcUrl.substring(JDBC_SQLITE_PREFIX.length());
        int queryIndex = rest.indexOf('?');
        String path = queryIndex >= 0 ? rest.substring(0, queryIndex) : rest;
        if (path.isBlank() || path.startsWith("file:") || path.equals(":memory:")) {
            return null;
        }
        return Path.of(path);
    }
}
