package ch.yoinc.cleard.app_settings;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Optional;

@Slf4j
@Component
public class GitHubReleaseClient {

    static final String LATEST_RELEASE_URL = "https://api.github.com/repos/yoinc-development/cleard/releases/latest";

    private final RestClient restClient;

    @Autowired
    public GitHubReleaseClient() {
        this(defaultRestClient());
    }

    GitHubReleaseClient(RestClient restClient) {
        this.restClient = restClient;
    }

    public Optional<Release> fetchLatestRelease() {
        try {
            GitHubRelease release = restClient.get().uri(LATEST_RELEASE_URL).retrieve().body(GitHubRelease.class);
            if (release == null || release.tagName() == null || release.tagName().isBlank()) {
                return Optional.empty();
            }
            return Optional.of(new Release(release.tagName(), release.htmlUrl()));
        } catch (RuntimeException e) {
            log.debug("Could not determine the latest release: {}", e.toString());
            return Optional.empty();
        }
    }

    private static RestClient defaultRestClient() {
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(5));
        return RestClient.builder()
                .requestFactory(requestFactory)
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github+json")
                .defaultHeader(HttpHeaders.USER_AGENT, "cleard")
                .build();
    }

    public record Release(String tag, String url) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GitHubRelease(
            @JsonProperty("tag_name") String tagName,
            @JsonProperty("html_url") String htmlUrl
    ) {
    }
}
