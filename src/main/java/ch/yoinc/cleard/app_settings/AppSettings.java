package ch.yoinc.cleard.app_settings;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "app_settings")
@Getter
@Setter
@NoArgsConstructor
public class AppSettings {

    public static final String CURRENCY = "currency";
    public static final String LOCALE = "locale";
    public static final String THEME = "theme";
    public static final String ACTIVE_ACCOUNT_ID = "activeAccountId";
    public static final String CHANGELOG_SEEN_VERSION = "changelogSeenVersion";

    @Id
    @Column(name = "setting_key", length = 100)
    private String key;

    @Column(name = "setting_value", nullable = false, length = 255)
    private String value;
}
