package ch.yoinc.cleard.app_settings;

import java.util.Map;

public record AppSettingsResponse(
        String currency,
        String locale,
        String theme,
        String activeAccountId,
        String appVersion,
        boolean changelogSeen
) {
    static final String DEFAULT_CURRENCY = "CHF";
    static final String DEFAULT_THEME = "dark";

    public static AppSettingsResponse from(Map<String, String> values, String activeAccountId, String appVersion) {
        return new AppSettingsResponse(
                values.getOrDefault(AppSettings.CURRENCY, DEFAULT_CURRENCY),
                values.get(AppSettings.LOCALE),
                values.getOrDefault(AppSettings.THEME, DEFAULT_THEME),
                activeAccountId,
                appVersion,
                appVersion != null && appVersion.equals(values.get(AppSettings.CHANGELOG_SEEN_VERSION))
        );
    }
}
