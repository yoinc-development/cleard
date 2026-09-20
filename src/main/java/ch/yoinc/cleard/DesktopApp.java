package ch.yoinc.cleard;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.web.server.context.WebServerInitializedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.ConfigurableApplicationContext;

import java.io.PrintWriter;
import java.io.StringWriter;
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
    private Throwable startupFailure;

    @Override
    public void init() {
        // The restart classloader fights with the JavaFX runtime; not wanted here anyway.
        System.setProperty("spring.devtools.restart.enabled", "false");

        try {
            CompletableFuture<Integer> portFuture = new CompletableFuture<>();
            SpringApplication app = new SpringApplication(CleardApplication.class);
            app.addListeners((ApplicationListener<WebServerInitializedEvent>) event ->
                    portFuture.complete(event.getWebServer().getPort()));

            this.context = app.run();
            this.port = portFuture.get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            this.startupFailure = e;
        }
    }

    @Override
    public void start(Stage stage) {
        stage.setTitle("cleard");

        if (startupFailure != null) {
            stage.setScene(new Scene(startupFailurePane(startupFailure), 640, 400));
            stage.show();
            return;
        }

        WebView webView = new WebView();
        webView.getEngine().load("http://localhost:" + port + "/");
        stage.setScene(new Scene(webView, 1280, 800));
        // Native OS window with no browser chrome.
        stage.show();
    }

    private static VBox startupFailurePane(Throwable failure) {
        StringWriter trace = new StringWriter();
        failure.printStackTrace(new PrintWriter(trace));

        Label heading = new Label("cleard failed to start");
        heading.setStyle("-fx-font-size: 16px; -fx-font-weight: bold;");

        Label detail = new Label(trace.toString());
        detail.setWrapText(true);

        VBox box = new VBox(12, heading, detail);
        box.setAlignment(Pos.TOP_LEFT);
        box.setStyle("-fx-padding: 16; -fx-background-color: white;");
        return box;
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
