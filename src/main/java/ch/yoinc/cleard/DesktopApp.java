package ch.yoinc.cleard;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.scene.Scene;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.web.server.context.WebServerInitializedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.ConfigurableApplicationContext;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * JavaFX shell for the desktop app.
 *
 * <p>{@link #init()} boots the embedded Spring Boot server and blocks until it is
 * listening, capturing the OS-assigned port. {@link #start(Stage)} then shows a
 * native window containing a {@link WebView} pointed at that server - no browser
 * chrome, just the rendered React app.
 *
 * <p>Launched via {@link DesktopLauncher}, never directly.
 */
public class DesktopApp extends Application {

    private ConfigurableApplicationContext context;
    private int port;

    @Override
    public void init() throws Exception {
        // The restart classloader fights with the JavaFX runtime; not wanted here anyway.
        System.setProperty("spring.devtools.restart.enabled", "false");

        CompletableFuture<Integer> portFuture = new CompletableFuture<>();
        SpringApplication app = new SpringApplication(CleardApplication.class);
        app.addListeners((ApplicationListener<WebServerInitializedEvent>) event ->
                portFuture.complete(event.getWebServer().getPort()));

        this.context = app.run();
        this.port = portFuture.get(30, TimeUnit.SECONDS);
    }

    @Override
    public void start(Stage stage) {
        WebView webView = new WebView();
        webView.getEngine().load("http://localhost:" + port + "/");

        stage.setTitle("cleard");
        stage.setScene(new Scene(webView, 1280, 800));
        // Native OS window with no browser chrome.
        stage.show();
    }

    @Override
    public void stop() {
        if (context != null) {
            context.close();
        }
        Platform.exit();
        System.exit(0);
    }
}
