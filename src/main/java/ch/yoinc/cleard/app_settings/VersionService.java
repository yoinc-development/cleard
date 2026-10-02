package ch.yoinc.cleard.app_settings;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
public class VersionService {

    static final Duration SUCCESS_TTL = Duration.ofHours(1);
    static final Duration FAILURE_TTL = Duration.ofMinutes(5);

    private final GitHubReleaseClient releaseClient;
    private final String currentVersion;
    private final Clock clock;

    private Optional<GitHubReleaseClient.Release> cachedLatest = Optional.empty();
    private Instant cacheValidUntil = Instant.MIN;

    @Autowired
    public VersionService(GitHubReleaseClient releaseClient, @Value("${cleard.app-version:}") String currentVersion) {
        this(releaseClient, currentVersion, Clock.systemUTC());
    }

    VersionService(GitHubReleaseClient releaseClient, String currentVersion, Clock clock) {
        this.releaseClient = releaseClient;
        this.currentVersion = stripPrefix(currentVersion);
        this.clock = clock;
    }

    public AppVersionResponse getVersionInfo() {
        if (currentVersion.isEmpty()) {
            return new AppVersionResponse(null, null, false, null);
        }
        Optional<GitHubReleaseClient.Release> release = latestRelease();
        if (release.isEmpty()) {
            return new AppVersionResponse(currentVersion, null, false, null);
        }
        String latest = stripPrefix(release.get().tag());
        return new AppVersionResponse(currentVersion, latest, isNewer(latest, currentVersion), release.get().url());
    }

    private synchronized Optional<GitHubReleaseClient.Release> latestRelease() {
        Instant now = clock.instant();
        if (now.isBefore(cacheValidUntil)) {
            return cachedLatest;
        }
        cachedLatest = releaseClient.fetchLatestRelease();
        cacheValidUntil = now.plus(cachedLatest.isPresent() ? SUCCESS_TTL : FAILURE_TTL);
        return cachedLatest;
    }

    static boolean isNewer(String latest, String current) {
        int[] latestParts = parse(latest);
        int[] currentParts = parse(current);
        if (latestParts == null || currentParts == null) {
            return false;
        }
        for (int i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
            int a = i < latestParts.length ? latestParts[i] : 0;
            int b = i < currentParts.length ? currentParts[i] : 0;
            if (a != b) {
                return a > b;
            }
        }
        return false;
    }

    private static int[] parse(String version) {
        String core = stripPrefix(version);
        int suffix = core.indexOf('-');
        if (suffix >= 0) core = core.substring(0, suffix);
        suffix = core.indexOf('+');
        if (suffix >= 0) core = core.substring(0, suffix);
        if (core.isEmpty()) {
            return null;
        }
        String[] segments = core.split("\\.", -1);
        int[] parts = new int[segments.length];
        try {
            for (int i = 0; i < segments.length; i++) {
                parts[i] = Integer.parseInt(segments[i]);
            }
        } catch (NumberFormatException e) {
            return null;
        }
        return parts;
    }

    private static String stripPrefix(String version) {
        if (version == null) return "";
        String trimmed = version.strip();
        return trimmed.startsWith("v") || trimmed.startsWith("V") ? trimmed.substring(1) : trimmed;
    }
}
