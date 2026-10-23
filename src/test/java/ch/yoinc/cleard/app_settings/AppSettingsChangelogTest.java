package ch.yoinc.cleard.app_settings;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = "cleard.app-version=v1.2.0")
@Transactional
class AppSettingsChangelogTest {

    @Autowired
    private AppSettingsController controller;

    @Autowired
    private AppSettingsRepository repository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void reportsTheCurrentVersionWithoutPrefix() {
        assertEquals("1.2.0", controller.getSettings().appVersion());
    }

    @Test
    void changelogIsUnseenOnAFreshInstall() {
        assertFalse(controller.getSettings().changelogSeen());
    }

    @Test
    void markingTheChangelogSeenStoresTheCurrentVersion() {
        controller.markChangelogSeen();
        entityManager.flush();

        assertEquals("1.2.0", repository.findById(AppSettings.CHANGELOG_SEEN_VERSION).orElseThrow().getValue());
        assertTrue(controller.getSettings().changelogSeen());
    }

    @Test
    void changelogIsUnseenAgainAfterAnUpgrade() {
        AppSettings seen = new AppSettings();
        seen.setKey(AppSettings.CHANGELOG_SEEN_VERSION);
        seen.setValue("1.1.0");
        repository.save(seen);
        entityManager.flush();

        assertFalse(controller.getSettings().changelogSeen());
    }
}
