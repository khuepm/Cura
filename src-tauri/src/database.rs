use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, Result, Row};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

/// Image record stored in database
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ImageRecord {
    pub id: i64,
    pub path: String,
    pub thumbnail_small: String,
    pub thumbnail_medium: String,
    pub checksum: String,
    pub capture_date: Option<DateTime<Utc>>,
    pub camera_make: Option<String>,
    pub camera_model: Option<String>,
    pub gps_latitude: Option<f64>,
    pub gps_longitude: Option<f64>,
    pub width: u32,
    pub height: u32,
    pub file_size: u64,
    pub file_modified: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub synced_at: Option<DateTime<Utc>>,
    pub sync_status: String,
}

/// Tag associated with an image
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Tag {
    pub id: i64,
    pub image_id: i64,
    pub label: String,
    pub confidence: f64,
    pub created_at: DateTime<Utc>,
}

/// Filter criteria for querying images
#[derive(Debug, Clone, Default)]
pub struct ImageFilter {
    pub date_range: Option<(DateTime<Utc>, DateTime<Utc>)>,
    pub location: Option<(f64, f64, f64)>, // (latitude, longitude, radius_km)
    pub tags: Option<Vec<String>>,
    pub camera_model: Option<String>,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    /// Initialize database connection and create schema if needed
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        
        // Enable foreign key constraints
        conn.execute("PRAGMA foreign_keys = ON", [])?;
        
        let db = Database { conn: Mutex::new(conn) };
        db.initialize_schema()?;
        Ok(db)
    }

    /// Create all tables and indexes
    fn initialize_schema(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
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

        Ok(())
    }

    /// Insert a new image record
    pub fn insert_image(
        &self,
        path: &str,
        thumbnail_small: &str,
        thumbnail_medium: &str,
        checksum: &str,
        capture_date: Option<DateTime<Utc>>,
        camera_make: Option<&str>,
        camera_model: Option<&str>,
        gps_latitude: Option<f64>,
        gps_longitude: Option<f64>,
        width: u32,
        height: u32,
        file_size: u64,
        file_modified: DateTime<Utc>,
    ) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        
        conn.execute(
            "INSERT INTO images (
                path, thumbnail_small, thumbnail_medium, checksum,
                capture_date, camera_make, camera_model,
                gps_latitude, gps_longitude, width, height,
                file_size, file_modified
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                path,
                thumbnail_small,
                thumbnail_medium,
                checksum,
                capture_date.map(|dt| dt.to_rfc3339()),
                camera_make,
                camera_model,
                gps_latitude,
                gps_longitude,
                width,
                height,
                file_size as i64,
                file_modified.to_rfc3339(),
            ],
        )?;

        Ok(conn.last_insert_rowid())
    }

    /// Insert a tag for an image
    pub fn insert_tag(&self, image_id: i64, label: &str, confidence: f64) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        
        conn.execute(
            "INSERT INTO tags (image_id, label, confidence) VALUES (?1, ?2, ?3)",
            params![image_id, label, confidence],
        )?;

        Ok(conn.last_insert_rowid())
    }

    /// Get an image by ID
    pub fn get_image_by_id(&self, id: i64) -> Result<Option<ImageRecord>> {
        let conn = self.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT id, path, thumbnail_small, thumbnail_medium, checksum,
                    capture_date, camera_make, camera_model,
                    gps_latitude, gps_longitude, width, height,
                    file_size, file_modified, created_at, synced_at, sync_status
             FROM images WHERE id = ?1"
        )?;

        let result = stmt.query_row(params![id], |row| Ok(parse_image_row(row)?));

        match result {
            Ok(image) => Ok(Some(image)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get an image by path
    pub fn get_image_by_path(&self, path: &str) -> Result<Option<ImageRecord>> {
        let conn = self.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT id, path, thumbnail_small, thumbnail_medium, checksum,
                    capture_date, camera_make, camera_model,
                    gps_latitude, gps_longitude, width, height,
                    file_size, file_modified, created_at, synced_at, sync_status
             FROM images WHERE path = ?1"
        )?;

        let result = stmt.query_row(params![path], |row| Ok(parse_image_row(row)?));

        match result {
            Ok(image) => Ok(Some(image)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get an image by checksum
    pub fn get_image_by_checksum(&self, checksum: &str) -> Result<Option<ImageRecord>> {
        let conn = self.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT id, path, thumbnail_small, thumbnail_medium, checksum,
                    capture_date, camera_make, camera_model,
                    gps_latitude, gps_longitude, width, height,
                    file_size, file_modified, created_at, synced_at, sync_status
             FROM images WHERE checksum = ?1"
        )?;

        let result = stmt.query_row(params![checksum], |row| Ok(parse_image_row(row)?));

        match result {
            Ok(image) => Ok(Some(image)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Query images with filters
    pub fn query_images(&self, filter: &ImageFilter) -> Result<Vec<ImageRecord>> {
        let conn = self.conn.lock().unwrap();
        
        let mut query = String::from(
            "SELECT DISTINCT i.id, i.path, i.thumbnail_small, i.thumbnail_medium, i.checksum,
                    i.capture_date, i.camera_make, i.camera_model,
                    i.gps_latitude, i.gps_longitude, i.width, i.height,
                    i.file_size, i.file_modified, i.created_at, i.synced_at, i.sync_status
             FROM images i"
        );

        let mut conditions = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        // Add tag filter if specified
        if let Some(tags) = &filter.tags {
            if !tags.is_empty() {
                query.push_str(" INNER JOIN tags t ON i.id = t.image_id");
                let placeholders = tags.iter().map(|_| "?").collect::<Vec<_>>().join(",");
                conditions.push(format!("t.label IN ({})", placeholders));
                for tag in tags {
                    params_vec.push(Box::new(tag.clone()));
                }
            }
        }

        // Add date range filter
        if let Some((start, end)) = &filter.date_range {
            conditions.push("i.capture_date BETWEEN ? AND ?".to_string());
            params_vec.push(Box::new(start.to_rfc3339()));
            params_vec.push(Box::new(end.to_rfc3339()));
        }

        // Add location filter (simple bounding box for now)
        if let Some((lat, lon, radius_km)) = &filter.location {
            // Approximate degrees per km (at equator)
            let degrees_per_km = 1.0 / 111.0;
            let lat_delta = radius_km * degrees_per_km;
            let lon_delta = radius_km * degrees_per_km / lat.cos();

            conditions.push(
                "i.gps_latitude BETWEEN ? AND ? AND i.gps_longitude BETWEEN ? AND ?".to_string()
            );
            params_vec.push(Box::new(lat - lat_delta));
            params_vec.push(Box::new(lat + lat_delta));
            params_vec.push(Box::new(lon - lon_delta));
            params_vec.push(Box::new(lon + lon_delta));
        }

        // Add camera model filter
        if let Some(model) = &filter.camera_model {
            conditions.push("i.camera_model = ?".to_string());
            params_vec.push(Box::new(model.clone()));
        }

        // Build WHERE clause
        if !conditions.is_empty() {
            query.push_str(" WHERE ");
            query.push_str(&conditions.join(" AND "));
        }

        query.push_str(" ORDER BY i.capture_date DESC");

        let mut stmt = conn.prepare(&query)?;
        
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        
        let images = stmt.query_map(params_refs.as_slice(), |row| {
            Ok(parse_image_row(row)?)
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(images)
    }

    /// Get tags for an image
    pub fn get_tags_for_image(&self, image_id: i64) -> Result<Vec<Tag>> {
        let conn = self.conn.lock().unwrap();
        
        let mut stmt = conn.prepare(
            "SELECT id, image_id, label, confidence, created_at
             FROM tags WHERE image_id = ?1"
        )?;

        let tags = stmt.query_map(params![image_id], |row| {
            Ok(Tag {
                id: row.get(0)?,
                image_id: row.get(1)?,
                label: row.get(2)?,
                confidence: row.get(3)?,
                created_at: parse_datetime(&row.get::<_, String>(4)?)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(tags)
    }

    /// Update image path (for handling file moves)
    pub fn update_image_path(&self, checksum: &str, new_path: &str) -> Result<usize> {
        let conn = self.conn.lock().unwrap();
        
        let updated = conn.execute(
            "UPDATE images SET path = ?1 WHERE checksum = ?2",
            params![new_path, checksum],
        )?;

        Ok(updated)
    }

    /// Delete an image record and associated data
    pub fn delete_image(&self, id: i64) -> Result<usize> {
        let conn = self.conn.lock().unwrap();
        
        // Foreign key constraints will cascade delete tags and embeddings
        let deleted = conn.execute(
            "DELETE FROM images WHERE id = ?1",
            params![id],
        )?;

        Ok(deleted)
    }

    /// Delete an image by path
    pub fn delete_image_by_path(&self, path: &str) -> Result<usize> {
        let conn = self.conn.lock().unwrap();
        
        let deleted = conn.execute(
            "DELETE FROM images WHERE path = ?1",
            params![path],
        )?;

        Ok(deleted)
    }

    /// Get a reference to the connection for queries
    pub fn connection(&self) -> &Mutex<Connection> {
        &self.conn
    }
}

/// Parse an image row from a query result
fn parse_image_row(row: &Row) -> Result<ImageRecord> {
    Ok(ImageRecord {
        id: row.get(0)?,
        path: row.get(1)?,
        thumbnail_small: row.get(2)?,
        thumbnail_medium: row.get(3)?,
        checksum: row.get(4)?,
        capture_date: row.get::<_, Option<String>>(5)?
            .and_then(|s| parse_datetime(&s).ok()),
        camera_make: row.get(6)?,
        camera_model: row.get(7)?,
        gps_latitude: row.get(8)?,
        gps_longitude: row.get(9)?,
        width: row.get(10)?,
        height: row.get(11)?,
        file_size: row.get::<_, i64>(12)? as u64,
        file_modified: parse_datetime(&row.get::<_, String>(13)?)?,
        created_at: parse_datetime(&row.get::<_, String>(14)?)?,
        synced_at: row.get::<_, Option<String>>(15)?
            .and_then(|s| parse_datetime(&s).ok()),
        sync_status: row.get(16)?,
    })
}

/// Parse a datetime string in RFC3339 format or SQLite format
fn parse_datetime(s: &str) -> Result<DateTime<Utc>> {
    // Try RFC3339 format first
    if let Ok(dt) = DateTime::parse_from_rfc3339(s) {
        return Ok(dt.with_timezone(&Utc));
    }
    
    // Try SQLite CURRENT_TIMESTAMP format: "YYYY-MM-DD HH:MM:SS"
    if let Ok(naive_dt) = chrono::NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S") {
        return Ok(DateTime::<Utc>::from_naive_utc_and_offset(naive_dt, Utc));
    }
    
    Err(rusqlite::Error::FromSqlConversionFailure(
        0,
        rusqlite::types::Type::Text,
        Box::new(std::io::Error::new(std::io::ErrorKind::InvalidData, "Invalid datetime format")),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_database_initialization() {
        let temp_dir = std::env::temp_dir();
        let db_path = temp_dir.join("test_cura_init.db");
        
        // Clean up if exists
        let _ = fs::remove_file(&db_path);

        // Create database
        let db = Database::new(db_path.clone()).expect("Failed to create database");

        // Verify tables exist
        let conn = db.connection().lock().unwrap();
        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert!(tables.contains(&"images".to_string()));
        assert!(tables.contains(&"tags".to_string()));
        assert!(tables.contains(&"embeddings".to_string()));

        // Verify indexes exist
        let indexes: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='index' ORDER BY name")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert!(indexes.contains(&"idx_images_path".to_string()));
        assert!(indexes.contains(&"idx_images_capture_date".to_string()));
        assert!(indexes.contains(&"idx_images_sync_status".to_string()));
        assert!(indexes.contains(&"idx_tags_image_id".to_string()));
        assert!(indexes.contains(&"idx_tags_label".to_string()));
        assert!(indexes.contains(&"idx_images_checksum".to_string()));

        // Clean up
        drop(conn);
        let _ = fs::remove_file(&db_path);
    }

    #[test]
    fn test_insert_and_retrieve_image() {
        let temp_dir = std::env::temp_dir();
        let db_path = temp_dir.join("test_cura_insert.db");
        let _ = fs::remove_file(&db_path);

        let db = Database::new(db_path.clone()).unwrap();

        // Insert an image
        let now = Utc::now();
        let image_id = db.insert_image(
            "/path/to/image.jpg",
            "/path/to/thumb_small.jpg",
            "/path/to/thumb_medium.jpg",
            "abc123checksum",
            Some(now),
            Some("Canon"),
            Some("EOS 5D"),
            Some(37.7749),
            Some(-122.4194),
            1920,
            1080,
            1024000,
            now,
        ).unwrap();

        assert!(image_id > 0);

        // Retrieve by ID
        let image = db.get_image_by_id(image_id).unwrap().unwrap();
        assert_eq!(image.path, "/path/to/image.jpg");
        assert_eq!(image.checksum, "abc123checksum");
        assert_eq!(image.camera_make, Some("Canon".to_string()));
        assert_eq!(image.width, 1920);
        assert_eq!(image.height, 1080);

        // Retrieve by path
        let image2 = db.get_image_by_path("/path/to/image.jpg").unwrap().unwrap();
        assert_eq!(image2.id, image_id);

        // Retrieve by checksum
        let image3 = db.get_image_by_checksum("abc123checksum").unwrap().unwrap();
        assert_eq!(image3.id, image_id);

        // Clean up
        let _ = fs::remove_file(&db_path);
    }

    #[test]
    fn test_insert_and_retrieve_tags() {
        let temp_dir = std::env::temp_dir();
        let db_path = temp_dir.join("test_cura_tags.db");
        let _ = fs::remove_file(&db_path);

        let db = Database::new(db_path.clone()).unwrap();

        // Insert an image
        let now = Utc::now();
        let image_id = db.insert_image(
            "/path/to/image.jpg",
            "/path/to/thumb_small.jpg",
            "/path/to/thumb_medium.jpg",
            "abc123",
            Some(now),
            None,
            None,
            None,
            None,
            1920,
            1080,
            1024000,
            now,
        ).unwrap();

        // Insert tags
        let tag1_id = db.insert_tag(image_id, "cat", 0.95).unwrap();
        let tag2_id = db.insert_tag(image_id, "animal", 0.87).unwrap();

        assert!(tag1_id > 0);
        assert!(tag2_id > 0);

        // Retrieve tags
        let tags = db.get_tags_for_image(image_id).unwrap();
        assert_eq!(tags.len(), 2);
        assert!(tags.iter().any(|t| t.label == "cat" && t.confidence == 0.95));
        assert!(tags.iter().any(|t| t.label == "animal" && t.confidence == 0.87));

        // Clean up
        let _ = fs::remove_file(&db_path);
    }

    #[test]
    fn test_update_image_path() {
        let temp_dir = std::env::temp_dir();
        let db_path = temp_dir.join("test_cura_update.db");
        let _ = fs::remove_file(&db_path);

        let db = Database::new(db_path.clone()).unwrap();

        // Insert an image
        let now = Utc::now();
        let image_id = db.insert_image(
            "/old/path/image.jpg",
            "/path/to/thumb_small.jpg",
            "/path/to/thumb_medium.jpg",
            "checksum123",
            Some(now),
            None,
            None,
            None,
            None,
            1920,
            1080,
            1024000,
            now,
        ).unwrap();

        // Update path
        let updated = db.update_image_path("checksum123", "/new/path/image.jpg").unwrap();
        assert_eq!(updated, 1);

        // Verify update
        let image = db.get_image_by_id(image_id).unwrap().unwrap();
        assert_eq!(image.path, "/new/path/image.jpg");

        // Clean up
        let _ = fs::remove_file(&db_path);
    }

    #[test]
    fn test_delete_image() {
        let temp_dir = std::env::temp_dir();
        let db_path = temp_dir.join("test_cura_delete.db");
        let _ = fs::remove_file(&db_path);

        let db = Database::new(db_path.clone()).unwrap();

        // Insert an image
        let now = Utc::now();
        let image_id = db.insert_image(
            "/path/to/image.jpg",
            "/path/to/thumb_small.jpg",
            "/path/to/thumb_medium.jpg",
            "checksum123",
            Some(now),
            None,
            None,
            None,
            None,
            1920,
            1080,
            1024000,
            now,
        ).unwrap();

        // Delete image
        let deleted = db.delete_image(image_id).unwrap();
        assert_eq!(deleted, 1);

        // Verify deletion
        let image = db.get_image_by_id(image_id).unwrap();
        assert!(image.is_none());

        // Clean up
        let _ = fs::remove_file(&db_path);
    }

    #[test]
    fn test_query_images_with_filters() {
        let temp_dir = std::env::temp_dir();
        let db_path = temp_dir.join("test_cura_query.db");
        let _ = fs::remove_file(&db_path);

        let db = Database::new(db_path.clone()).unwrap();

        // Insert multiple images
        let now = Utc::now();
        let past = now - chrono::Duration::days(30);
        
        let img1_id = db.insert_image(
            "/path/to/image1.jpg",
            "/thumb1_s.jpg",
            "/thumb1_m.jpg",
            "check1",
            Some(now),
            Some("Canon"),
            Some("EOS 5D"),
            Some(37.7749),
            Some(-122.4194),
            1920,
            1080,
            1024000,
            now,
        ).unwrap();

        let img2_id = db.insert_image(
            "/path/to/image2.jpg",
            "/thumb2_s.jpg",
            "/thumb2_m.jpg",
            "check2",
            Some(past),
            Some("Nikon"),
            Some("D850"),
            Some(40.7128),
            Some(-74.0060),
            1920,
            1080,
            1024000,
            past,
        ).unwrap();

        // Add tags
        db.insert_tag(img1_id, "landscape", 0.9).unwrap();
        db.insert_tag(img2_id, "portrait", 0.85).unwrap();

        // Query with date range filter
        let filter = ImageFilter {
            date_range: Some((now - chrono::Duration::days(7), now + chrono::Duration::days(1))),
            ..Default::default()
        };
        let results = db.query_images(&filter).unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].path, "/path/to/image1.jpg");

        // Query with camera model filter
        let filter = ImageFilter {
            camera_model: Some("D850".to_string()),
            ..Default::default()
        };
        let results = db.query_images(&filter).unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].path, "/path/to/image2.jpg");

        // Query with tag filter
        let filter = ImageFilter {
            tags: Some(vec!["landscape".to_string()]),
            ..Default::default()
        };
        let results = db.query_images(&filter).unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].path, "/path/to/image1.jpg");

        // Clean up
        let _ = fs::remove_file(&db_path);
    }
}
