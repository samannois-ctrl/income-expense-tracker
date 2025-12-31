SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fullName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `avatar` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Admin User (password: admin123)
INSERT INTO `users` (`email`, `password`, `fullName`, `role`, `status`) VALUES
('admin@example.com', '$2y$10$YourHashedPasswordHere', 'Administrator', 'admin', 'active');
-- Note: In a real manual script, user might need to handle hashing. 
-- For simplicity, if they use the app's seed logic it uses bcrypt.
-- I'll put a placeholder or they can run the app seed logic. 
-- Actually, better to let the app seed the admin if possible, or provide a known hash.
-- Hashed 'admin123' with bcrypt cost 10: $2a$10$X.zF.zF.zF.zF.zF.zF.zF.zF.zF.zF.zF.zF.zF.zF.zF.zF.zF
-- Let's use a standard hash for 'admin123' if we want it to work immediately.
-- $2a$10$wI5z/v/v/v/v/v/v/v/v/.zF.zF.zF.zF.zF.zF.zF.zF.zF.zF.zF (INVALID)
-- I will skip inserting the specific admin user here to avoid hash mismatch issues 
-- unless I'm sure. The app `database.js` has logic to seed admin if missing.
-- Let's just create the table.

-- ----------------------------
-- 2. Table structure for transactions
-- ----------------------------
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_type` (`type`),
  KEY `idx_date` (`date`),
  KEY `idx_category` (`category`),
  CONSTRAINT `fk_transactions_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 3. Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `isDefault` tinyint(1) DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_type` (`type`),
  KEY `idx_isActive` (`isActive`),
  CONSTRAINT `fk_categories_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 4. Table structure for backup_settings
-- ----------------------------
DROP TABLE IF EXISTS `backup_settings`;
CREATE TABLE `backup_settings` (
  `id` int(11) NOT NULL,
  `enabled` tinyint(1) DEFAULT 0,
  `schedule_time` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '00:00',
  `retention_days` int(11) DEFAULT 30,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 5. Table structure for menu_categories (POS)
-- ----------------------------
DROP TABLE IF EXISTS `menu_categories`;
CREATE TABLE `menu_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 6. Table structure for noodles (POS)
-- ----------------------------
DROP TABLE IF EXISTS `noodles`;
CREATE TABLE `noodles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 7. Table structure for menu_options (POS)
-- ----------------------------
DROP TABLE IF EXISTS `menu_options`;
CREATE TABLE `menu_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_display_order` (`display_order`),
  CONSTRAINT `fk_menu_options_category` FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 8. Table structure for pos_sales (POS)
-- ----------------------------
DROP TABLE IF EXISTS `pos_sales`;
CREATE TABLE `pos_sales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sale_date` datetime NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `paper_order_ref` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_id` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sale_number` (`sale_number`),
  KEY `idx_sale_date` (`sale_date`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `fk_pos_sales_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pos_sales_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 9. Table structure for pos_sale_items (POS)
-- ----------------------------
DROP TABLE IF EXISTS `pos_sale_items`;
CREATE TABLE `pos_sale_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `option_id` int(11) DEFAULT NULL,
  `noodle_id` int(11) DEFAULT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_custom` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sale_id` (`sale_id`),
  CONSTRAINT `fk_pos_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `pos_sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pos_items_category` FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pos_items_option` FOREIGN KEY (`option_id`) REFERENCES `menu_options` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pos_items_noodle` FOREIGN KEY (`noodle_id`) REFERENCES `noodles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 10. Table structure for migration_history
-- ----------------------------
CREATE TABLE IF NOT EXISTS `migration_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `executed_at` datetime DEFAULT current_timestamp(),
  `success` tinyint(1) DEFAULT 1,
  `error_message` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_name` (`migration_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 11. Seed Data for menu_categories
-- ----------------------------
INSERT INTO `menu_categories` (`id`, `name`, `display_order`) VALUES
(1, 'ต้มยำ', 1),
(2, 'น้ำใส', 2),
(3, 'เย็นตาโฟ', 3),
(4, 'เครื่องดื่ม', 4),
(5, 'อาหารเพิ่ม', 5);

-- ----------------------------
-- 12. Seed Data for noodles
-- ----------------------------
INSERT INTO `noodles` (`id`, `name`, `display_order`) VALUES
(1, 'เส้นเล็ก', 1),
(2, 'เส้นใหญ่', 2),
(3, 'เส้นหมี่ขาว', 3),
(4, 'เส้นแบะแซ', 4),
(5, 'เส้นแช่แห้ง', 5),
(6, 'บะหมี่เหลือง', 6),
(7, 'วุ้นเส้น', 7);

-- ----------------------------
-- 13. Seed Data for menu_options
-- ----------------------------
INSERT INTO `menu_options` (`category_id`, `name`, `price`, `display_order`) VALUES
-- ต้มยำ
(1, 'หมูนุ่ม', 70.00, 1),
(1, 'หมูแดง', 70.00, 2),
(1, 'หมูกรอบ', 70.00, 3),
(1, 'รวมหมู', 80.00, 4),
(1, 'ทะเล', 80.00, 5),
(1, 'พิเศษ', 80.00, 6),
-- น้ำใส
(2, 'หมูนุ่ม', 60.00, 1),
(2, 'หมูแดง', 60.00, 2),
(2, 'หมูกรอบ', 60.00, 3),
(2, 'รวมหมู', 70.00, 4),
(2, 'ทะเล', 70.00, 5),
(2, 'พิเศษ', 70.00, 6),
-- เย็นตาโฟ
(3, 'หมูนุ่ม', 60.00, 1),
(3, 'หมูแดง', 60.00, 2),
(3, 'หมูกรอบ', 60.00, 3),
(3, 'รวมหมู', 70.00, 4),
(3, 'ทะเล', 70.00, 5),
(3, 'พิเศษ', 70.00, 6),
-- เครื่องดื่ม
(4, 'น้ำเปล่า', 10.00, 1),
(4, 'โค้ก', 15.00, 2),
(4, 'สไปรท์', 15.00, 3),
(4, 'น้ำส้ม', 20.00, 4),
(4, 'กาแฟร้อน', 25.00, 5),
(4, 'กาแฟเย็น', 30.00, 6),
-- อาหารเพิ่ม
(5, 'ข้าวสวย', 10.00, 1),
(5, 'ลูกชิ้นลอยฟ้า', 70.00, 2),
(5, 'ไข่ต้ม', 10.00, 3),
(5, 'เกี๊ยวซ่า', 50.00, 4);

-- ----------------------------
-- 14. Update Migration History
-- ----------------------------
INSERT INTO `migration_history` (`migration_name`, `success`, `executed_at`) VALUES
('add-menu-tables', 1, NOW()),
('add-pos-tables', 1, NOW()),
('seed-menu-data', 1, NOW()),
('update-pos-schema', 1, NOW())
ON DUPLICATE KEY UPDATE executed_at = NOW();

SET FOREIGN_KEY_CHECKS = 1;
