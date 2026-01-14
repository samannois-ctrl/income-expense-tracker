-- Backup generated at 2026-01-09T09:04:04.686Z
-- Server: MySQL/MariaDB

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;

-- Table structure for table `backup_settings`
DROP TABLE IF EXISTS `backup_settings`;
CREATE TABLE `backup_settings` (
  `id` int(11) NOT NULL,
  `enabled` tinyint(1) DEFAULT 0,
  `schedule_time` varchar(10) DEFAULT '00:00',
  `retention_days` int(11) DEFAULT 30,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `backup_settings`
INSERT INTO `backup_settings` VALUES
(1, 0, '16:10', 30);

-- Table structure for table `categories`
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `isDefault` tinyint(1) DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_type` (`type`),
  KEY `idx_isActive` (`isActive`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `categories`
INSERT INTO `categories` VALUES
(1, 1, 'เส้นใหญ่', 'expense', 1, 0, '2026-01-04 12:03:54'),
(2, 1, 'หมี่ขาว', 'expense', 1, 0, '2026-01-04 12:04:01'),
(3, 1, 'หมี่กลม', 'expense', 1, 0, '2026-01-04 12:04:06'),
(4, 1, 'หมี่หยก', 'expense', 1, 0, '2026-01-04 12:04:13'),
(5, 1, 'ลูกชิ้นหมูมนัสนัน', 'expense', 1, 0, '2026-01-04 12:04:27'),
(6, 1, 'ลูกชิ้นปลา L', 'expense', 1, 0, '2026-01-04 12:04:47'),
(7, 1, 'เกี๊ยวนำชัย', 'expense', 1, 0, '2026-01-04 12:04:59'),
(8, 1, 'หมูเด้ง', 'expense', 1, 0, '2026-01-04 12:05:09'),
(9, 1, 'น้ำมันพืชมาเลเซีย', 'expense', 1, 0, '2026-01-04 12:05:28'),
(10, 1, 'ต้นหอม', 'expense', 1, 0, '2026-01-04 12:05:37'),
(11, 1, 'ผักชี', 'expense', 1, 0, '2026-01-04 12:05:40'),
(13, 1, 'บะหมี่น้องบ่าว', 'expense', 1, 0, '2026-01-04 12:06:11'),
(14, 1, 'หมูสันนอกสไลด์', 'expense', 1, 0, '2026-01-04 12:06:30'),
(15, 1, 'ขาตั้ง', 'expense', 1, 0, '2026-01-04 12:06:44'),
(16, 1, 'ถั่วงอก', 'expense', 1, 0, '2026-01-04 12:06:56'),
(17, 1, 'แก้สหุงต้ม', 'expense', 1, 0, '2026-01-04 12:07:03'),
(18, 1, 'น้ำแข็ง', 'expense', 1, 0, '2026-01-04 12:12:04'),
(19, 1, 'เงินสด', 'income', 1, 0, '2026-01-04 12:14:11'),
(20, 1, 'เงินโอน', 'income', 1, 0, '2026-01-04 12:14:20'),
(21, 1, 'พี่ปุ๊', 'expense', 1, 0, '2026-01-04 12:14:58'),
(22, 1, 'พี่ภา', 'expense', 1, 0, '2026-01-04 12:15:07'),
(23, 1, 'โบนัสน้ำมันปาล์ม 1 ลัง 12 ถุง', 'expense', 1, 0, '2026-01-05 03:01:42'),
(24, 1, 'ข้าวแสนดี', 'expense', 1, 0, '2026-01-05 03:02:10'),
(25, 1, 'แอโร่ น้ำส้มสายชูกลั่น', 'expense', 1, 0, '2026-01-05 03:02:42'),
(26, 1, 'กวางตุ้ง', 'expense', 1, 0, '2026-01-05 03:03:24'),
(27, 1, 'เล้ง', 'expense', 1, 0, '2026-01-05 03:03:51'),
(28, 1, 'แป้งมัน', 'expense', 1, 0, '2026-01-05 03:04:34'),
(29, 1, 'น้ำพริกเผา ฉั่วฮะเส็ง', 'expense', 1, 0, '2026-01-05 03:05:20'),
(30, 1, 'หอยแมงภู่ ฝาเดียว แช่แข็ง', 'expense', 1, 0, '2026-01-05 03:05:54'),
(31, 1, 'อังคนา ซอสเย็นตาโฟ', 'expense', 1, 0, '2026-01-05 03:06:16'),
(32, 1, 'ถั่วบดละเอียด', 'expense', 1, 0, '2026-01-05 07:29:02'),
(33, 1, 'พริกน้ำส้ม', 'expense', 1, 0, '2026-01-05 07:29:19'),
(34, 1, 'เส้นเล็ก', 'expense', 1, 0, '2026-01-05 07:29:40'),
(35, 1, 'หอมใหญ่', 'expense', 1, 0, '2026-01-05 07:32:09'),
(36, 1, 'หอยแมงภู่', 'expense', 1, 0, '2026-01-05 07:32:30'),
(37, 1, 'ถุงร้อน 6X9', 'expense', 1, 0, '2026-01-05 07:33:24'),
(39, 1, 'แฟนต้าเขียว 300 ml.', 'expense', 1, 0, '2026-01-05 09:36:22'),
(40, 1, 'โค้ก 300 ml', 'expense', 1, 0, '2026-01-05 09:37:28'),
(41, 1, 'น้ำทิพย์ 550 ml', 'expense', 1, 0, '2026-01-05 09:37:52'),
(42, 1, 'ผักชีใบเลื่อย', 'expense', 1, 0, '2026-01-07 02:52:08'),
(43, 1, 'วุ้นเส้น แชมป์', 'expense', 1, 0, '2026-01-07 02:53:44'),
(44, 1, 'เห็ดขาว', 'expense', 1, 0, '2026-01-07 02:54:38'),
(45, 1, 'สามชั้นแผ่น', 'expense', 1, 0, '2026-01-07 11:30:38'),
(46, 1, 'หมูบด', 'expense', 1, 0, '2026-01-07 11:32:04'),
(47, 1, 'ไข่ไก่เบอร์ 4', 'expense', 1, 0, '2026-01-08 07:36:13'),
(48, 1, 'ผงชูรส', 'expense', 1, 0, '2026-01-08 11:47:42'),
(49, 1, 'กระเทียมไทย', 'expense', 1, 0, '2026-01-08 11:47:55'),
(50, 1, 'ซอสฝาเขียว', 'expense', 1, 0, '2026-01-08 11:48:52'),
(51, 1, 'น้ำตาลทรายแดง', 'expense', 1, 0, '2026-01-09 14:55:25'),
(52, 1, 'น้ำตาลกรวด', 'expense', 1, 0, '2026-01-09 14:55:47'),
(53, 1, 'พริกนำส้มซอง', 'expense', 1, 0, '2026-01-09 14:56:13'),
(54, 1, 'มาม่า FF', 'expense', 1, 0, '2026-01-09 14:56:25'),
(55, 1, 'ฟักเขียว', 'expense', 1, 0, '2026-01-09 14:56:40'),
(56, 1, 'ผงน้ำเก็กฮวย', 'expense', 1, 0, '2026-01-09 14:57:30'),
(57, 1, 'ผงน้ำอัญชันเลมอน', 'expense', 1, 0, '2026-01-09 14:58:00'),
(58, 1, 'ผงน้ำตะไคร้ใบเตย', 'expense', 1, 0, '2026-01-09 14:58:32');

-- Table structure for table `menu_categories`
DROP TABLE IF EXISTS `menu_categories`;
CREATE TABLE `menu_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `menu_categories`
INSERT INTO `menu_categories` VALUES
(1, 'ก๋วยเตี๋ยว', 0, 1, '2026-01-01 13:48:26'),
(2, 'อาหารทานเล่น', 3, 1, '2026-01-01 13:48:26'),
(3, 'เครื่องดื่ม', 4, 1, '2026-01-01 13:48:26'),
(4, 'อาหารตามสั่ง', 2, 1, '2026-01-01 13:57:48'),
(5, 'เกาเหลา', 1, 1, '2026-01-01 14:42:08'),
(6, 'เล้งแซ่บ', 0, 1, '2026-01-01 14:43:16'),
(7, 'ข้าวสวย/เส้นเปล่า/เส้นบะหมี่', 0, 1, '2026-01-01 15:00:01');

-- Table structure for table `menu_option_config`
DROP TABLE IF EXISTS `menu_option_config`;
CREATE TABLE `menu_option_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `menu_id` int(11) NOT NULL,
  `option_group_id` int(11) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_required` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_menu_group` (`menu_id`,`option_group_id`),
  KEY `option_group_id` (`option_group_id`),
  CONSTRAINT `menu_option_config_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE,
  CONSTRAINT `menu_option_config_ibfk_2` FOREIGN KEY (`option_group_id`) REFERENCES `option_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `menu_option_config`
INSERT INTO `menu_option_config` VALUES
(3, 5, 5, 1, 1, '2026-01-01 14:51:52'),
(4, 5, 6, 2, 1, '2026-01-01 14:51:54'),
(8, 13, 6, 1, 1, '2026-01-01 14:54:19'),
(10, 13, 7, 3, 1, '2026-01-01 14:54:23'),
(13, 12, 5, 1, 1, '2026-01-01 14:55:40'),
(14, 12, 6, 2, 1, '2026-01-01 14:55:40'),
(18, 15, 8, 1, 1, '2026-01-01 14:57:48'),
(19, 7, 5, 1, 1, '2026-01-01 14:57:56'),
(21, 7, 7, 3, 1, '2026-01-01 14:57:57'),
(23, 11, 5, 1, 1, '2026-01-01 14:58:27'),
(24, 11, 7, 2, 1, '2026-01-01 14:58:28'),
(27, 10, 5, 1, 1, '2026-01-01 14:58:34'),
(28, 10, 6, 2, 1, '2026-01-01 14:58:34'),
(31, 8, 5, 1, 1, '2026-01-01 14:58:47'),
(32, 8, 6, 2, 1, '2026-01-01 14:58:48'),
(34, 6, 5, 1, 1, '2026-01-01 14:58:54'),
(35, 6, 6, 2, 1, '2026-01-01 14:58:55'),
(38, 16, 9, 1, 1, '2026-01-01 14:59:13'),
(40, 14, 6, 2, 1, '2026-01-01 14:59:21'),
(41, 14, 7, 3, 1, '2026-01-01 14:59:22'),
(43, 17, 9, 1, 1, '2026-01-01 15:01:51'),
(44, 18, 9, 1, 1, '2026-01-01 15:01:54'),
(45, 19, 9, 1, 1, '2026-01-01 15:01:57'),
(49, 20, 5, 1, 1, '2026-01-01 15:31:08'),
(50, 20, 7, 2, 1, '2026-01-01 15:31:09'),
(51, 9, 5, 1, 1, '2026-01-01 16:01:36'),
(53, 9, 7, 2, 1, '2026-01-01 16:01:40'),
(54, 12, 9, 3, 1, '2026-01-01 20:32:59'),
(55, 6, 8, 3, 1, '2026-01-01 20:33:13'),
(59, 14, 9, 4, 1, '2026-01-01 20:34:02'),
(60, 5, 11, 3, 1, '2026-01-04 08:06:26'),
(62, 16, 12, 2, 1, '2026-01-04 08:06:33'),
(63, 12, 12, 4, 1, '2026-01-04 08:06:41'),
(64, 12, 11, 5, 1, '2026-01-04 08:06:43'),
(65, 7, 11, 4, 1, '2026-01-04 08:06:46'),
(66, 7, 12, 5, 1, '2026-01-04 08:06:48'),
(67, 8, 11, 3, 1, '2026-01-04 08:07:00'),
(68, 8, 12, 4, 1, '2026-01-04 08:07:01'),
(69, 9, 12, 3, 1, '2026-01-04 08:07:04'),
(70, 10, 11, 3, 1, '2026-01-04 08:07:40'),
(71, 10, 12, 4, 1, '2026-01-04 08:07:42'),
(72, 11, 11, 3, 1, '2026-01-04 08:07:46'),
(73, 11, 12, 4, 1, '2026-01-04 08:07:47'),
(74, 14, 12, 5, 1, '2026-01-04 08:07:51');

-- Table structure for table `menu_variants`
DROP TABLE IF EXISTS `menu_variants`;
CREATE TABLE `menu_variants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `menu_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price_regular` decimal(10,2) NOT NULL DEFAULT 0.00,
  `price_special` decimal(10,2) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_menu_id` (`menu_id`),
  KEY `idx_display_order` (`display_order`),
  CONSTRAINT `menu_variants_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `menus`
DROP TABLE IF EXISTS `menus`;
CREATE TABLE `menus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `base_price` decimal(10,2) DEFAULT 0.00,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `menus_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `menus`
INSERT INTO `menus` VALUES
(5, 1, 'ก๋วยเตี๋ยวต้มยำหมู', 60, 0, 1, '2026-01-01 14:02:37'),
(6, 1, 'ก๋วยเตี๋ยวน้ำใส', 60, 10, 1, '2026-01-01 14:29:16'),
(7, 1, 'ก๋วยเตี๋ยมต้มยำทะเล', 70, 9, 1, '2026-01-01 14:34:13'),
(8, 1, 'เตี๋ยวเย็นตาโฟ', 60, 12, 1, '2026-01-01 14:38:53'),
(9, 1, 'เตี๋ยวเย็นตาโฟทะเล', 70, 13, 1, '2026-01-01 14:39:11'),
(10, 1, 'เตี๋ยวเย็นตาโฟต้มยำ รวมหมู', 70, 14, 1, '2026-01-01 14:39:30'),
(11, 1, 'เตี๋ยวเย็นตาโฟต้มยำ ทะเล', 70, 15, 1, '2026-01-01 14:39:58'),
(12, 1, 'เตี๋ยวเย็นตาโฟต้มยำ', 60, 8, 1, '2026-01-01 14:40:51'),
(13, 5, 'เกาเหลา น้ำใส', 70, 1, 1, '2026-01-01 14:42:31'),
(14, 5, 'เกาเหลา ต้มยำ', 70, 2, 1, '2026-01-01 14:42:39'),
(15, 2, 'ลูกชิ้นลวกจิ้ม', 50, 3, 1, '2026-01-01 14:42:52'),
(16, 6, 'เล้งแซ่บ', 80, 4, 1, '2026-01-01 14:43:33'),
(17, 7, 'ข้าวสวย', 10, 5, 1, '2026-01-01 15:00:08'),
(18, 7, 'เส้นเปล่า', 10, 6, 1, '2026-01-01 15:00:16'),
(19, 7, 'เส้นบะหมี่', 15, 7, 1, '2026-01-01 15:00:21'),
(20, 1, 'ก๋วยเตี๋ยวน้ำใส ทะเล', 70, 11, 1, '2026-01-01 15:30:48');

-- Table structure for table `migration_history`
DROP TABLE IF EXISTS `migration_history`;
CREATE TABLE `migration_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) NOT NULL,
  `executed_at` datetime DEFAULT current_timestamp(),
  `success` tinyint(1) DEFAULT 1,
  `error_message` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_name` (`migration_name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `migration_history`
INSERT INTO `migration_history` VALUES
(1, 'add-menu-tables', '2025-12-31 15:47:25', 1, NULL),
(2, 'add-pos-tables', '2025-12-31 15:47:25', 1, NULL),
(3, 'seed-menu-data', '2025-12-31 15:47:25', 1, NULL),
(4, 'update-pos-schema', '2025-12-31 15:47:25', 1, NULL),
(5, 'add-username-column', '2025-12-31 17:14:39', 1, NULL);

-- Table structure for table `option_groups`
DROP TABLE IF EXISTS `option_groups`;
CREATE TABLE `option_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `selection_type` varchar(20) DEFAULT 'single' COMMENT 'single, multiple',
  `is_optional` tinyint(1) DEFAULT 0,
  `display_order` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `option_groups`
INSERT INTO `option_groups` VALUES
(5, 'เส้นก๋วยเตี๋ยว', 'single', 0, 0, '2026-01-01 14:03:54'),
(6, 'หมู', 'single', 1, 0, '2026-01-01 14:05:04'),
(7, 'ทะเล', 'single', 1, 0, '2026-01-01 14:26:39'),
(8, 'ลูกชิ้น', 'single', 1, 0, '2026-01-01 14:28:18'),
(9, 'ข้าวสวย / เส้น', 'multiple', 1, 0, '2026-01-01 14:36:00'),
(11, 'น้ำ/แห้ง', 'single', 1, 0, '2026-01-04 08:05:11'),
(12, 'ระดับเผ็ด', 'single', 1, 0, '2026-01-04 08:05:52');

-- Table structure for table `options`
DROP TABLE IF EXISTS `options`;
CREATE TABLE `options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price_adjustment` decimal(10,2) DEFAULT 0.00,
  `is_available` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `options_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `option_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `options`
INSERT INTO `options` VALUES
(7, 5, 'เส้นเล็ก', 0, 1, 0, '2026-01-01 14:04:05'),
(8, 5, 'เส้นใหญ่', 0, 1, 0, '2026-01-01 14:04:12'),
(9, 5, 'เส้นหมี่ขาว', 0, 1, 0, '2026-01-01 14:04:20'),
(10, 5, 'เส้นบะหมี่เหลือง', 0, 1, 0, '2026-01-01 14:04:27'),
(11, 5, 'เส้นบะหมี่หยก', 0, 1, 0, '2026-01-01 14:04:34'),
(12, 5, 'วุ้นเส้น', 0, 1, 0, '2026-01-01 14:04:43'),
(13, 5, 'มาม่า', 0, 1, 0, '2026-01-01 14:04:50'),
(14, 6, 'หมูนุ่ม', 0, 1, 0, '2026-01-01 14:05:20'),
(15, 6, 'หมูแดง', 0, 1, 0, '2026-01-01 14:05:26'),
(16, 6, 'หมูกรอบ', 0, 1, 0, '2026-01-01 14:05:36'),
(17, 6, 'หมูนุ่ม/หมูแดง', 0, 1, 0, '2026-01-01 14:05:44'),
(18, 6, 'หมูนุ่ม/หมูกรอบ', 0, 1, 0, '2026-01-01 14:05:54'),
(19, 6, 'หมูแดงหมูกรอบ', 0, 1, 0, '2026-01-01 14:06:05'),
(20, 6, 'รวมหมู', 10, 1, 0, '2026-01-01 14:07:30'),
(21, 7, 'ทะเล', 0, 1, 0, '2026-01-01 14:26:54'),
(22, 7, 'ทะเลพิเศษ', 10, 1, 0, '2026-01-01 14:27:04'),
(23, 7, 'รวมหมู+ทะเล', 10, 1, 0, '2026-01-01 14:27:22'),
(24, 8, 'ลูกชิ้นหมู', 0, 1, 0, '2026-01-01 14:28:27'),
(25, 8, 'ลูกชิ้นปลา', 0, 1, 0, '2026-01-01 14:28:33'),
(26, 8, 'ไม่ใส่ลูกชิ้น', 0, 1, 0, '2026-01-01 14:28:40'),
(27, 8, 'พิเศษลูกชิ้น', 10, 1, 0, '2026-01-01 14:32:37'),
(28, 9, 'ข้าวสวย', 10, 1, 0, '2026-01-01 14:36:16'),
(29, 9, 'เส้นหมี่ขาวลวก', 10, 1, 0, '2026-01-01 14:36:49'),
(30, 9, 'เส้นหมี่เหลืองลวก', 15, 1, 0, '2026-01-01 14:37:03'),
(31, 9, 'เส้นบะหมี่หยก', 10, 1, 0, '2026-01-01 14:37:16'),
(32, 9, 'เส้นมาม่าลวก', 10, 1, 0, '2026-01-01 14:37:45'),
(33, 8, 'ลูกชิ้นหมู+ลูกชิ้นปลา', 10, 1, 0, '2026-01-01 14:44:00'),
(34, 11, 'น้ำ', 0, 1, 0, '2026-01-04 08:05:21'),
(35, 11, 'แห้ง', 0, 1, 0, '2026-01-04 08:05:27'),
(36, 11, 'ขลุกขลิก', 0, 1, 0, '2026-01-04 08:05:34'),
(37, 12, 'ไม่เผ็ด', 0, 1, 0, '2026-01-04 08:05:58'),
(38, 12, 'เผ็ดน้อย', 0, 1, 0, '2026-01-04 08:06:04'),
(39, 12, 'เผ็ดปานกลาง', 0, 1, 0, '2026-01-04 08:06:10'),
(40, 12, 'เผ็ดมาก', 0, 1, 0, '2026-01-04 08:06:14'),
(41, 12, 'เผ็ดโลกระเบิด', 0, 1, 0, '2026-01-04 08:06:21');

-- Table structure for table `pos_sale_items`
DROP TABLE IF EXISTS `pos_sale_items`;
CREATE TABLE `pos_sale_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `option_id` int(11) DEFAULT NULL,
  `noodle_id` int(11) DEFAULT NULL,
  `item_name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `is_custom` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sale_id` (`sale_id`),
  KEY `fk_pos_items_category` (`category_id`),
  KEY `fk_pos_items_option` (`option_id`),
  KEY `fk_pos_items_noodle` (`noodle_id`),
  CONSTRAINT `fk_pos_items_category` FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pos_items_noodle` FOREIGN KEY (`noodle_id`) REFERENCES `noodles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pos_items_option` FOREIGN KEY (`option_id`) REFERENCES `menu_options` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pos_items_sale` FOREIGN KEY (`sale_id`) REFERENCES `pos_sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `pos_sales`
DROP TABLE IF EXISTS `pos_sales`;
CREATE TABLE `pos_sales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sale_number` varchar(100) NOT NULL,
  `sale_date` datetime NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT 'cash',
  `paper_order_ref` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `transaction_id` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sale_number` (`sale_number`),
  KEY `idx_sale_date` (`sale_date`),
  KEY `idx_created_by` (`created_by`),
  KEY `fk_pos_sales_transaction` (`transaction_id`),
  CONSTRAINT `fk_pos_sales_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pos_sales_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `sale_items`
DROP TABLE IF EXISTS `sale_items`;
CREATE TABLE `sale_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `saleId` int(11) NOT NULL,
  `menu_id` int(11) DEFAULT NULL,
  `itemName` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL,
  `base_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `options_json` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `option_id` int(11) DEFAULT NULL,
  `noodle_id` int(11) DEFAULT NULL,
  `is_custom` tinyint(1) DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  `is_cancelled` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `option_id` (`option_id`),
  KEY `noodle_id` (`noodle_id`),
  KEY `idx_saleId` (`saleId`),
  KEY `menu_id` (`menu_id`),
  CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`saleId`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `menu_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sale_items_ibfk_3` FOREIGN KEY (`option_id`) REFERENCES `menu_options` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sale_items_ibfk_4` FOREIGN KEY (`noodle_id`) REFERENCES `noodles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sale_items_ibfk_5` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `sale_items`
INSERT INTO `sale_items` VALUES
(1, 13, 11, 'เตี๋ยวเย็นตาโฟต้มยำ ทะเล (เส้นเล็ก, รวมหมู+ทะเล)', 1, 70, 80, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":"0.00"},{"groupId":7,"optionId":23,"name":"รวมหมู+ทะเล","price":"10.00"}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 20:14:53', 0),
(2, 14, 12, 'เตี๋ยวเย็นตาโฟต้มยำ (เส้นเล็ก, หมูกรอบ)', 1, 60, 60, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":"0.00"},{"groupId":6,"optionId":16,"name":"หมูกรอบ","price":"0.00"}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 20:15:11', 0),
(3, 14, 7, 'ก๋วยเตี๋ยมต้มยำทะเล (วุ้นเส้น, รวมหมู+ทะเล)', 1, 70, 80, '[{"groupId":5,"optionId":12,"name":"วุ้นเส้น","price":"0.00"},{"groupId":7,"optionId":23,"name":"รวมหมู+ทะเล","price":"10.00"}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 20:15:37', 0),
(4, 15, 5, 'ก๋วยเตี๋ยวต้มยำหมู (กลับบ้าน, เส้นเล็ก, หมูแดงหมูกรอบ)', 1, 60, 60, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":"0.00"},{"groupId":6,"optionId":19,"name":"หมูแดงหมูกรอบ","price":"0.00"}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 20:18:32', 0),
(5, 16, 9, 'เตี๋ยวเย็นตาโฟทะเล (เส้นเล็ก, ทะเลพิเศษ)', 1, 70, 80, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":"0.00"},{"groupId":7,"optionId":22,"name":"ทะเลพิเศษ","price":"10.00"}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 20:19:05', 0),
(6, 17, 12, 'เตี๋ยวเย็นตาโฟต้มยำ (กลับบ้าน, เส้นเล็ก, หมูแดง)', 2, 60, 120, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":"0.00"},{"groupId":6,"optionId":15,"name":"หมูแดง","price":"0.00"}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 20:19:33', 0),
(7, 18, 12, 'เตี๋ยวเย็นตาโฟต้มยำ (กลับบ้าน, วุ้นเส้น)', 1, 60, 60, '[{"groupId":5,"optionId":12,"name":"วุ้นเส้น","price":"0.00"}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 20:24:12', 0),
(8, 19, 6, 'ก๋วยเตี๋ยวน้ำใส (กลับบ้าน, เส้นเล็ก, หมูนุ่ม/หมูแดง, ทะเลพิเศษ)', 1, 60, 70, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":"0.00"},{"groupId":6,"optionId":17,"name":"หมูนุ่ม/หมูแดง","price":"0.00"},{"groupId":7,"optionId":22,"name":"ทะเลพิเศษ","price":"10.00"}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 20:24:31', 0),
(9, 20, 14, 'เกาเหลา ต้มยำ (รวมหมู+ทะเล, ข้าวสวย)', 1, 70, 90, '[{"groupId":7,"optionId":23,"name":"รวมหมู+ทะเล","price":10},{"groupId":9,"optionId":28,"name":"ข้าวสวย","price":10}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 20:36:43', 0),
(10, 21, 7, 'ก๋วยเตี๋ยมต้มยำทะเล (มาม่า, รวมหมู+ทะเล)', 1, 70, 80, '[{"groupId":5,"optionId":13,"name":"มาม่า","price":0},{"groupId":7,"optionId":23,"name":"รวมหมู+ทะเล","price":10}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 20:40:10', 0),
(11, 22, 12, 'เตี๋ยวเย็นตาโฟต้มยำ (กลับบ้าน, เส้นเล็ก, หมูแดง)', 1, 60, 60, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0},{"groupId":6,"optionId":15,"name":"หมูแดง","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 20:48:39', 1),
(12, 23, 7, 'ก๋วยเตี๋ยมต้มยำทะเล (เส้นใหญ่)', 1, 70, 70, '[{"groupId":5,"optionId":8,"name":"เส้นใหญ่","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 21:17:07', 0),
(13, 24, 5, 'ก๋วยเตี๋ยวต้มยำหมู (เส้นเล็ก, รวมหมู)', 1, 60, 70, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0},{"groupId":6,"optionId":20,"name":"รวมหมู","price":10}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 22:30:12', 0),
(14, 24, 7, 'ก๋วยเตี๋ยมต้มยำทะเล (เส้นใหญ่, ทะเลพิเศษ)', 1, 70, 80, '[{"groupId":5,"optionId":8,"name":"เส้นใหญ่","price":0},{"groupId":7,"optionId":22,"name":"ทะเลพิเศษ","price":10}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 22:30:25', 0),
(15, 25, 5, 'ก๋วยเตี๋ยวต้มยำหมู (กลับบ้าน, เส้นเล็ก, หมูแดง)', 1, 60, 60, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0},{"groupId":6,"optionId":15,"name":"หมูแดง","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 22:31:00', 1),
(16, 25, 7, 'ก๋วยเตี๋ยมต้มยำทะเล (กลับบ้าน, วุ้นเส้น)', 1, 70, 70, '[{"groupId":5,"optionId":12,"name":"วุ้นเส้น","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 22:31:00', 0),
(17, 25, 20, 'ก๋วยเตี๋ยวน้ำใส ทะเล (กลับบ้าน, เส้นใหญ่, รวมหมู+ทะเล)', 1, 70, 80, '[{"groupId":5,"optionId":8,"name":"เส้นใหญ่","price":0},{"groupId":7,"optionId":23,"name":"รวมหมู+ทะเล","price":10}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 22:31:00', 0),
(18, 26, 12, 'เตี๋ยวเย็นตาโฟต้มยำ (เส้นเล็ก, หมูกรอบ)', 1, 60, 60, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0},{"groupId":6,"optionId":16,"name":"หมูกรอบ","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-01 22:48:56', 1),
(19, 15, 7, 'ก๋วยเตี๋ยมต้มยำทะเล (กลับบ้าน, เส้นใหญ่, ทะเลพิเศษ)', 1, 70, 80, '[{"groupId":5,"optionId":8,"name":"เส้นใหญ่","price":0},{"groupId":7,"optionId":22,"name":"ทะเลพิเศษ","price":10}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-03 09:25:02', 0),
(20, 27, 8, 'เตี๋ยวเย็นตาโฟ (กลับบ้าน, เส้นเล็ก, หมูแดง)', 1, 60, 60, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0},{"groupId":6,"optionId":15,"name":"หมูแดง","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-03 09:26:42', 0),
(21, 28, 12, 'เตี๋ยวเย็นตาโฟต้มยำ (เส้นเล็ก, หมูแดงหมูกรอบ)', 1, 60, 60, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0},{"groupId":6,"optionId":19,"name":"หมูแดงหมูกรอบ","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-03 09:27:59', 1),
(22, 28, 7, 'ก๋วยเตี๋ยมต้มยำทะเล (เส้นหมี่ขาว, รวมหมู+ทะเล)', 1, 70, 80, '[{"groupId":5,"optionId":9,"name":"เส้นหมี่ขาว","price":0},{"groupId":7,"optionId":23,"name":"รวมหมู+ทะเล","price":10}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-03 09:38:47', 1),
(23, 29, 7, 'ก๋วยเตี๋ยมต้มยำทะเล (เส้นใหญ่, ทะเลพิเศษ, แห้ง)', 1, 70, 80, '[{"groupId":5,"optionId":8,"name":"เส้นใหญ่","price":0},{"groupId":7,"optionId":22,"name":"ทะเลพิเศษ","price":10},{"groupId":11,"optionId":35,"name":"แห้ง","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 08:08:47', 0),
(24, 30, 5, 'ก๋วยเตี๋ยวต้มยำหมู (เส้นเล็ก)', 1, 60, 60, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 12:59:40', 0),
(25, 31, 12, 'เตี๋ยวเย็นตาโฟต้มยำ (เส้นเล็ก, หมูแดง, เผ็ดน้อย, แห้ง)', 1, 60, 60, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0},{"groupId":6,"optionId":15,"name":"หมูแดง","price":0},{"groupId":11,"optionId":35,"name":"แห้ง","price":0},{"groupId":12,"optionId":38,"name":"เผ็ดน้อย","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 15:08:12', 0),
(26, 31, 7, 'ก๋วยเตี๋ยมต้มยำทะเล (มาม่า, รวมหมู+ทะเล, เผ็ดปานกลาง)', 1, 70, 80, '[{"groupId":5,"optionId":13,"name":"มาม่า","price":0},{"groupId":7,"optionId":23,"name":"รวมหมู+ทะเล","price":10},{"groupId":12,"optionId":39,"name":"เผ็ดปานกลาง","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 15:08:12', 1),
(27, 32, 7, 'ก๋วยเตี๋ยมต้มยำทะเล (เส้นใหญ่, ทะเลพิเศษ, เผ็ดน้อย)', 1, 70, 80, '[{"groupId":5,"optionId":8,"name":"เส้นใหญ่","price":0},{"groupId":7,"optionId":22,"name":"ทะเลพิเศษ","price":10},{"groupId":12,"optionId":38,"name":"เผ็ดน้อย","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 15:08:57', 0),
(28, 33, 12, 'เตี๋ยวเย็นตาโฟต้มยำ (วุ้นเส้น, หมูแดง, เส้นหมี่ขาวลวก, เผ็ดน้อย)', 1, 60, 70, '[{"groupId":5,"optionId":12,"name":"วุ้นเส้น","price":0},{"groupId":6,"optionId":15,"name":"หมูแดง","price":0},{"groupId":9,"optionId":29,"name":"เส้นหมี่ขาวลวก","price":10},{"groupId":12,"optionId":38,"name":"เผ็ดน้อย","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 15:27:17', 1),
(29, 34, 5, 'ก๋วยเตี๋ยวต้มยำหมู (เส้นเล็ก, น้ำ)', 1, 60, 60, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0},{"groupId":11,"optionId":34,"name":"น้ำ","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 15:30:20', 1),
(30, 35, 16, 'เล้งแซ่บ (เผ็ดมาก)', 1, 80, 80, '[{"groupId":12,"optionId":40,"name":"เผ็ดมาก","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 15:31:24', 1),
(31, 36, 5, 'ก๋วยเตี๋ยวต้มยำหมู (เส้นเล็ก)', 1, 60, 60, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 15:57:00', 1),
(32, 37, 7, 'ก๋วยเตี๋ยมต้มยำทะเล (มาม่า, รวมหมู+ทะเล, ขลุกขลิก, เผ็ดปานกลาง)', 1, 70, 80, '[{"groupId":5,"optionId":13,"name":"มาม่า","price":0},{"groupId":7,"optionId":23,"name":"รวมหมู+ทะเล","price":10},{"groupId":11,"optionId":36,"name":"ขลุกขลิก","price":0},{"groupId":12,"optionId":39,"name":"เผ็ดปานกลาง","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 16:07:15', 0),
(33, 37, 6, 'ก๋วยเตี๋ยวน้ำใส (เส้นใหญ่, หมูแดง, ลูกชิ้นปลา)', 1, 60, 60, '[{"groupId":5,"optionId":8,"name":"เส้นใหญ่","price":0},{"groupId":6,"optionId":15,"name":"หมูแดง","price":0},{"groupId":8,"optionId":25,"name":"ลูกชิ้นปลา","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 16:07:15', 0),
(34, 37, 9, 'เตี๋ยวเย็นตาโฟทะเล (เส้นเล็ก, ทะเลพิเศษ, เผ็ดน้อย)', 1, 70, 80, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0},{"groupId":7,"optionId":22,"name":"ทะเลพิเศษ","price":10},{"groupId":12,"optionId":38,"name":"เผ็ดน้อย","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 16:07:15', 0),
(35, 38, 5, 'ก๋วยเตี๋ยวต้มยำหมู (เส้นเล็ก, หมูนุ่ม, น้ำ)', 1, 60, 60, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0},{"groupId":6,"optionId":14,"name":"หมูนุ่ม","price":0},{"groupId":11,"optionId":34,"name":"น้ำ","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 16:17:05', 1),
(36, 39, 5, 'ก๋วยเตี๋ยวต้มยำหมู (เส้นเล็ก, หมูนุ่ม)', 1, 60, 60, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0},{"groupId":6,"optionId":14,"name":"หมูนุ่ม","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-04 16:29:11', 1),
(37, 40, 5, 'ก๋วยเตี๋ยวต้มยำหมู (เส้นเล็ก, รวมหมู, น้ำ)', 1, 60, 70, '[{"groupId":5,"optionId":7,"name":"เส้นเล็ก","price":0},{"groupId":6,"optionId":20,"name":"รวมหมู","price":10},{"groupId":11,"optionId":34,"name":"น้ำ","price":0}]', NULL, 0, NULL, NULL, NULL, 0, '2026-01-07 12:49:41', 0);

-- Table structure for table `sales`
DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `totalAmount` decimal(10,2) NOT NULL,
  `paymentMethod` varchar(50) DEFAULT 'cash',
  `customerName` varchar(255) DEFAULT NULL,
  `paper_order_ref` varchar(50) DEFAULT NULL,
  `table_id` int(11) DEFAULT NULL,
  `order_type` varchar(20) DEFAULT 'dine_in',
  `status` enum('open','completed','cancelled') DEFAULT 'open',
  `notes` text DEFAULT NULL,
  `saleDate` datetime DEFAULT current_timestamp(),
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_saleDate` (`saleDate`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `sales`
INSERT INTO `sales` VALUES
(13, 1, 80, 'cash', NULL, 'SALE-20260101-3610', 1, 'dine_in', 'cancelled', NULL, '2026-01-01 20:14:53', '2026-01-01 20:14:53'),
(14, 1, 140, 'cash', NULL, 'SALE-20260101-1182', 2, 'dine_in', 'cancelled', NULL, '2026-01-01 20:15:11', '2026-01-01 20:15:11'),
(15, 1, 140, 'cash', NULL, 'SALE-20260101-2180', NULL, 'take_away', 'cancelled', NULL, '2026-01-01 20:18:32', '2026-01-01 20:18:32'),
(16, 1, 80, 'cash', NULL, 'SALE-20260101-5687', 1, 'dine_in', 'cancelled', NULL, '2026-01-01 20:19:05', '2026-01-01 20:19:05'),
(17, 1, 120, 'cash', NULL, 'SALE-20260101-3738', NULL, 'take_away', 'cancelled', NULL, '2026-01-01 20:19:33', '2026-01-01 20:19:33'),
(18, 1, 60, 'cash', NULL, 'SALE-20260101-2578', NULL, 'take_away', 'cancelled', NULL, '2026-01-01 20:24:12', '2026-01-01 20:24:12'),
(19, 1, 70, 'cash', NULL, 'SALE-20260101-1545', NULL, 'take_away', 'cancelled', NULL, '2026-01-01 20:24:31', '2026-01-01 20:24:31'),
(20, 1, 90, 'cash', NULL, 'SALE-20260101-3959', 1, 'dine_in', 'cancelled', NULL, '2026-01-01 20:36:43', '2026-01-01 20:36:43'),
(21, 1, 80, 'cash', NULL, 'SALE-20260101-0142', 3, 'dine_in', 'cancelled', NULL, '2026-01-01 20:40:10', '2026-01-01 20:40:10'),
(22, 1, 0, 'cash', NULL, 'SALE-20260101-9513', NULL, 'take_away', 'cancelled', NULL, '2026-01-01 20:48:39', '2026-01-01 20:48:39'),
(23, 1, 70, 'cash', NULL, 'SALE-20260101-7942', 10, 'dine_in', 'cancelled', NULL, '2026-01-01 21:17:07', '2026-01-01 21:17:07'),
(24, 1, 150, 'cash', NULL, 'SALE-20260101-2197', 1, 'dine_in', 'cancelled', NULL, '2026-01-01 22:30:12', '2026-01-01 22:30:12'),
(25, 1, 150, 'cash', NULL, 'SALE-20260101-0626', NULL, 'take_away', 'cancelled', NULL, '2026-01-01 22:31:00', '2026-01-01 22:31:00'),
(26, 1, 0, 'cash', NULL, 'SALE-20260101-6612', 2, 'dine_in', 'cancelled', NULL, '2026-01-01 22:48:56', '2026-01-01 22:48:56'),
(27, 1, 60, 'cash', '99', 'SALE-20260103-2440', NULL, 'take_away', 'cancelled', NULL, '2026-01-03 09:26:42', '2026-01-03 09:26:42'),
(28, 1, 0, 'cash', '99', 'SALE-20260103-9906', 3, 'dine_in', 'cancelled', NULL, '2026-01-03 09:27:59', '2026-01-03 09:27:59'),
(29, 1, 80, 'cash', NULL, 'SALE-20260104-7693', 2, 'dine_in', 'cancelled', NULL, '2026-01-04 08:08:47', '2026-01-04 08:08:47'),
(30, 1, 60, 'cash', 'Quick Sale', 'SALE-20260104-0141', NULL, 'quick_sale', 'cancelled', NULL, '2026-01-04 12:59:40', '2026-01-04 12:59:40'),
(31, 1, 60, 'cash', 'Quick Sale', 'SALE-20260104-2706', NULL, 'quick_sale', 'cancelled', NULL, '2026-01-04 15:08:12', '2026-01-04 15:08:12'),
(32, 1, 80, 'cash', 'Quick Sale', 'SALE-20260104-7192', NULL, 'quick_sale', 'cancelled', NULL, '2026-01-04 15:08:57', '2026-01-04 15:08:57'),
(33, 1, 0, 'cash', 'Quick Sale', 'SALE-20260104-7226', NULL, 'quick_sale', 'cancelled', NULL, '2026-01-04 15:27:17', '2026-01-04 15:27:17'),
(34, 1, 0, 'cash', 'Quick Sale', 'SALE-20260104-0028', NULL, 'quick_sale', 'cancelled', NULL, '2026-01-04 15:30:20', '2026-01-04 15:30:20'),
(35, 1, 0, 'cash', 'Quick Sale', 'SALE-20260104-4263', NULL, 'quick_sale', 'cancelled', NULL, '2026-01-04 15:31:24', '2026-01-04 15:31:24'),
(36, 1, 0, 'cash', 'Quick Sale', 'SALE-20260104-0123', NULL, 'quick_sale', 'cancelled', NULL, '2026-01-04 15:57:00', '2026-01-04 15:57:00'),
(37, 1, 220, 'cash', 'Quick Sale', 'SALE-20260104-5277', NULL, 'quick_sale', 'cancelled', NULL, '2026-01-04 16:07:15', '2026-01-04 16:07:15'),
(38, 1, 0, 'cash', 'Quick Sale', 'SALE-20260104-5036', NULL, 'quick_sale', 'cancelled', NULL, '2026-01-04 16:17:05', '2026-01-04 16:17:05'),
(39, 1, 0, 'cash', 'Quick Sale', 'SALE-20260104-1104', NULL, 'quick_sale', 'cancelled', NULL, '2026-01-04 16:29:11', '2026-01-04 16:29:11'),
(40, 1, 70, 'cash', NULL, 'SALE-20260107-1385', 1, 'dine_in', 'cancelled', NULL, '2026-01-07 12:49:41', '2026-01-07 12:49:41');

-- Table structure for table `tables`
DROP TABLE IF EXISTS `tables`;
CREATE TABLE `tables` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `status` enum('available','occupied','paid') DEFAULT 'available',
  `current_sale_id` int(11) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `tables`
INSERT INTO `tables` VALUES
(1, 'Table 1', 1, 'available', NULL, '2026-01-01 17:50:28'),
(2, 'Table 2', 1, 'available', NULL, '2026-01-01 17:50:28'),
(3, 'Table 3', 1, 'available', NULL, '2026-01-01 17:50:28'),
(4, 'Table 4', 1, 'available', NULL, '2026-01-01 17:50:28'),
(5, 'Table 5', 1, 'available', NULL, '2026-01-01 17:50:28'),
(6, 'Table 6', 1, 'available', NULL, '2026-01-01 19:54:39'),
(7, 'Table 7', 1, 'available', NULL, '2026-01-01 19:54:44'),
(8, 'Table 8', 1, 'available', NULL, '2026-01-01 19:54:49'),
(9, 'Table 9', 1, 'available', NULL, '2026-01-01 19:54:55'),
(10, 'Table 10', 1, 'available', NULL, '2026-01-01 19:55:00'),
(11, 'Table 12', 1, 'available', NULL, '2026-01-01 19:55:05');

-- Table structure for table `transactions`
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `category` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `date` date NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `sale_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_userId` (`userId`),
  KEY `idx_type` (`type`),
  KEY `idx_date` (`date`),
  KEY `idx_category` (`category`),
  KEY `idx_sale_id` (`sale_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `transactions`
INSERT INTO `transactions` VALUES
(1, 1, 'expense', 50, 2, 'เส้นใหญ่', NULL, '2026-01-04', '2026-01-04 12:07:27', NULL),
(2, 1, 'expense', 72, 4, 'หมี่ขาว', NULL, '2026-01-04', '2026-01-04 12:07:43', NULL),
(3, 1, 'expense', 42, 3, 'หมี่กลม', NULL, '2026-01-04', '2026-01-04 12:08:00', NULL),
(4, 1, 'expense', 228, 6, 'ลูกชิ้นหมูมนัสนัน', NULL, '2026-01-04', '2026-01-04 12:08:17', NULL),
(5, 1, 'expense', 72, 2, 'ลูกชิ้นปลา_l', NULL, '2026-01-04', '2026-01-04 12:08:30', NULL),
(6, 1, 'expense', 84, 3, 'เกี๊ยวนำชัย', NULL, '2026-01-04', '2026-01-04 12:08:51', NULL),
(7, 1, 'expense', 110, 2, 'หมูเด้ง', NULL, '2026-01-04', '2026-01-04 12:09:14', NULL),
(8, 1, 'expense', 135, 3, 'น้ำมันพืชมาเลเซีย', NULL, '2026-01-04', '2026-01-04 12:09:28', NULL),
(9, 1, 'expense', 70, 1, 'ต้นหอม', NULL, '2026-01-04', '2026-01-04 12:10:10', NULL),
(10, 1, 'expense', 110, 1, 'ผักชี', NULL, '2026-01-04', '2026-01-04 12:10:22', NULL),
(11, 1, 'expense', 28, 2, 'หมี่หยก', NULL, '2026-01-04', '2026-01-04 12:10:57', NULL),
(12, 1, 'expense', 480, 1, 'แก้สหุงต้ม', NULL, '2026-01-04', '2026-01-04 12:11:14', NULL),
(13, 1, 'expense', 180, 8, 'บะหมี่น้องบ่าว', NULL, '2026-01-04', '2026-01-04 12:11:39', NULL),
(14, 1, 'expense', 36, 2, 'ถั่วงอก', NULL, '2026-01-04', '2026-01-04 12:11:51', NULL),
(15, 1, 'expense', 42, 1, 'น้ำแข็ง', NULL, '2026-01-04', '2026-01-04 12:12:05', NULL),
(16, 1, 'expense', 300, 2, 'หมูสันนอกสไลด์', NULL, '2026-01-04', '2026-01-04 12:13:11', NULL),
(17, 1, 'expense', 400, 8, 'ขาตั้ง', NULL, '2026-01-04', '2026-01-04 12:13:27', NULL),
(18, 1, 'income', 3200, 1, 'เงินสด', NULL, '2026-01-04', '2026-01-04 12:14:12', NULL),
(19, 1, 'income', 5400, 1, 'เงินโอน', NULL, '2026-01-04', '2026-01-04 12:14:30', NULL),
(20, 1, 'expense', 400, 1, 'พี่ปุ๊', NULL, '2026-01-04', '2026-01-04 12:15:00', NULL),
(21, 1, 'expense', 400, 1, 'พี่ภา', NULL, '2026-01-04', '2026-01-04 12:15:07', NULL),
(22, 1, 'expense', 545, 2, 'โบนัสน้ำมันปาล์ม_1_ลัง_12_ถุง', NULL, '2026-01-05', '2026-01-05 03:01:56', NULL),
(23, 1, 'expense', 516, 3, 'ข้าวแสนดี', NULL, '2026-01-05', '2026-01-05 03:02:18', NULL),
(24, 1, 'expense', 148, 2, 'แอโร่_น้ำส้มสายชูกลั่น', NULL, '2026-01-05', '2026-01-05 03:02:49', NULL),
(25, 1, 'expense', 40, 2, 'กวางตุ้ง', NULL, '2026-01-05', '2026-01-05 03:03:30', NULL),
(26, 1, 'expense', 400, 4, 'เล้ง', NULL, '2026-01-05', '2026-01-05 03:03:53', NULL),
(27, 1, 'expense', 42, 1, 'น้ำแข็ง', NULL, '2026-01-05', '2026-01-05 03:04:03', NULL),
(28, 1, 'expense', 32, 1, 'แป้งมัน', NULL, '2026-01-05', '2026-01-05 03:04:40', NULL),
(29, 1, 'expense', 90, 2, 'ลูกชิ้นหมูมนัสนัน', NULL, '2026-01-05', '2026-01-05 03:05:01', NULL),
(30, 1, 'expense', 1200, 1, 'น้ำพริกเผา_ฉั่วฮะเส็ง', NULL, '2026-01-05', '2026-01-05 03:05:37', NULL),
(31, 1, 'expense', 65, 1, 'หอยแมงภู่_ฝาเดียว_แช่แข็ง', NULL, '2026-01-05', '2026-01-05 03:06:05', NULL),
(32, 1, 'expense', 35, 1, 'อังคนา_ซอสเย็นตาโฟ', NULL, '2026-01-05', '2026-01-05 03:06:23', NULL),
(33, 1, 'expense', 36, 2, 'ถั่วงอก', NULL, '2026-01-05', '2026-01-05 03:07:00', NULL),
(34, 1, 'expense', 180, 4, 'ถั่วบดละเอียด', NULL, '2026-01-05', '2026-01-05 07:29:09', NULL),
(35, 1, 'expense', 84, 3, 'พริกน้ำส้ม', NULL, '2026-01-05', '2026-01-05 07:29:32', NULL),
(36, 1, 'expense', 64, 2, 'เส้นเล็ก', NULL, '2026-01-05', '2026-01-05 07:29:58', NULL),
(37, 1, 'expense', 50, 2, 'เส้นใหญ่', NULL, '2026-01-05', '2026-01-05 07:30:17', NULL),
(38, 1, 'expense', 54, 3, 'หมี่ขาว', NULL, '2026-01-05', '2026-01-05 07:30:34', NULL),
(39, 1, 'expense', 165, 3, 'ลูกชิ้นปลา_l', NULL, '2026-01-05', '2026-01-05 07:31:57', NULL),
(40, 1, 'expense', 55, 1, 'หอมใหญ่', NULL, '2026-01-05', '2026-01-05 07:32:18', NULL),
(41, 1, 'expense', 120, 2, 'หอยแมงภู่', NULL, '2026-01-05', '2026-01-05 07:32:41', NULL),
(42, 1, 'expense', 130, 1, 'กวางตุ้ง', NULL, '2026-01-05', '2026-01-05 07:32:56', NULL),
(43, 1, 'expense', 114, 3, 'อังคนา_ซอสเย็นตาโฟ', NULL, '2026-01-05', '2026-01-05 07:33:10', NULL),
(44, 1, 'expense', 120, 3, 'ถุงร้อน_6x9', NULL, '2026-01-05', '2026-01-05 07:33:32', NULL),
(45, 1, 'expense', 228, 6, 'ลูกชิ้นหมูมนัสนัน', NULL, '2026-01-05', '2026-01-05 07:35:52', NULL),
(46, 1, 'expense', 83.17, 12, 'แฟนต้าเขียว_300_ml.', NULL, '2026-01-05', '2026-01-05 09:36:43', NULL),
(47, 1, 'expense', 83.17, 12, 'โค้ก_300_ml', NULL, '2026-01-05', '2026-01-05 09:37:37', NULL),
(48, 1, 'expense', 186.88, 60, 'น้ำทิพย์_550_ml', NULL, '2026-01-05', '2026-01-05 09:38:30', NULL),
(49, 1, 'income', 2200, 1, 'เงินสด', NULL, '2026-01-05', '2026-01-05 12:29:51', NULL),
(50, 1, 'income', 2850, 1, 'เงินโอน', NULL, '2026-01-05', '2026-01-05 12:29:59', NULL),
(51, 1, 'expense', 910, 2, 'แก้สหุงต้ม', NULL, '2026-01-07', '2026-01-07 02:51:48', NULL),
(52, 1, 'expense', 10, 2, 'ผักชีใบเลื่อย', NULL, '2026-01-07', '2026-01-07 02:52:12', NULL),
(53, 1, 'expense', 13, 1, 'ถั่วงอก', '1/2 โล', '2026-01-07', '2026-01-07 02:52:33', NULL),
(54, 1, 'expense', 84, 3, 'เกี๊ยวนำชัย', NULL, '2026-01-07', '2026-01-07 02:53:04', NULL),
(55, 1, 'expense', 50, 2, 'เส้นใหญ่', NULL, '2026-01-07', '2026-01-07 02:53:16', NULL),
(56, 1, 'expense', 64, 2, 'เส้นเล็ก', NULL, '2026-01-07', '2026-01-07 02:53:32', NULL),
(57, 1, 'expense', 30, 2, 'วุ้นเส้น_แชมป์', NULL, '2026-01-07', '2026-01-07 02:53:54', NULL),
(58, 1, 'expense', 54, 3, 'หมี่ขาว', NULL, '2026-01-07', '2026-01-07 02:54:26', NULL),
(59, 1, 'expense', 150, 1, 'เห็ดขาว', NULL, '2026-01-07', '2026-01-07 02:54:43', NULL),
(60, 1, 'expense', 36, 2, 'ถั่วงอก', NULL, '2026-01-07', '2026-01-07 02:54:56', NULL),
(61, 1, 'expense', 1852.25, 1, 'สามชั้นแผ่น', NULL, '2026-01-07', '2026-01-07 11:31:03', NULL),
(62, 1, 'expense', 1592.63, 1, 'สามชั้นแผ่น', NULL, '2026-01-07', '2026-01-07 11:31:29', NULL),
(63, 1, 'expense', 120, 1, 'หมูบด', NULL, '2026-01-07', '2026-01-07 11:32:06', NULL),
(66, 1, 'expense', 225, 10, 'บะหมี่น้องบ่าว', NULL, '2026-01-07', '2026-01-07 16:06:13', NULL),
(67, 1, 'expense', 400, 1, 'พี่ภา', NULL, '2026-01-05', '2026-01-07 16:17:55', NULL),
(68, 1, 'expense', 400, 1, 'พี่ปุ๊', NULL, '2026-01-05', '2026-01-07 16:18:02', NULL),
(69, 1, 'income', 2600, 1, 'เงินโอน', NULL, '2026-01-07', '2026-01-07 19:05:37', NULL),
(70, 1, 'expense', 345, 3, 'ไข่ไก่เบอร์_4', NULL, '2026-01-07', '2026-01-08 07:36:19', NULL),
(71, 1, 'expense', 380, 1, 'พี่ปุ๊', NULL, '2026-01-07', '2026-01-08 07:36:43', NULL),
(72, 1, 'expense', 400, 1, 'พี่ภา', NULL, '2026-01-07', '2026-01-08 07:36:52', NULL),
(73, 2, 'expense', 226, 2, 'ผงชูรส', 'น้ำหนัก กก', '2026-01-08', '2026-01-08 11:47:46', NULL),
(74, 2, 'expense', 30, 2, 'กระเทียมไทย', 'น้ำหนักเป็นขีด', '2026-01-08', '2026-01-08 11:48:04', NULL),
(75, 2, 'expense', 114, 3, 'ลูกชิ้นหมูมนัสนัน', NULL, '2026-01-08', '2026-01-08 11:48:41', NULL),
(76, 2, 'expense', 55, 1, 'ซอสฝาเขียว', NULL, '2026-01-08', '2026-01-08 11:48:57', NULL),
(77, 2, 'expense', 60, 1, 'ต้นหอม', '1/2 โล', '2026-01-08', '2026-01-08 11:49:15', NULL),
(78, 2, 'expense', 50, 1, 'ผักชี', NULL, '2026-01-08', '2026-01-08 11:49:29', NULL),
(80, 2, 'expense', 42, 1, 'น้ำแข็ง', NULL, '2026-01-08', '2026-01-08 12:14:49', NULL),
(81, 2, 'expense', 400, 1, 'พี่ภา', NULL, '2026-01-08', '2026-01-08 17:07:49', NULL),
(82, 2, 'expense', 380, 1, 'พี่ปุ๊', NULL, '2026-01-08', '2026-01-08 17:07:56', NULL),
(83, 1, 'expense', 192, 6, 'น้ำตาลทรายแดง', 'กก ', '2026-01-09', '2026-01-09 14:55:36', NULL),
(84, 1, 'expense', 125, 5, 'น้ำตาลกรวด', NULL, '2026-01-09', '2026-01-09 14:55:54', NULL),
(85, 1, 'expense', 56, 2, 'พริกนำส้มซอง', NULL, '2026-01-09', '2026-01-09 14:56:20', NULL),
(86, 1, 'expense', 75, 1, 'มาม่า_ff', NULL, '2026-01-09', '2026-01-09 14:56:33', NULL),
(87, 1, 'expense', 170, 10, 'ฟักเขียว', NULL, '2026-01-09', '2026-01-09 14:56:47', NULL),
(88, 1, 'expense', 225, 5, 'ถั่วบดละเอียด', NULL, '2026-01-09', '2026-01-09 14:56:59', NULL),
(89, 1, 'expense', 180, 2, 'ผงน้ำเก็กฮวย', '290 gram', '2026-01-09', '2026-01-09 14:57:44', NULL),
(90, 1, 'expense', 246, 2, 'ผงน้ำอัญชันเลมอน', NULL, '2026-01-09', '2026-01-09 14:58:10', NULL),
(91, 1, 'expense', 246, 2, 'ผงน้ำตะไคร้ใบเตย', NULL, '2026-01-09', '2026-01-09 14:58:37', NULL),
(92, 1, 'expense', 380, 1, 'พี่ปุ๊', NULL, '2026-01-09', '2026-01-09 14:59:02', NULL),
(93, 1, 'expense', 400, 1, 'พี่ภา', NULL, '2026-01-09', '2026-01-09 14:59:08', NULL),
(94, 1, 'income', 1800, 1, 'เงินโอน', NULL, '2026-01-08', '2026-01-09 14:59:50', NULL);

-- Table structure for table `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'user',
  `status` varchar(50) DEFAULT 'active',
  `avatar` text DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `users`
INSERT INTO `users` VALUES
(1, 'admin', 'admin@example.com', '$2a$10$7y0xn9YWX/Ba1R241xRSOOnsl3quM8hKMkrg2bJM41OjMt5iijaZW', 'Administrator', '', 'admin', 'active', '/uploads/avatar-1767776814545.jpg', '2026-01-04 12:01:39'),
(2, 'ya', 'iya555@hotmail.com', '$2a$10$KYIGKV4.T76vNcYJj5FJ7eJ8agWydU6v96lDtkHpuZQOvyaUzekNe', 'Suriya Thongchai', '0819699987', 'user', 'active', '/uploads/avatar-1767776826348.png', '2026-01-05 07:37:58');

SET FOREIGN_KEY_CHECKS=1;
COMMIT;
