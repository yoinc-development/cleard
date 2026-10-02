package ch.yoinc.cleard.app_settings;

public record AppVersionResponse(
        String current,
        String latest,
        boolean updateAvailable,
        String releaseUrl
) {
}
