/// Performance optimization utilities for Cura Photo Manager
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Instant;

/// Performance metrics tracker
pub struct PerformanceMetrics {
    scan_time_ms: AtomicUsize,
    metadata_time_ms: AtomicUsize,
    thumbnail_time_ms: AtomicUsize,
    total_images_processed: AtomicUsize,
}

impl PerformanceMetrics {
    pub fn new() -> Self {
        Self {
            scan_time_ms: AtomicUsize::new(0),
            metadata_time_ms: AtomicUsize::new(0),
            thumbnail_time_ms: AtomicUsize::new(0),
            total_images_processed: AtomicUsize::new(0),
        }
    }

    pub fn record_scan_time(&self, duration_ms: usize) {
        self.scan_time_ms.store(duration_ms, Ordering::Relaxed);
    }

    pub fn record_metadata_time(&self, duration_ms: usize) {
        self.metadata_time_ms
            .fetch_add(duration_ms, Ordering::Relaxed);
    }

    pub fn record_thumbnail_time(&self, duration_ms: usize) {
        self.thumbnail_time_ms
            .fetch_add(duration_ms, Ordering::Relaxed);
    }

    pub fn increment_processed(&self) {
        self.total_images_processed.fetch_add(1, Ordering::Relaxed);
    }

    pub fn get_average_metadata_time(&self) -> f64 {
        let total = self.metadata_time_ms.load(Ordering::Relaxed);
        let count = self.total_images_processed.load(Ordering::Relaxed);
        if count == 0 {
            0.0
        } else {
            total as f64 / count as f64
        }
    }

    pub fn get_average_thumbnail_time(&self) -> f64 {
        let total = self.thumbnail_time_ms.load(Ordering::Relaxed);
        let count = self.total_images_processed.load(Ordering::Relaxed);
        if count == 0 {
            0.0
        } else {
            total as f64 / count as f64
        }
    }

    pub fn get_scan_time(&self) -> usize {
        self.scan_time_ms.load(Ordering::Relaxed)
    }
}

impl Default for PerformanceMetrics {
    fn default() -> Self {
        Self::new()
    }
}

/// Timer for measuring operation duration
pub struct Timer {
    start: Instant,
}

impl Timer {
    pub fn new() -> Self {
        Self {
            start: Instant::now(),
        }
    }

    pub fn elapsed_ms(&self) -> usize {
        self.start.elapsed().as_millis() as usize
    }
}

impl Default for Timer {
    fn default() -> Self {
        Self::new()
    }
}

/// Batch processor for efficient parallel processing
pub struct BatchProcessor<T> {
    batch_size: usize,
    items: Vec<T>,
}

impl<T> BatchProcessor<T> {
    pub fn new(batch_size: usize) -> Self {
        Self {
            batch_size,
            items: Vec::new(),
        }
    }

    pub fn add(&mut self, item: T) {
        self.items.push(item);
    }

    pub fn is_ready(&self) -> bool {
        self.items.len() >= self.batch_size
    }

    pub fn take_batch(&mut self) -> Vec<T> {
        let batch = self.items.drain(..self.batch_size.min(self.items.len())).collect();
        batch
    }

    pub fn remaining(&self) -> Vec<T>
    where
        T: Clone,
    {
        self.items.clone()
    }

    pub fn len(&self) -> usize {
        self.items.len()
    }

    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }
}

/// Memory usage monitor
pub struct MemoryMonitor {
    threshold_percent: f64,
}

impl MemoryMonitor {
    pub fn new(threshold_percent: f64) -> Self {
        Self { threshold_percent }
    }

    /// Check if memory usage is below threshold
    /// Returns true if safe to continue processing
    pub fn is_safe(&self) -> bool {
        // On Windows, we can use sysinfo crate for accurate memory monitoring
        // For now, we'll use a simple heuristic
        // In production, integrate with sysinfo crate
        true // Placeholder - always safe for now
    }

    pub fn get_usage_percent(&self) -> f64 {
        // Placeholder - return 0 for now
        // In production, use sysinfo to get actual memory usage
        0.0
    }
}

/// Cache for frequently accessed data
pub struct LRUCache<K, V>
where
    K: Eq + std::hash::Hash + Clone,
    V: Clone,
{
    capacity: usize,
    cache: std::collections::HashMap<K, V>,
    access_order: Vec<K>,
}

impl<K, V> LRUCache<K, V>
where
    K: Eq + std::hash::Hash + Clone,
    V: Clone,
{
    pub fn new(capacity: usize) -> Self {
        Self {
            capacity,
            cache: std::collections::HashMap::new(),
            access_order: Vec::new(),
        }
    }

    pub fn get(&mut self, key: &K) -> Option<V> {
        if let Some(value) = self.cache.get(key) {
            // Move to end (most recently used)
            self.access_order.retain(|k| k != key);
            self.access_order.push(key.clone());
            Some(value.clone())
        } else {
            None
        }
    }

    pub fn put(&mut self, key: K, value: V) {
        if self.cache.contains_key(&key) {
            // Update existing
            self.cache.insert(key.clone(), value);
            self.access_order.retain(|k| k != &key);
            self.access_order.push(key);
        } else {
            // Add new
            if self.cache.len() >= self.capacity {
                // Remove least recently used
                if let Some(lru_key) = self.access_order.first().cloned() {
                    self.cache.remove(&lru_key);
                    self.access_order.remove(0);
                }
            }
            self.cache.insert(key.clone(), value);
            self.access_order.push(key);
        }
    }

    pub fn len(&self) -> usize {
        self.cache.len()
    }

    pub fn is_empty(&self) -> bool {
        self.cache.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_performance_metrics() {
        let metrics = PerformanceMetrics::new();

        metrics.record_scan_time(1000);
        assert_eq!(metrics.get_scan_time(), 1000);

        metrics.record_metadata_time(50);
        metrics.increment_processed();
        metrics.record_metadata_time(100);
        metrics.increment_processed();

        assert_eq!(metrics.get_average_metadata_time(), 75.0);
    }

    #[test]
    fn test_timer() {
        let timer = Timer::new();
        std::thread::sleep(std::time::Duration::from_millis(10));
        assert!(timer.elapsed_ms() >= 10);
    }

    #[test]
    fn test_batch_processor() {
        let mut processor = BatchProcessor::new(3);

        processor.add(1);
        processor.add(2);
        assert!(!processor.is_ready());

        processor.add(3);
        assert!(processor.is_ready());

        let batch = processor.take_batch();
        assert_eq!(batch, vec![1, 2, 3]);
        assert!(processor.is_empty());
    }

    #[test]
    fn test_lru_cache() {
        let mut cache = LRUCache::new(2);

        cache.put("a", 1);
        cache.put("b", 2);

        assert_eq!(cache.get(&"a"), Some(1));
        assert_eq!(cache.get(&"b"), Some(2));

        // Add third item, should evict "a" since "b" was accessed more recently
        cache.put("c", 3);

        assert_eq!(cache.get(&"a"), None);
        assert_eq!(cache.get(&"b"), Some(2));
        assert_eq!(cache.get(&"c"), Some(3));
    }
}
