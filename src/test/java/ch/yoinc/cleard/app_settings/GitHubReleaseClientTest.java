package ch.yoinc.cleard.app_settings;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withResourceNotFound;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GitHubReleaseClientTest {

    private MockRestServiceServer server;
    private GitHubReleaseClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new GitHubReleaseClient(builder.build());
    }

    @Test
    void readsTheTagAndPageUrlAndIgnoresOtherFields() {
        server.expect(requestTo(GitHubReleaseClient.LATEST_RELEASE_URL)).andRespond(withSuccess("""
                {"tag_name": "v1.2.0", "html_url": "https://github.com/yoinc-development/cleard/releases/tag/v1.2.0",
                 "name": "1.2.0", "draft": false, "assets": []}
                """, MediaType.APPLICATION_JSON));

        assertEquals(
                Optional.of(new GitHubReleaseClient.Release("v1.2.0",
                        "https://github.com/yoinc-development/cleard/releases/tag/v1.2.0")),
                client.fetchLatestRelease());
    }

    @Test
    void noReleasePublishedYetIsEmpty() {
        server.expect(requestTo(GitHubReleaseClient.LATEST_RELEASE_URL)).andRespond(withResourceNotFound());

        assertTrue(client.fetchLatestRelease().isEmpty());
    }

    @Test
    void serverErrorIsEmpty() {
        server.expect(requestTo(GitHubReleaseClient.LATEST_RELEASE_URL)).andRespond(withServerError());

        assertTrue(client.fetchLatestRelease().isEmpty());
    }

    @Test
    void malformedBodyIsEmpty() {
        server.expect(requestTo(GitHubReleaseClient.LATEST_RELEASE_URL))
                .andRespond(withSuccess("not json", MediaType.APPLICATION_JSON));

        assertTrue(client.fetchLatestRelease().isEmpty());
    }

    @Test
    void missingTagIsEmpty() {
        server.expect(requestTo(GitHubReleaseClient.LATEST_RELEASE_URL))
                .andRespond(withSuccess("{\"html_url\": \"https://example.test\"}", MediaType.APPLICATION_JSON));

        assertTrue(client.fetchLatestRelease().isEmpty());
    }

    @Test
    void connectionFailureIsEmpty() {
        server.expect(requestTo(GitHubReleaseClient.LATEST_RELEASE_URL)).andRespond(request -> {
            throw new IOException("offline");
        });

        assertTrue(client.fetchLatestRelease().isEmpty());
    }
}
