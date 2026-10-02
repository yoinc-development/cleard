package ch.yoinc.cleard.app_settings;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class VersionServiceTest {

    private static final String RELEASE_URL = "https://github.com/yoinc-development/cleard/releases/tag/v1.1.0";

    private final GitHubReleaseClient client = mock(GitHubReleaseClient.class);
    private final MutableClock clock = new MutableClock();

    private VersionService service(String currentVersion) {
        return new VersionService(client, currentVersion, clock);
    }

    private void latestRelease(String tag) {
        when(client.fetchLatestRelease()).thenReturn(Optional.of(new GitHubReleaseClient.Release(tag, RELEASE_URL)));
    }

    @Test
    void reportsAnUpdateWhenTheLatestReleaseIsNewer() {
        latestRelease("v1.1.0");

        assertEquals(new AppVersionResponse("1.0.0", "1.1.0", true, RELEASE_URL), service("1.0.0").getVersionInfo());
    }

    @Test
    void reportsNoUpdateWhenAlreadyOnTheLatestRelease() {
        latestRelease("v1.1.0");

        AppVersionResponse response = service("1.1.0").getVersionInfo();

        assertFalse(response.updateAvailable());
        assertEquals("1.1.0", response.latest());
    }

    @Test
    void reportsNoUpdateWhenRunningNewerThanTheLatestRelease() {
        latestRelease("v1.1.0");

        assertFalse(service("1.2.0").getVersionInfo().updateAvailable());
    }

    @Test
    void withoutAnInstalledVersionNothingIsCheckedAndGitHubIsNotCalled() {
        AppVersionResponse response = service("").getVersionInfo();

        assertEquals(new AppVersionResponse(null, null, false, null), response);
        verify(client, never()).fetchLatestRelease();
    }

    @Test
    void whenTheLatestReleaseIsUnknownOnlyTheCurrentVersionIsReported() {
        when(client.fetchLatestRelease()).thenReturn(Optional.empty());

        assertEquals(new AppVersionResponse("1.0.0", null, false, null), service("1.0.0").getVersionInfo());
    }

    @Test
    void cachesASuccessfulLookup() {
        latestRelease("v1.1.0");
        VersionService service = service("1.0.0");

        service.getVersionInfo();
        clock.advance(VersionService.SUCCESS_TTL.minusSeconds(1));
        service.getVersionInfo();
        verify(client, times(1)).fetchLatestRelease();

        clock.advance(Duration.ofSeconds(2));
        service.getVersionInfo();
        verify(client, times(2)).fetchLatestRelease();
    }

    @Test
    void retriesAFailedLookupSoonerThanASuccessfulOne() {
        when(client.fetchLatestRelease()).thenReturn(Optional.empty());
        VersionService service = service("1.0.0");

        service.getVersionInfo();
        clock.advance(VersionService.FAILURE_TTL.minusSeconds(1));
        service.getVersionInfo();
        verify(client, times(1)).fetchLatestRelease();

        latestRelease("v1.1.0");
        clock.advance(Duration.ofSeconds(2));
        assertTrue(service.getVersionInfo().updateAvailable());
        verify(client, times(2)).fetchLatestRelease();
    }

    @Test
    void comparesVersionsNumericallyNotAsText() {
        assertTrue(VersionService.isNewer("1.10.0", "1.9.0"));
        assertTrue(VersionService.isNewer("2.0.0", "1.99.99"));
        assertFalse(VersionService.isNewer("1.9.0", "1.10.0"));
    }

    @Test
    void treatsMissingTrailingSegmentsAsZeroAndIgnoresAPrefix() {
        assertFalse(VersionService.isNewer("1.2", "1.2.0"));
        assertFalse(VersionService.isNewer("v1.2.0", "1.2.0"));
        assertTrue(VersionService.isNewer("1.2.1", "1.2"));
    }

    @Test
    void ignoresPreReleaseAndBuildSuffixes() {
        assertFalse(VersionService.isNewer("1.2.0", "1.2.0-SNAPSHOT"));
        assertTrue(VersionService.isNewer("1.3.0", "1.2.0+build.5"));
    }

    @Test
    void neverCallsAnUnparseableVersionNewer() {
        assertFalse(VersionService.isNewer("nightly", "1.0.0"));
        assertFalse(VersionService.isNewer("1.0.0", "unknown"));
        assertFalse(VersionService.isNewer("", "1.0.0"));
    }

    private static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-10-02T12:00:00Z");

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
