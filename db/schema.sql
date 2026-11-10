-- OfficeCore MySQL 8 Database Schema
-- Character set: utf8mb4, Collation: utf8mb4_unicode_ci, Timezone: UTC

CREATE DATABASE IF NOT EXISTS `officecore` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `officecore`;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'America/Mexico_City',
  `work_start` TIME NOT NULL DEFAULT '09:00:00',
  `work_end` TIME NOT NULL DEFAULT '18:00:00',
  `bedtime` TIME NOT NULL DEFAULT '23:30:00',
  `caffeine_limit_mg` INT NOT NULL DEFAULT 400,
  `caffeine_half_life_h` FLOAT NOT NULL DEFAULT 5.0,
  `settings_json` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Devices table
CREATE TABLE IF NOT EXISTS `devices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` ENUM('watch', 'phone', 'pc') NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `token_hash` VARCHAR(128) NOT NULL UNIQUE,
  `last_seen` DATETIME NULL,
  `battery_pct` INT NULL,
  `paired_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_devices_user` (`user_id`),
  CONSTRAINT `fk_devices_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pairing codes
CREATE TABLE IF NOT EXISTS `pairing_codes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `code` VARCHAR(6) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `claimed_by_device_id` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pairing_user_code` (`user_id`, `code`),
  CONSTRAINT `fk_pairing_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Calibrations
CREATE TABLE IF NOT EXISTS `calibrations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `device_id` INT NULL,
  `kind` ENUM('posture', 'typing') NOT NULL,
  `data_json` JSON NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_calibrations_user_kind` (`user_id`, `kind`),
  CONSTRAINT `fk_calibrations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Posture windows
CREATE TABLE IF NOT EXISTS `posture_windows` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ts_start` DATETIME NOT NULL,
  `duration_s` INT NOT NULL DEFAULT 5,
  `typing` BOOLEAN NOT NULL DEFAULT FALSE,
  `roll_dev` FLOAT NOT NULL DEFAULT 0.0,
  `pitch_dev` FLOAT NOT NULL DEFAULT 0.0,
  `deviation_deg` FLOAT NOT NULL DEFAULT 0.0,
  `band` ENUM('green', 'amber', 'red') NOT NULL DEFAULT 'green',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_posture_user_ts` (`user_id`, `ts_start`),
  CONSTRAINT `fk_posture_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PC activity windows (1 min rollups)
CREATE TABLE IF NOT EXISTS `pc_activity_windows` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ts_start` DATETIME NOT NULL,
  `keystrokes` INT NOT NULL DEFAULT 0,
  `keystroke_cv` FLOAT NOT NULL DEFAULT 0.0,
  `mouse_events` INT NOT NULL DEFAULT 0,
  `idle_s` INT NOT NULL DEFAULT 0,
  `app_category` ENUM('editor', 'terminal', 'browser', 'meeting', 'chat', 'other') NOT NULL DEFAULT 'other',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pc_activity_user_ts` (`user_id`, `ts_start`),
  CONSTRAINT `fk_pc_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Focus sessions
CREATE TABLE IF NOT EXISTS `focus_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NULL,
  `planned_min` INT NOT NULL,
  `interruptions` INT NOT NULL DEFAULT 0,
  `quality_score` INT NOT NULL DEFAULT 100,
  `source` ENUM('auto', 'manual') NOT NULL DEFAULT 'manual',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_focus_user_start` (`user_id`, `start_time`),
  CONSTRAINT `fk_focus_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Caffeine logs
CREATE TABLE IF NOT EXISTS `caffeine_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ts` DATETIME NOT NULL,
  `drink_type` VARCHAR(50) NOT NULL,
  `size` VARCHAR(20) NOT NULL,
  `mg` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_caffeine_user_ts` (`user_id`, `ts`),
  CONSTRAINT `fk_caffeine_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sleep logs
CREATE TABLE IF NOT EXISTS `sleep_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `bedtime` DATETIME NOT NULL,
  `wake` DATETIME NOT NULL,
  `duration_min` INT NOT NULL,
  `quality` INT NOT NULL, -- 1 to 5
  `source` ENUM('manual', 'seed') NOT NULL DEFAULT 'manual',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sleep_user_date` (`user_id`, `date`),
  CONSTRAINT `fk_sleep_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Heart samples (1 per minute)
CREATE TABLE IF NOT EXISTS `heart_samples` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ts` DATETIME NOT NULL,
  `bpm` INT NOT NULL,
  `moving` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_heart_user_ts` (`user_id`, `ts`),
  CONSTRAINT `fk_heart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stress events
CREATE TABLE IF NOT EXISTS `stress_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ts` DATETIME NOT NULL,
  `peak_bpm` INT NOT NULL,
  `baseline_bpm` INT NOT NULL,
  `trigger_tag` VARCHAR(50) NULL,
  `tagged_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_stress_user_ts` (`user_id`, `ts`),
  CONSTRAINT `fk_stress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Breathing sessions
CREATE TABLE IF NOT EXISTS `breathing_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `start_time` DATETIME NOT NULL,
  `duration_s` INT NOT NULL,
  `pattern` VARCHAR(30) NOT NULL DEFAULT '4-7-8',
  `hr_before` INT NOT NULL,
  `hr_after` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_breathing_user_start` (`user_id`, `start_time`),
  CONSTRAINT `fk_breathing_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Environment samples (every 5 min)
CREATE TABLE IF NOT EXISTS `environment_samples` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ts` DATETIME NOT NULL,
  `noise_db` FLOAT NOT NULL,
  `lux` FLOAT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_env_user_ts` (`user_id`, `ts`),
  CONSTRAINT `fk_env_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Break events
CREATE TABLE IF NOT EXISTS `break_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ts` DATETIME NOT NULL,
  `kind` ENUM('eye', 'water', 'stand', 'stretch') NOT NULL,
  `outcome` ENUM('done', 'snoozed', 'dismissed') NOT NULL DEFAULT 'done',
  `amount_ml` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_breaks_user_ts` (`user_id`, `ts`),
  CONSTRAINT `fk_breaks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alerts
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ts` DATETIME NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  `deferred_until` DATETIME NULL,
  `delivered_to` ENUM('watch', 'phone', 'both', 'none') NOT NULL DEFAULT 'watch',
  `outcome` ENUM('delivered', 'deferred', 'dropped', 'snoozed', 'dismissed', 'acted') NOT NULL DEFAULT 'delivered',
  `snooze_min` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_alerts_user_ts` (`user_id`, `ts`),
  CONSTRAINT `fk_alerts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alert rules
CREATE TABLE IF NOT EXISTS `alert_rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `intensity` ENUM('gentle', 'normal', 'strong') NOT NULL DEFAULT 'normal',
  `quiet_start` TIME NULL,
  `quiet_end` TIME NULL,
  `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  `max_per_hour` INT NOT NULL DEFAULT 4,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_alert_type` (`user_id`, `type`),
  CONSTRAINT `fk_rules_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Calendar events (metadata only)
CREATE TABLE IF NOT EXISTS `calendar_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `title_hash` VARCHAR(64) NOT NULL,
  `is_meeting` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_calendar_user_start` (`user_id`, `start_time`),
  CONSTRAINT `fk_calendar_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Energy snapshots (every 30 min)
CREATE TABLE IF NOT EXISTS `energy_snapshots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ts` DATETIME NOT NULL,
  `physical` FLOAT NOT NULL,
  `mental` FLOAT NOT NULL,
  `caffeine_load` FLOAT NOT NULL,
  `overall` FLOAT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_energy_user_ts` (`user_id`, `ts`),
  CONSTRAINT `fk_energy_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daily summaries
CREATE TABLE IF NOT EXISTS `daily_summaries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `metrics_json` JSON NOT NULL,
  `ai_json` JSON NOT NULL,
  `model` VARCHAR(50) NOT NULL DEFAULT 'gemini-3.8-flash',
  `generated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_summary_date` (`user_id`, `date`),
  CONSTRAINT `fk_summaries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat messages
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `role` ENUM('user', 'assistant') NOT NULL,
  `content` TEXT NOT NULL,
  `ts` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_chat_user_ts` (`user_id`, `ts`),
  CONSTRAINT `fk_chat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

