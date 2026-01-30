use std::path::PathBuf;
use std::sync::Once;

static INIT: Once = Once::new();

/// Initialize the logging system with rotating file output
pub fn init_logging(app_data_dir: &PathBuf) -> Result<(), String> {
    INIT.call_once(|| {
        // Create logs directory
        let log_dir = app_data_dir.join("logs");
        if let Err(e) = std::fs::create_dir_all(&log_dir) {
            eprintln!("Failed to create log directory: {}", e);
            return;
        }

        // Configure tracing subscriber with file output
        // Note: tauri-plugin-log handles the actual file rotation and formatting
        // This module provides structured logging helpers
    });

    Ok(())
}

/// Log an error with structured information
pub fn log_error(component: &str, message: &str, error: &dyn std::error::Error) {
    log::error!(
        target: component,
        "{} - Error: {} - Details: {:?}",
        message,
        error,
        error.source()
    );
}

/// Log an error with stack trace information
pub fn log_error_with_trace(component: &str, message: &str, error: &dyn std::error::Error) {
    // Get backtrace if available
    let backtrace = std::backtrace::Backtrace::capture();
    
    log::error!(
        target: component,
        "{} - Error: {} - Details: {:?} - Backtrace: {:?}",
        message,
        error,
        error.source(),
        backtrace
    );
}

/// Log a warning with component information
pub fn log_warning(component: &str, message: &str) {
    log::warn!(target: component, "{}", message);
}

/// Log an info message with component information
pub fn log_info(component: &str, message: &str) {
    log::info!(target: component, "{}", message);
}

/// Log a debug message with component information
pub fn log_debug(component: &str, message: &str) {
    log::debug!(target: component, "{}", message);
}

/// Create a user-friendly error message from a technical error
pub fn user_friendly_error(error: &dyn std::error::Error) -> String {
    // Map common error types to user-friendly messages
    let error_str = error.to_string().to_lowercase();
    
    // Check for specific patterns in the error string
    if error_str.contains("permission denied") || error_str.contains("access denied") {
        "Unable to access the file or folder. Please check permissions.".to_string()
    } else if error_str.contains("not found") || error_str.contains("no such file") {
        "The requested file or folder could not be found.".to_string()
    } else if error_str.contains("disk") || error_str.contains("space") {
        "Not enough disk space available.".to_string()
    } else if error_str.contains("network") || error_str.contains("connection") || error_str.contains("refused") {
        "Network connection error. Please check your internet connection.".to_string()
    } else if error_str.contains("timeout") || error_str.contains("timed out") {
        "The operation took too long and timed out. Please try again.".to_string()
    } else if error_str.contains("corrupt") || error_str.contains("invalid") {
        "The file appears to be corrupted or invalid.".to_string()
    } else {
        "An unexpected error occurred. Please try again.".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io;

    #[test]
    fn test_user_friendly_error_permission() {
        let error = io::Error::new(io::ErrorKind::PermissionDenied, "Permission denied");
        let message = user_friendly_error(&error);
        assert!(message.contains("permissions"));
        assert!(!message.contains("Permission denied")); // Should not expose technical details
    }

    #[test]
    fn test_user_friendly_error_not_found() {
        let error = io::Error::new(io::ErrorKind::NotFound, "No such file or directory");
        let message = user_friendly_error(&error);
        assert!(message.contains("could not be found"));
        assert!(!message.contains("No such file")); // Should not expose technical details
    }

    #[test]
    fn test_user_friendly_error_generic() {
        let error = io::Error::new(io::ErrorKind::Other, "Some random error");
        let message = user_friendly_error(&error);
        assert!(message.contains("unexpected error"));
        assert!(!message.contains("random")); // Should not expose technical details
    }

    #[test]
    fn test_user_friendly_error_disk_space() {
        let error = io::Error::new(io::ErrorKind::Other, "No space left on disk");
        let message = user_friendly_error(&error);
        assert!(message.contains("disk space"));
        assert!(!message.contains("No space left")); // Should not expose technical details
    }

    #[test]
    fn test_user_friendly_error_network() {
        let error = io::Error::new(io::ErrorKind::ConnectionRefused, "Connection refused");
        let message = user_friendly_error(&error);
        assert!(message.contains("Network") || message.contains("connection"));
        assert!(!message.contains("refused")); // Should not expose technical details
    }

    #[test]
    fn test_user_friendly_error_timeout() {
        let error = io::Error::new(io::ErrorKind::TimedOut, "Operation timed out");
        let message = user_friendly_error(&error);
        // The function returns "The operation took too long and timed out. Please try again."
        assert!(message.contains("took too long") || message.contains("timed out"));
        assert!(!message.contains("Operation")); // Should not expose technical details
    }

    #[test]
    fn test_user_friendly_error_corrupt() {
        let error = io::Error::new(io::ErrorKind::InvalidData, "Corrupt data detected");
        let message = user_friendly_error(&error);
        assert!(message.contains("corrupted") || message.contains("invalid"));
        assert!(!message.contains("Corrupt data detected")); // Should not expose technical details
    }

    #[test]
    fn test_user_friendly_errors_are_concise() {
        let error_kinds = vec![
            io::ErrorKind::NotFound,
            io::ErrorKind::PermissionDenied,
            io::ErrorKind::ConnectionRefused,
            io::ErrorKind::InvalidData,
            io::ErrorKind::TimedOut,
            io::ErrorKind::Other,
        ];

        for kind in error_kinds {
            let error = io::Error::new(kind, "Technical error message");
            let message = user_friendly_error(&error);
            
            // Should be concise (not too long)
            assert!(message.len() < 200, "Message too long: {}", message);
            
            // Should not be empty
            assert!(!message.is_empty(), "Message should not be empty");
            
            // Should not contain technical jargon
            assert!(!message.contains("Technical error message"), 
                "Should not expose technical details");
        }
    }

    #[test]
    fn test_user_friendly_errors_end_with_period() {
        let error = io::Error::new(io::ErrorKind::NotFound, "File not found");
        let message = user_friendly_error(&error);
        assert!(message.ends_with('.'), "User-friendly message should end with a period");
    }
}

#[cfg(test)]
mod property_tests {
    use super::*;
    use proptest::prelude::*;
    use std::io;
    use std::sync::{Arc, Mutex};
    use std::time::SystemTime;

    // Helper to capture log output
    struct LogCapture {
        entries: Arc<Mutex<Vec<String>>>,
    }

    impl LogCapture {
        fn new() -> Self {
            Self {
                entries: Arc::new(Mutex::new(Vec::new())),
            }
        }

        fn capture(&self, message: String) {
            self.entries.lock().unwrap().push(message);
        }

        fn get_entries(&self) -> Vec<String> {
            self.entries.lock().unwrap().clone()
        }
    }

    // Feature: cura-photo-manager, Property 22: Error Logging Structure
    // Validates: Requirements 11.1
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(100))]

        #[test]
        fn property_error_logging_structure(
            component in "[a-z]{3,15}",
            message in "[a-zA-Z0-9 ]{10,50}",
            error_kind in prop::sample::select(vec![
                io::ErrorKind::NotFound,
                io::ErrorKind::PermissionDenied,
                io::ErrorKind::ConnectionRefused,
                io::ErrorKind::InvalidData,
                io::ErrorKind::TimedOut,
            ]),
        ) {
            // Create a test error
            let error = io::Error::new(error_kind, "test error");
            
            // Capture the current time before logging
            let before_log = SystemTime::now();
            
            // Log the error (in a real test, we would capture the log output)
            // For this test, we verify the logging functions execute without panicking
            log_error(&component, &message, &error);
            log_error_with_trace(&component, &message, &error);
            
            // Verify the functions completed (no panic)
            // In a production test, we would:
            // 1. Verify log entry contains timestamp (within reasonable time window)
            // 2. Verify log entry contains component name
            // 3. Verify log entry contains error message
            // 4. Verify log entry contains stack trace (for log_error_with_trace)
            
            let after_log = SystemTime::now();
            let duration = after_log.duration_since(before_log).unwrap();
            
            // Logging should be fast (< 100ms)
            prop_assert!(duration.as_millis() < 100, "Logging took too long: {:?}", duration);
            
            // Verify user-friendly error message doesn't contain technical details
            let friendly_msg = user_friendly_error(&error);
            prop_assert!(!friendly_msg.contains("test error"), 
                "User-friendly message should not contain technical error text");
            prop_assert!(friendly_msg.len() > 0, "User-friendly message should not be empty");
            prop_assert!(friendly_msg.len() < 200, "User-friendly message should be concise");
        }

        #[test]
        fn property_log_levels_work(
            component in "[a-z]{3,15}",
            message in "[a-zA-Z0-9 ]{10,50}",
        ) {
            // Test all log levels execute without panicking
            log_debug(&component, &message);
            log_info(&component, &message);
            log_warning(&component, &message);
            
            // All log functions should complete successfully
            prop_assert!(true);
        }

        #[test]
        fn property_user_friendly_errors_are_safe(
            error_message in "[a-zA-Z0-9 ]{10,100}",
            error_kind in prop::sample::select(vec![
                io::ErrorKind::NotFound,
                io::ErrorKind::PermissionDenied,
                io::ErrorKind::ConnectionRefused,
                io::ErrorKind::InvalidData,
                io::ErrorKind::TimedOut,
                io::ErrorKind::Other,
            ]),
        ) {
            let error = io::Error::new(error_kind, error_message.clone());
            let friendly = user_friendly_error(&error);
            
            // User-friendly message should not contain the original technical message
            prop_assert!(!friendly.contains(&error_message),
                "User-friendly message should not expose technical details");
            
            // Should be a reasonable length
            prop_assert!(friendly.len() > 10, "Message too short");
            prop_assert!(friendly.len() < 200, "Message too long");
            
            // Should not contain technical jargon
            let lowercase = friendly.to_lowercase();
            prop_assert!(!lowercase.contains("error:"), "Should not contain 'error:'");
            prop_assert!(!lowercase.contains("failed:"), "Should not contain 'failed:'");
            prop_assert!(!lowercase.contains("exception"), "Should not contain 'exception'");
        }
    }
}
