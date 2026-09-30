# cleard

[![GitHub release](https://img.shields.io/github/v/release/yoinc-development/cleard)](https://github.com/yoinc-development/cleard)

**cleard** is a desktop app that helps you keep track of your money. You record your income and expenses, sort them into
categories, and see at a glance where your money goes each month.

I've created this project to offer an alternative to all paid finance apps. Same features, same oversight over your
budget, but no costs, no subscriptions, no data being stolen. Your data is being stored
on your PC and that's where it will stay.

> **Status:** Development is ongoing with a stable Windows release planned with version 1.0. macOS support and
> additional features are planned.

## What can it do?

- **Transactions** - add, edit and delete income and expenses. Browse them month by month, search them, and filter by
  category. Each month shows a summary of what came in, what went out and the net result.
- **Categories** - group your transactions (e.g. "Groceries", "Salary") with your own names and colors, and see how much
  you have spent in each category this month.
- **Overview** - a monthly dashboard with your totals, spending per category and a daily spending chart.
- **Thresholds** - set a warning limit on a category and see how close you are to it this month.

## How it works (the short version)

cleard is built from three parts that are packaged together into one installable app:

| Part              | What it does                               | Technology                   |
|-------------------|--------------------------------------------|------------------------------|
| **Backend**       | Stores your data and does the calculations | Java 21, Spring Boot, SQLite |
| **Frontend**      | The screens you see and click on           | React, TypeScript, Vite      |
| **Desktop shell** | The app window; starts the backend for you | Electron                     |

When you launch the app, the shell quietly starts the backend in the background, waits until it is ready, and then opens
a window showing the frontend. The installer bundles its own Java runtime, so you do not need to install Java to *use*
cleard.

Your data lives in a folder called `.cleard` in your user directory (for example `C:\Users\<you>\.cleard`). Uninstalling
the app deletes this folder, including all your data. cleard has no export feature yet, so back up the folder yourself
if you want to keep it.

## Local development

This section is for people who want to run or change the code. You do not need any of it just to use the app.

### What you need

- **Java 21** (JDK)
- **Node.js 22** and npm
- **Git**

Maven does not need to be installed; the project ships its own wrapper (`mvnw`). Development works the same on Windows
and macOS.

### 1. Get the code

```
git clone https://github.com/yoinc-development/cleard.git
cd cleard
```

### 2. Start the backend

From the project root, start it with the `dev` profile. This makes it listen on the fixed port `8080`, which the
frontend expects:

```
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

On Windows PowerShell:

```
$env:SPRING_PROFILES_ACTIVE="dev"; ./mvnw spring-boot:run
```

(In IntelliJ, run `CleardApplication` with the active profile set to `dev`.)

The first start creates a development database at `~/.cleard/cleard-dev.db` automatically.

### 3. Start the frontend

In a second terminal:

```
cd frontend
npm ci
npm run dev
```

Then open **http://127.0.0.1:5173** in your browser. The page reloads as you edit the code, and requests to `/api` are
forwarded to the backend from step 2.

### Running the tests

```
./mvnw test              # backend (uses an in-memory database)
cd frontend && npm test  # frontend
```

### Trying the desktop window (optional)

To test the Electron shell itself, with the backend from step 2 still running:

```
cd frontend && npm run build   # builds the frontend into the backend
cd ../desktop
npm ci
npm run dev
```

This opens the real app window pointed at your running dev backend. It shows the *built* frontend, not the
live-reloading one from step 3.

### Building the installer (Windows only)

The installer bundles a Java runtime and must be built on Windows with a JDK 21 (`jlink` on your PATH):

```
cd desktop
npm ci
npm run build
```

The resulting `cleard-setup-<version>.exe` is written to `target/dist`.

## Project layout

```
src/         Backend (Java, Spring Boot)
frontend/    Frontend (React)
desktop/     Desktop shell and installer config (Electron)
packaging/   App icon
```

## Contributing

Ideas, bug reports and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## License

cleard is released under the [MIT License](LICENSE).
