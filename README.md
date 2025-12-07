# 1937 Simulation Game

This project is a historical simulation game engine set in 1937. It is structured as a modular Python application using a custom library for the game logic and a runner script for execution.

## Project Structure

The project is organized into two main parts:

1.  **`libs/sim1937`**: A standalone Python library containing the core game engine, country definitions, and game logic.
2.  **Top-level Runner**: The root directory contains the `main.py` entry point and configuration to run the game using the library.

## Prerequisites

-   **Python**: Version 3.11 or higher.
-   **uv**: A fast Python package installer and resolver.

## Setup

1.  **Install uv** (if not already installed):
    ```bash
    pip install uv
    ```

2.  **Sync Dependencies**:
    Initialize the virtual environment and install all dependencies (including the local `sim1937` library).
    ```bash
    uv sync
    ```

## Google Sheets & Drive API Setup

To enable the live dashboard feature, you need to set up Google Cloud credentials.

1.  **Create a Google Cloud Project**:
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project (e.g., "Sim1937 Game").

2.  **Enable APIs**:
    *   Go to **APIs & Services > Library**.
    *   Search for and enable **Google Sheets API**.
    *   Search for and enable **Google Drive API**.

3.  **Create Service Account**:
    *   Go to **APIs & Services > Credentials**.
    *   Click **Create Credentials** > **Service Account**.
    *   Give it a name (e.g., "game-bot") and click **Create**.
    *   (Optional) Grant the "Editor" role to the service account.

4.  **Generate Key File**:
    *   Click on the newly created service account email.
    *   Go to the **Keys** tab.
    *   Click **Add Key** > **Create new key**.
    *   Select **JSON** and download the file.

5.  **Configure Project**:
    *   Rename the downloaded JSON file to `credentials.json`.
    *   Move `credentials.json` to the root directory of this project (next to `main.py`).

6.  **Share the Sheet**:
    *   Create a new Google Sheet (or use an existing one).
    *   Open the `credentials.json` file and copy the `client_email` address.
    *   In your Google Sheet, click **Share** and paste the service account email.
    *   Give it **Editor** access.
    *   **Important**: Update the `SHEET_NAME` in `libs/sim1937/src/sim1937/config.py` to match your Google Sheet's name exactly.

## How to Run the Game

To start the game simulation, use the following command:

```bash
uv run main.py
```

-   **With Sheets**: If `credentials.json` is present and configured correctly, the game will connect to Google Sheets.
-   **Test Mode**: If `credentials.json` is missing, the game will automatically default to "TEST MODE" and run in the terminal without Sheets integration.

## How to Test

The project includes a test suite for the `sim1937` library using `pytest`.

To run the tests, execute:

```bash
uv run --extra dev pytest
```

This command will:
1.  Install the development dependencies (like `pytest`).
2.  Discover and run all tests located in `libs/sim1937/tests`.

## Development

If you want to modify the game logic:
1.  Navigate to `libs/sim1937/src/sim1937`.
2.  Edit the files (e.g., `game_engine.py`, `country.py`).
3.  Since the library is installed in "editable" mode, changes will be reflected immediately when you run `main.py` or the tests.
