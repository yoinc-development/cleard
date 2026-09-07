package ch.yoinc.cleard;

import javafx.application.Application;

/**
 * Entry point for the packaged desktop app (the {@code jpackage --main-class} target).
 * Delegates to the JavaFX {@link DesktopApp}; kept separate because a class that
 * extends {@code javafx.application.Application} cannot itself be the JVM main class
 * when the JavaFX runtime is on the classpath rather than the module path.
 */
public class DesktopLauncher {

    public static void main(String[] args) {
        Application.launch(DesktopApp.class, args);
    }
}
