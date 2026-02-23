use rusqlite::{Connection, Result};

/// Database schema version
const CURRENT_VERSION: i32 = 2;

/// Initialize or migrate the database schema
pub fn run_migrations(conn: &Connection) -> Result<()> {
    // Create schema_version table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Get current version
    let current_version: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_version",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    println!("Current database schema version: {}", current_version);

    // Run migrations in order
    if current_version < 1 {
        println!("Running migration to version 1: Initial schema");
        migrate_to_v1(conn)?;
        record_migration(conn, 1)?;
    }

    if current_version < 2 {
        println!("Running migration to version 2: Add video support");
        migrate_to_v2(conn)?;
        record_migration(conn, 2)?;
    }

    println!("Database schema is up to date at version {}", CURRENT_VERSION);
    Ok(())
}

/// Record that a migration has been applied
fn record_migration(conn: &Connection, version: i32) -> Result<()> {
    conn.execute(
        "INSERT INTO schema_version (version) VALUES (?1)",
        [version],
    )?;
    Ok(())
}

/// Migration to version 1: Initial schema
fn migrate_to_v1(conn: &Connection) -> Result<()> {
    // Create images table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL UNIQUE,
            thumbnail_small TEXT NOT NULL,
            thumbnail_medium TEXT NOT NULL,
            checksum TEXT NOT NULL,
            capture_date DATETIME,
            camera_make TEXT,
            camera_model TEXT,
            gps_latitude REAL,
            gps_longitude REAL,
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            file_size INTEGER NOT NULL,
            file_modified DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            synced_at DATETIME,
            sync_status TEXT DEFAULT 'pending'
        )",
        [],
    )?;

    // Create tags table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_id INTEGER NOT NULL,
            label TEXT NOT NULL,
            confidence REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Create embeddings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS embeddings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_id INTEGER NOT NULL UNIQUE,
            embedding BLOB NOT NULL,
            model_version TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Create indexes
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_images_path ON images(path)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_images_capture_date ON images(capture_date)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_images_sync_status ON images(sync_status)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tags_image_id ON tags(image_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_tags_label ON tags(label)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_images_checksum ON images(checksum)",
        [],
    )?;

    println!("Migration to version 1 completed successfully");
    Ok(())
}

/// Migration to version 2: Add video support
fn migrate_to_v2(conn: &Connection) -> Result<()> {
    println!("Adding video support columns to images table");

    // Check if columns already exist (for idempotency)
    let has_media_type = check_column_exists(conn, "images", "media_type")?;
    let has_duration = check_column_exists(conn, "images", "duration_seconds")?;
    let has_codec = check_column_exists(conn, "images", "video_codec")?;

    // Add media_type column with default 'image' for backward compatibility
    if !has_media_type {
        println!("Adding media_type column");
        conn.execute(
            "ALTER TABLE images ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image'",
            [],
        )?;
    } else {
        println!("media_type column already exists, skipping");
    }

    // Add duration_seconds column (nullable for images)
    if !has_duration {
        println!("Adding duration_seconds column");
        conn.execute(
            "ALTER TABLE images ADD COLUMN duration_seconds REAL",
            [],
        )?;
    } else {
        println!("duration_seconds column already exists, skipping");
    }

    // Add video_codec column (nullable for images)
    if !has_codec {
        println!("Adding video_codec column");
        conn.execute(
            "ALTER TABLE images ADD COLUMN video_codec TEXT",
            [],
        )?;
    } else {
        println!("video_codec column already exists, skipping");
    }

    // Create index on media_type for efficient filtering
    println!("Creating index on media_type column");
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_images_media_type ON images(media_type)",
        [],
    )?;

    // Verify all existing records have media_type='image'
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM images WHERE media_type = 'image'",
        [],
        |row| row.get(0),
    )?;
    println!("Verified {} existing image records have media_type='image'", count);

    println!("Migration to version 2 completed successfully");
    Ok(())
}

/// Check if a column exists in a table
fn check_column_exists(conn: &Connection, table: &str, column: &str) -> Result<bool> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", table))?;
    let columns: Vec<String> = stmt
        .query_map([], |row| row.get::<_, String>(1))?
        .collect::<Result<Vec<_>, _>>()?;
    
    Ok(columns.contains(&column.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_migrations_on_new_database() {
        let temp_dir = std::env::temp_dir();
        let db_path = temp_dir.join("test_migrations_new.db");
        let _ = fs::remove_file(&db_path);

        let conn = Connection::open(&db_path).unwrap();
        conn.execute("PRAGMA foreign_keys = ON", []).unwrap();

        // Run migrations
        run_migrations(&conn).unwrap();

        // Verify schema_version table exists
        let version: i32 = conn
            .query_row(
                "SELECT MAX(version) FROM schema_version",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(version, 2);

        // Verify images table has all columns including video support
        let columns: Vec<String> = conn
            .prepare("PRAGMA table_info(images)")
            .unwrap()
            .query_map([], |row| row.get::<_, String>(1))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert!(columns.contains(&"media_type".to_string()));
        assert!(columns.contains(&"duration_seconds".to_string()));
        assert!(columns.contains(&"video_codec".to_string()));

        // Verify indexes exist
        let indexes: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='index' ORDER BY name")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert!(indexes.contains(&"idx_images_media_type".to_string()));

        // Clean up
        drop(conn);
        let _ = fs::remove_file(&db_path);
    }

    #[test]
    fn test_migration_from_v1_to_v2() {
        let temp_dir = std::env::temp_dir();
        let db_path = temp_dir.join("test_migrations_v1_to_v2.db");
        let _ = fs::remove_file(&db_path);

        let conn = Connection::open(&db_path).unwrap();
        conn.execute("PRAGMA foreign_keys = ON", []).unwrap();

        // Create schema_version table first
        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        ).unwrap();

        // Create v1 schema manually
        migrate_to_v1(&conn).unwrap();
        record_migration(&conn, 1).unwrap();

        // Insert a test image record
        conn.execute(
            "INSERT INTO images (
                path, thumbnail_small, thumbnail_medium, checksum,
                width, height, file_size, file_modified
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            rusqlite::params![
                "/test/image.jpg",
                "/test/thumb_small.jpg",
                "/test/thumb_medium.jpg",
                "test_checksum",
                1920,
                1080,
                1024000,
                "2024-01-01T00:00:00Z",
            ],
        )
        .unwrap();

        let image_id = conn.last_insert_rowid();

        // Run migration to v2
        migrate_to_v2(&conn).unwrap();
        record_migration(&conn, 2).unwrap();

        // Verify the existing image has media_type='image'
        let media_type: String = conn
            .query_row(
                "SELECT media_type FROM images WHERE id = ?1",
                [image_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(media_type, "image");

        // Verify duration_seconds and video_codec are NULL for existing image
        let (duration, codec): (Option<f64>, Option<String>) = conn
            .query_row(
                "SELECT duration_seconds, video_codec FROM images WHERE id = ?1",
                [image_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap();
        assert!(duration.is_none());
        assert!(codec.is_none());

        // Verify we can insert a video record
        conn.execute(
            "INSERT INTO images (
                path, thumbnail_small, thumbnail_medium, checksum,
                media_type, duration_seconds, video_codec,
                width, height, file_size, file_modified
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            rusqlite::params![
                "/test/video.mp4",
                "/test/video_thumb_small.jpg",
                "/test/video_thumb_medium.jpg",
                "video_checksum",
                "video",
                120.5,
                "h264",
                1920,
                1080,
                5024000,
                "2024-01-01T00:00:00Z",
            ],
        )
        .unwrap();

        let video_id = conn.last_insert_rowid();

        // Verify video record
        let (media_type, duration, codec): (String, Option<f64>, Option<String>) = conn
            .query_row(
                "SELECT media_type, duration_seconds, video_codec FROM images WHERE id = ?1",
                [video_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();
        assert_eq!(media_type, "video");
        assert_eq!(duration, Some(120.5));
        assert_eq!(codec, Some("h264".to_string()));

        // Clean up
        drop(conn);
        let _ = fs::remove_file(&db_path);
    }

    #[test]
    fn test_migration_idempotency() {
        let temp_dir = std::env::temp_dir();
        let db_path = temp_dir.join("test_migrations_idempotent.db");
        let _ = fs::remove_file(&db_path);

        let conn = Connection::open(&db_path).unwrap();
        conn.execute("PRAGMA foreign_keys = ON", []).unwrap();

        // Run migrations twice
        run_migrations(&conn).unwrap();
        run_migrations(&conn).unwrap();

        // Verify version is still 2
        let version: i32 = conn
            .query_row(
                "SELECT MAX(version) FROM schema_version",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(version, 2);

        // Verify only 2 migration records exist
        let count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM schema_version",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 2);

        // Clean up
        drop(conn);
        let _ = fs::remove_file(&db_path);
    }
}
