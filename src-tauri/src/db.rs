use tauri::{AppHandle, Manager};

pub async fn initialize_db(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let db_path = app
    .path()
    .app_data_dir()?
    .join("koda.db");

    // Compatible Linux, Windows, et Android (même chemin API Tauri)
    // Sur Android, app_data_dir() retourne le dossier interne de l'app

    let conn = rusqlite::Connection::open(&db_path)?;

    conn.execute_batch("
    PRAGMA journal_mode=WAL;

    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        column TEXT NOT NULL DEFAULT 'TODO',
        priority TEXT NOT NULL DEFAULT 'medium',
        tags TEXT DEFAULT '[]',
        has_api INTEGER DEFAULT 0,
        attachments TEXT DEFAULT '[]',
        custom_actions TEXT DEFAULT '[]',
        pomodoro_duration INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS triggers (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        trigger_type TEXT NOT NULL,  -- 'time_in_column' | 'move_to_column'
    condition_value TEXT,        -- ex: '48' (heures) ou 'IN_PROGRESS'
    action_type TEXT NOT NULL,
    action_payload TEXT,
    is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings VALUES ('kiosk_mode', 'false');
    INSERT OR IGNORE INTO settings VALUES ('theme', 'dark');
    INSERT OR IGNORE INTO settings VALUES ('weather_city', 'Vannes');
    ")?;

    Ok(())
}
