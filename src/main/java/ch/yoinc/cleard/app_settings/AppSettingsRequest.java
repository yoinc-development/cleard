package ch.yoinc.cleard.app_settings;

public record AppSettingsRequest(
        String currency,
        String locale
) {
}
