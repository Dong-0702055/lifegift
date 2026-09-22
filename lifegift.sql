-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: lifegift
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `receiver_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ward` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_detail` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_addresses_user` (`user_id`),
  CONSTRAINT `fk_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (1,3,'Nguyễn Văn An','0901000003','Hà Nội','Hoàng Mai','Định Công','12 phố Định Công',1,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(2,3,'Nguyễn Văn An','0901000003','Hà Nội','Hai Bà Trưng','Bạch Mai','25 phố Bạch Mai',0,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(3,4,'Trần Thị Bình','0901000004','Hà Nội','Cầu Giấy','Dịch Vọng','18 Trần Thái Tông',1,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(4,5,'Lê Minh Cường','0901000005','Hà Nội','Thanh Xuân','Khương Đình','45 Nguyễn Trãi',1,'2026-08-12 13:06:11','2026-08-12 13:06:11');
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `affiliate_links`
--

DROP TABLE IF EXISTS `affiliate_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `affiliate_links` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `affiliate_id` bigint NOT NULL,
  `product_id` bigint DEFAULT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `click_count` int NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `fk_affiliate_links_affiliate` (`affiliate_id`),
  KEY `fk_affiliate_links_product` (`product_id`),
  CONSTRAINT `fk_affiliate_links_affiliate` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates` (`id`),
  CONSTRAINT `fk_affiliate_links_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `affiliate_links`
--

LOCK TABLES `affiliate_links` WRITE;
/*!40000 ALTER TABLE `affiliate_links` DISABLE KEYS */;
INSERT INTO `affiliate_links` VALUES (1,1,1,'CTV-CUONG-CF001',128,'ACTIVE','2026-08-12 13:06:11'),(2,1,9,'CTV-CUONG-QT001',75,'ACTIVE','2026-08-12 13:06:11');
/*!40000 ALTER TABLE `affiliate_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `affiliates`
--

DROP TABLE IF EXISTS `affiliates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `affiliates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `affiliate_code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commission_rate` decimal(5,2) NOT NULL DEFAULT '5.00',
  `status` enum('PENDING','ACTIVE','INACTIVE','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `approved_by` bigint DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `affiliate_code` (`affiliate_code`),
  KEY `fk_affiliates_approved_by` (`approved_by`),
  CONSTRAINT `fk_affiliates_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_affiliates_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `affiliates`
--

LOCK TABLES `affiliates` WRITE;
/*!40000 ALTER TABLE `affiliates` DISABLE KEYS */;
INSERT INTO `affiliates` VALUES (1,5,'CTV-CUONG-001',7.50,'ACTIVE',1,'2026-08-01 09:00:00','2026-08-12 13:06:11','2026-08-12 13:06:11');
/*!40000 ALTER TABLE `affiliates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blog_categories`
--

DROP TABLE IF EXISTS `blog_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blog_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blog_categories`
--

LOCK TABLES `blog_categories` WRITE;
/*!40000 ALTER TABLE `blog_categories` DISABLE KEYS */;
INSERT INTO `blog_categories` VALUES (1,'Kiến thức nông sản','kien-thuc-nong-san','Thông tin về nông sản Việt Nam','ACTIVE'),(2,'Câu chuyện vùng miền','cau-chuyen-vung-mien','Câu chuyện về vùng trồng và người nông dân','ACTIVE'),(3,'Quà tặng doanh nghiệp','qua-tang-doanh-nghiep','Ý tưởng và kinh nghiệm chọn quà doanh nghiệp','ACTIVE');
/*!40000 ALTER TABLE `blog_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blog_posts`
--

DROP TABLE IF EXISTS `blog_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blog_posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category_id` bigint NOT NULL,
  `author_id` bigint NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumbnail` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `summary` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `status` enum('DRAFT','PUBLISHED','HIDDEN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `fk_blog_posts_author` (`author_id`),
  KEY `idx_blog_posts_category` (`category_id`),
  CONSTRAINT `fk_blog_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_blog_posts_category` FOREIGN KEY (`category_id`) REFERENCES `blog_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blog_posts`
--

LOCK TABLES `blog_posts` WRITE;
/*!40000 ALTER TABLE `blog_posts` DISABLE KEYS */;
INSERT INTO `blog_posts` VALUES (1,1,1,'Cách chọn cà phê nguyên chất','cach-chon-ca-phe-nguyen-chat',NULL,'Một số tiêu chí giúp người tiêu dùng lựa chọn cà phê chất lượng.','Cà phê nguyên chất cần có nguồn gốc rõ ràng, quy trình rang phù hợp và hương vị tự nhiên.','PUBLISHED','2026-08-05 08:00:00','2026-08-12 13:06:11','2026-08-12 13:06:11'),(2,2,1,'Hành trình của hạt cà phê Buôn Ma Thuột','hanh-trinh-cua-hat-ca-phe-buon-ma-thuot',NULL,'Tìm hiểu vùng đất tạo nên những hạt cà phê nổi tiếng của Việt Nam.','Buôn Ma Thuột là một trong những vùng cà phê nổi tiếng nhất Việt Nam.','PUBLISHED','2026-08-07 08:00:00','2026-08-12 13:06:11','2026-08-12 13:06:11'),(3,3,2,'Gợi ý quà tặng doanh nghiệp bằng nông sản Việt','goi-y-qua-tang-doanh-nghiep-bang-nong-san-viet',NULL,'Nông sản Việt có thể trở thành những bộ quà tặng ý nghĩa cho đối tác.','Một bộ quà tặng được thiết kế tốt vừa thể hiện văn hóa Việt Nam vừa tạo dấu ấn với đối tác.','PUBLISHED','2026-08-10 08:00:00','2026-08-12 13:06:11','2026-08-12 13:06:11');
/*!40000 ALTER TABLE `blog_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brand_aliases`
--

DROP TABLE IF EXISTS `brand_aliases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brand_aliases` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `brand_id` bigint NOT NULL,
  `alias` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `normalized_alias` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_brand_alias_normalized` (`brand_id`,`normalized_alias`),
  KEY `idx_brand_alias_normalized` (`normalized_alias`),
  CONSTRAINT `fk_brand_alias_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brand_aliases`
--

LOCK TABLES `brand_aliases` WRITE;
/*!40000 ALTER TABLE `brand_aliases` DISABLE KEYS */;
INSERT INTO `brand_aliases` VALUES (53,1,'LifeGift','lifegift','2026-09-03 12:09:44'),(54,1,'Life Gift','life gift','2026-09-03 12:09:44'),(55,1,'Life Gift Việt','life gift viet','2026-09-03 12:09:44'),(56,1,'LifeGift Việt Nam','lifegift viet nam','2026-09-03 12:09:44'),(57,1,'Life Gift Việt Nam','life gift viet nam','2026-09-03 12:09:44'),(58,2,'Buôn Ma Thuột Coffee','buon ma thuot coffee','2026-09-03 12:09:44'),(59,2,'Buôn Ma Thuột','buon ma thuot','2026-09-03 12:09:44'),(60,2,'BMT Coffee','bmt coffee','2026-09-03 12:09:44'),(61,2,'BMT','bmt','2026-09-03 12:09:44'),(62,2,'cà phê Buôn Ma Thuột','ca phe buon ma thuot','2026-09-03 12:09:44'),(63,3,'Tây Bắc Farm','tay bac farm','2026-09-03 12:09:44'),(64,3,'Tây Bắc','tay bac','2026-09-03 12:09:44'),(65,3,'Farm Tây Bắc','farm tay bac','2026-09-03 12:09:44'),(66,3,'Nông sản Tây Bắc','nong san tay bac','2026-09-03 12:09:44'),(67,4,'Green Việt','green viet','2026-09-03 12:09:44'),(68,4,'GreenViet','greenviet','2026-09-03 12:09:44'),(69,4,'Green Việt Nam','green viet nam','2026-09-03 12:09:44'),(70,6,'Kinh Đô','kinh do','2026-09-03 12:09:44'),(71,6,'Kinh Đô Việt Nam','kinh do viet nam','2026-09-03 12:09:44'),(72,6,'KinhDo','kinhdo','2026-09-03 12:09:44');
/*!40000 ALTER TABLE `brand_aliases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,'LifeGift','lifegift','Thương hiệu quà tặng và nông sản Việt Nam',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(2,'Buôn Ma Thuột Coffee','buon-ma-thuot-coffee','Cà phê đặc sản Buôn Ma Thuột',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(3,'Tây Bắc Farm','tay-bac-farm','Nông sản và đặc sản vùng Tây Bắc',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(4,'Green Việt','green-viet','Sản phẩm nông nghiệp và dinh dưỡng',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(5,'Vinamilk','vinamilk','Thương hiệu nông sản và thực phẩm','https://example.com/vinamilk.png','INACTIVE','2026-08-12 21:04:38','2026-08-12 21:05:26'),(6,'Kinh Đô','kinh-do','Thương hiệu bánh trung thu nổi tiếng tại Việt Nam','https://example.com/logos/kinh-do.png','ACTIVE','2026-08-26 08:08:21','2026-08-26 08:08:21'),(7,'Bánh Trung THu Kinh Đô','kinh-do1','Thương hiệu bánh trung thu nổi tiếng tại Việt Nam','https://example.com/logos/kinh-do.png','INACTIVE','2026-08-26 08:16:30','2026-08-26 08:20:09');
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cart_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cart_product` (`cart_id`,`product_id`),
  KEY `idx_cart_items_product` (`product_id`),
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (1,1,1,2,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(2,1,5,1,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(3,2,3,1,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(4,2,7,2,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(5,3,9,1,'2026-08-12 13:06:11','2026-08-12 13:06:11');
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (1,3,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(2,4,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(3,5,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(4,6,'2026-08-18 10:43:13','2026-08-18 10:43:13');
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `parent_id` bigint DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `fk_categories_parent` (`parent_id`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,NULL,'Nông sản','nong-san','Các sản phẩm nông sản Việt Nam',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(2,NULL,'Đặc sản vùng miền','dac-san-vung-mien','Đặc sản nổi tiếng từ nhiều vùng miền',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(3,NULL,'Quà tặng','qua-tang','Các bộ quà tặng phù hợp cá nhân và doanh nghiệp',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(4,1,'Cà phê','ca-phe','Cà phê Việt Nam',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 20:53:53'),(5,1,'Trà','tra','Các loại trà Việt Nam',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(6,1,'Hạt dinh dưỡng','hat-dinh-duong','Các loại hạt và sản phẩm dinh dưỡng',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(7,2,'Đặc sản Tây Bắc','dac-san-tay-bac','Đặc sản khu vực Tây Bắc',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(8,3,'Quà doanh nghiệp','qua-doanh-nghiep','Quà tặng dành cho doanh nghiệp',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(9,NULL,'Trái cây','trai-cay','Các loại trái cây tươi','/images/trai-cay.jpg','INACTIVE','2026-08-12 15:44:38','2026-08-25 14:52:35'),(10,NULL,'Bánh Trung Thu Cao Cấp 2026','banh-trung-thu-cao-cap-2026','Cập nhật danh mục bánh trung thu cho mùa lễ hội','https://example.com/images/banh-trung-thu-2026.jpg','INACTIVE','2026-08-25 12:47:44','2026-08-25 14:51:06');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_aliases`
--

DROP TABLE IF EXISTS `category_aliases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_aliases` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category_id` bigint NOT NULL,
  `alias` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `normalized_alias` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_category_alias_category_normalized` (`category_id`,`normalized_alias`),
  KEY `idx_category_alias_normalized` (`normalized_alias`),
  KEY `idx_category_alias_category` (`category_id`),
  CONSTRAINT `fk_category_aliases_categories` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_aliases`
--

LOCK TABLES `category_aliases` WRITE;
/*!40000 ALTER TABLE `category_aliases` DISABLE KEYS */;
INSERT INTO `category_aliases` VALUES (1,1,'nông sản','nong san','2026-09-04 11:20:44'),(2,1,'nông sản việt nam','nong san viet nam','2026-09-04 11:20:44'),(3,1,'đồ nông sản','do nong san','2026-09-04 11:20:44'),(4,2,'đặc sản vùng miền','dac san vung mien','2026-09-04 11:20:44'),(5,2,'đặc sản','dac san','2026-09-04 11:20:44'),(6,2,'món đặc sản','mon dac san','2026-09-04 11:20:44'),(7,3,'quà tặng','qua tang','2026-09-04 11:20:44'),(8,3,'bộ quà tặng','bo qua tang','2026-09-04 11:20:44'),(9,3,'quà biếu','qua ','2026-09-04 11:20:44'),(10,4,'cà phê','ca phe','2026-09-04 11:20:44'),(11,4,'cafe','cafe','2026-09-04 11:20:44'),(12,4,'kơ phê','ko phe','2026-09-04 11:20:44'),(13,4,'caphe','caphe','2026-09-04 11:20:44'),(14,5,'trà','tra','2026-09-04 11:20:44'),(15,5,'chè','che','2026-09-04 11:20:44'),(16,5,'trà việt nam','tra viet nam','2026-09-04 11:20:44'),(17,6,'hạt dinh dưỡng','hat dinh duong','2026-09-04 11:20:44'),(18,6,'hạt','hat','2026-09-04 11:20:44'),(19,6,'các loại hạt','cac loai hat','2026-09-04 11:20:44'),(20,6,'hạt ăn vặt','hat an vat','2026-09-04 11:20:44'),(21,7,'đặc sản tây bắc','dac san tay bac','2026-09-04 11:20:44'),(22,7,'đặc sản tây bắc nổi tiếng','dac san tay bac noi tieng','2026-09-04 11:20:44'),(23,7,'tây bắc','tay bac','2026-09-04 11:20:44'),(24,8,'quà doanh nghiệp','qua doanh nghiep','2026-09-04 11:20:44'),(25,8,'quà tặng doanh nghiệp','qua tang doanh nghiep','2026-09-04 11:20:44'),(26,8,'quà công ty','qua cong ty','2026-09-04 11:20:44'),(27,9,'trái cây','trai cay','2026-09-04 11:20:44'),(28,9,'hoa quả','hoa qua','2026-09-04 11:20:44'),(29,9,'trái cây tươi','trai cay tuoi','2026-09-04 11:20:44'),(30,10,'bánh trung thu','banh trung thu','2026-09-04 11:20:44'),(31,10,'bánh trung thu cao cấp','banh trung thu cao cap','2026-09-04 11:20:44'),(32,10,'bánh trung thu 2026','banh trung thu 2026','2026-09-04 11:20:44');
/*!40000 ALTER TABLE `category_aliases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commissions`
--

DROP TABLE IF EXISTS `commissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `affiliate_id` bigint NOT NULL,
  `order_id` bigint NOT NULL,
  `order_amount` decimal(15,2) NOT NULL,
  `commission_rate` decimal(5,2) NOT NULL,
  `commission_amount` decimal(15,2) NOT NULL,
  `status` enum('PENDING','APPROVED','PAID','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_commissions_affiliate` (`affiliate_id`),
  KEY `fk_commissions_order` (`order_id`),
  CONSTRAINT `fk_commissions_affiliate` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates` (`id`),
  CONSTRAINT `fk_commissions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commissions`
--

LOCK TABLES `commissions` WRITE;
/*!40000 ALTER TABLE `commissions` DISABLE KEYS */;
INSERT INTO `commissions` VALUES (1,1,3,799000.00,7.50,59925.00,'APPROVED','2026-08-11 20:00:00',NULL);
/*!40000 ALTER TABLE `commissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupon_usages`
--

DROP TABLE IF EXISTS `coupon_usages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_usages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `coupon_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `order_id` bigint NOT NULL,
  `discount_amount` decimal(15,2) NOT NULL,
  `used_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_coupon_usages_coupon` (`coupon_id`),
  KEY `fk_coupon_usages_user` (`user_id`),
  KEY `fk_coupon_usages_order` (`order_id`),
  CONSTRAINT `fk_coupon_usages_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`),
  CONSTRAINT `fk_coupon_usages_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `fk_coupon_usages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupon_usages`
--

LOCK TABLES `coupon_usages` WRITE;
/*!40000 ALTER TABLE `coupon_usages` DISABLE KEYS */;
INSERT INTO `coupon_usages` VALUES (1,2,4,2,50000.00,'2026-08-11 14:20:00'),(2,4,6,23,10000.00,'2026-08-28 10:01:23');
/*!40000 ALTER TABLE `coupon_usages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_type` enum('PERCENTAGE','FIXED_AMOUNT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(15,2) NOT NULL,
  `min_order_value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `max_discount` decimal(15,2) DEFAULT NULL,
  `usage_limit` int DEFAULT NULL,
  `used_count` int NOT NULL DEFAULT '0',
  `start_at` datetime NOT NULL,
  `end_at` datetime NOT NULL,
  `status` enum('ACTIVE','INACTIVE','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES (1,'LIFEGIFT10','Giảm 10% đơn hàng','PERCENTAGE',10.00,300000.00,100000.00,1000,1,'2026-08-01 00:00:00','2026-08-31 23:59:59','ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(2,'WELCOME50','Khách hàng mới giảm 50K','FIXED_AMOUNT',50000.00,300000.00,50000.00,500,1,'2026-08-01 00:00:00','2026-09-30 23:59:59','ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(3,'TET100','Ưu đãi 100K dịp Tết','FIXED_AMOUNT',100000.00,700000.00,100000.00,100,0,'2026-08-01 00:00:00','2027-02-28 23:59:59','ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(4,'SALE10K','Giảm 10k cho đơn từ 50k','FIXED_AMOUNT',10000.00,50000.00,10000.00,100,1,'2026-08-01 00:00:00','2026-12-31 23:59:59','ACTIVE','2026-08-28 02:35:30','2026-08-28 10:01:23');
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goods_receipts`
--

DROP TABLE IF EXISTS `goods_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goods_receipts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `receipt_code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purchase_order_id` bigint NOT NULL,
  `warehouse_id` bigint NOT NULL,
  `received_by` bigint NOT NULL,
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `received_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_code` (`receipt_code`),
  KEY `fk_goods_receipts_purchase_order` (`purchase_order_id`),
  KEY `fk_goods_receipts_warehouse` (`warehouse_id`),
  KEY `fk_goods_receipts_user` (`received_by`),
  CONSTRAINT `fk_goods_receipts_purchase_order` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`),
  CONSTRAINT `fk_goods_receipts_user` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_goods_receipts_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods_receipts`
--

LOCK TABLES `goods_receipts` WRITE;
/*!40000 ALTER TABLE `goods_receipts` DISABLE KEYS */;
INSERT INTO `goods_receipts` VALUES (1,'GR-202608-0001',1,1,2,18000000.00,'Đã nhận đủ hàng PO-202608-0001','2026-08-03 15:30:00'),(2,'GR-202608-0002',2,1,2,6600000.00,'Nhập đợt 1 trà Shan Tuyết','2026-08-10 14:00:00');
/*!40000 ALTER TABLE `goods_receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventories`
--

DROP TABLE IF EXISTS `inventories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `warehouse_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `reserved_quantity` int NOT NULL DEFAULT '0',
  `available_quantity` int NOT NULL DEFAULT '0',
  `min_stock` int NOT NULL DEFAULT '0',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inventory_warehouse_product` (`warehouse_id`,`product_id`),
  KEY `idx_inventory_product` (`product_id`),
  CONSTRAINT `fk_inventories_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_inventories_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventories`
--

LOCK TABLES `inventories` WRITE;
/*!40000 ALTER TABLE `inventories` DISABLE KEYS */;
INSERT INTO `inventories` VALUES (1,1,1,70,25,45,20,'2026-09-10 11:35:20'),(2,1,2,80,19,61,15,'2026-09-14 19:47:57'),(3,1,3,60,4,56,10,'2026-09-10 11:35:20'),(4,1,4,45,0,45,10,'2026-08-12 13:06:11'),(5,1,5,150,3,147,20,'2026-08-12 13:06:11'),(6,1,6,90,0,90,15,'2026-08-12 13:06:11'),(7,1,7,70,0,70,10,'2026-08-12 13:06:11'),(8,1,8,12,2,10,15,'2026-08-12 13:06:11'),(9,1,9,35,1,34,5,'2026-08-12 13:06:11'),(10,1,10,120,0,120,5,'2026-08-26 11:21:14'),(11,2,1,60,0,60,15,'2026-08-12 13:06:11'),(12,2,5,80,0,80,15,'2026-08-12 13:06:11'),(13,2,9,20,0,20,5,'2026-08-12 13:06:11');
/*!40000 ALTER TABLE `inventories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inventory_id` bigint NOT NULL,
  `transaction_type` enum('IMPORT','SALE','RETURN','ADJUSTMENT','TRANSFER_IN','TRANSFER_OUT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` bigint DEFAULT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_inventory_transactions_inventory` (`inventory_id`),
  KEY `fk_inventory_transactions_user` (`created_by`),
  CONSTRAINT `fk_inventory_transactions_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventories` (`id`),
  CONSTRAINT `fk_inventory_transactions_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
INSERT INTO `inventory_transactions` VALUES (1,1,'IMPORT',100,'PURCHASE_ORDER',1,'Nhập 100 gói Robusta',2,'2026-08-12 13:06:11'),(2,2,'IMPORT',30,'PURCHASE_ORDER',1,'Nhập 30 gói Arabica',2,'2026-08-12 13:06:11'),(3,5,'IMPORT',10,'PURCHASE_ORDER',1,'Nhập 10 hộp hạt điều',2,'2026-08-12 13:06:11'),(4,3,'IMPORT',30,'PURCHASE_ORDER',2,'Nhập 30 hộp Shan Tuyết',2,'2026-08-12 13:06:11'),(5,1,'SALE',2,'ORDER',1,'Xuất bán đơn ORD-20260812-0001',2,'2026-08-12 13:06:11'),(6,5,'SALE',1,'ORDER',1,'Xuất bán đơn ORD-20260812-0001',2,'2026-08-12 13:06:11'),(7,3,'SALE',1,'ORDER',2,'Xuất bán đơn ORD-20260812-0002',2,'2026-08-12 13:06:11'),(8,1,'IMPORT',100,'PURCHASE',1,'Nhập hàng đợt đầu',6,'2026-08-16 19:42:49'),(13,1,'SALE',2,'ORDER',5,'Xuất kho cho đơn hàng #5 - Cà phê Robusta nguyên hạt 500g',6,'2026-08-16 22:26:49'),(14,1,'RETURN',2,'ORDER',5,'Hoàn kho do hủy đơn hàng #5 - Cà phê Robusta nguyên hạt 500g',6,'2026-08-16 22:29:09'),(15,1,'SALE',2,'ORDER',6,'Xuất kho cho đơn hàng #6 - Cà phê Robusta nguyên hạt 500g',6,'2026-08-16 23:20:34'),(16,1,'SALE',2,'ORDER',11,'Xuất kho cho đơn hàng #11 - Cà phê Robusta nguyên hạt 500g',6,'2026-08-18 08:33:37'),(17,1,'RETURN',2,'ORDER',11,'Hoàn kho đơn hàng #11 - Cà phê Robusta nguyên hạt 500g',6,'2026-08-18 08:35:52'),(18,1,'SALE',2,'ORDER',12,'Xuất kho cho đơn hàng #12 - Cà phê Robusta nguyên hạt 500g',6,'2026-08-18 08:38:59'),(19,1,'RETURN',2,'ORDER',12,'Hoàn kho đơn hàng #12 - Cà phê Robusta nguyên hạt 500g',6,'2026-08-18 08:43:23'),(20,1,'SALE',2,'ORDER',13,'Xuất kho cho đơn hàng #13 - Cà phê Robusta nguyên hạt 500g',6,'2026-08-18 08:45:50'),(21,1,'RETURN',2,'ORDER',13,'Hoàn kho đơn hàng #13 - Cà phê Robusta nguyên hạt 500g',6,'2026-08-18 08:48:30'),(22,1,'SALE',2,'ORDER',14,'Xuất kho cho đơn hàng #14 - Cà phê Robusta nguyên hạt 500g',6,'2026-08-18 08:52:05'),(23,1,'SALE',2,'ORDER',15,'Xuất kho cho đơn hàng #15 - Cà phê Robusta nguyên hạt 500g',6,'2026-08-18 09:01:32'),(24,1,'RETURN',2,'ORDER',15,'Hoàn kho đơn hàng #15 - Cà phê Robusta nguyên hạt 500g',6,'2026-08-18 09:02:42'),(25,10,'IMPORT',100,'PURCHASE_ORDER',6,'Nhập kho tự động từ đơn nhập hàng PO-1787717957571-8949',6,'2026-08-26 11:21:14'),(26,1,'IMPORT',50,'PURCHASE_ORDER',6,'Nhập kho tự động từ đơn nhập hàng PO-1787717957571-8949',6,'2026-08-26 11:21:14'),(27,1,'SALE',2,'ORDER',21,'Xuất kho cho đơn hàng #21 - Cà phê Robusta nguyên hạt 500g',NULL,'2026-08-26 19:27:37'),(28,1,'SALE',2,'ORDER',22,'Xuất kho cho đơn hàng #22 - Cà phê Robusta nguyên hạt 500g',NULL,'2026-08-26 20:02:25'),(29,1,'RETURN',2,'ORDER',21,'Hoàn kho đơn hàng #21 - Cà phê Robusta nguyên hạt 500g',NULL,'2026-08-26 20:09:53');
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `quantity` int NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_order_items_order` (`order_id`),
  KEY `idx_order_items_product` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(2,1,5,'Hạt điều rang muối 500g','HN-001',189000.00,1,189000.00),(3,2,3,'Trà Shan Tuyết cổ thụ 200g','TR-001',299000.00,1,299000.00),(4,2,7,'Mật ong hoa rừng Tây Bắc 500ml','DS-001',319000.00,1,319000.00),(5,3,9,'Hộp quà Tết Nông Sản Việt','QT-001',799000.00,1,799000.00),(6,4,2,'Cà phê Arabica Cầu Đất 500g','CF-002',239000.00,1,239000.00),(7,4,3,'Trà Shan Tuyết cổ thụ 200g','TR-001',246000.00,1,246000.00),(10,7,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(11,8,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,1,165000.00),(12,9,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(13,10,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(14,11,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(15,12,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(16,13,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(17,14,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(18,15,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(19,16,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(20,17,2,'Cà phê Arabica Cầu Đất 500g','CF-002',239000.00,2,478000.00),(21,18,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,9,1485000.00),(22,19,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(23,20,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(24,21,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(25,22,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(26,23,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(27,24,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(28,25,1,'Cà phê Robusta nguyên hạt 500g','CF-001',165000.00,2,330000.00),(29,25,2,'Cà phê Arabica Cầu Đất 500g','CF-002',239000.00,2,478000.00),(30,25,3,'Trà Shan Tuyết cổ thụ 200g','TR-001',299000.00,2,598000.00),(31,26,2,'Cà phê Arabica Cầu Đất 500g','CF-002',239000.00,6,1434000.00),(32,27,2,'Cà phê Arabica Cầu Đất 500g','CF-002',239000.00,9,2151000.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `status` enum('PENDING','CONFIRMED','PROCESSING','SHIPPING','DELIVERED','COMPLETED','CANCELLED','RETURN_REQUESTED','RETURNED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changed_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_order_status_history_order` (`order_id`),
  KEY `fk_order_status_history_user` (`changed_by`),
  CONSTRAINT `fk_order_status_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_status_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_history`
--

LOCK TABLES `order_status_history` WRITE;
/*!40000 ALTER TABLE `order_status_history` DISABLE KEYS */;
INSERT INTO `order_status_history` VALUES (1,1,'PENDING','Khách tạo đơn',3,'2026-08-12 08:30:00'),(2,1,'CONFIRMED','Nhân viên xác nhận đơn',2,'2026-08-12 08:40:00'),(3,1,'PROCESSING','Đang chuẩn bị hàng',2,'2026-08-12 09:00:00'),(4,2,'PENDING','Khách tạo đơn',4,'2026-08-11 14:20:00'),(5,2,'CONFIRMED','Đã xác nhận thanh toán',2,'2026-08-11 14:30:00'),(6,2,'PROCESSING','Đang đóng gói',2,'2026-08-11 15:00:00'),(7,2,'SHIPPING','Đã bàn giao đơn vị vận chuyển',2,'2026-08-12 08:00:00'),(8,3,'PENDING','Khách tạo đơn',5,'2026-08-10 10:15:00'),(9,3,'CONFIRMED','Thanh toán thành công',2,'2026-08-10 10:20:00'),(10,3,'PROCESSING','Đang chuẩn bị',2,'2026-08-10 11:00:00'),(11,3,'SHIPPING','Đã giao vận chuyển',2,'2026-08-10 15:00:00'),(12,3,'DELIVERED','Đã giao hàng',2,'2026-08-11 16:00:00'),(13,3,'COMPLETED','Đơn hoàn tất',2,'2026-08-11 20:00:00'),(14,4,'PENDING','Khách tạo đơn',3,'2026-08-09 09:00:00'),(15,4,'CONFIRMED','Đã xác nhận',2,'2026-08-09 09:10:00'),(16,4,'SHIPPING','Đã giao vận chuyển',2,'2026-08-09 13:00:00'),(17,4,'DELIVERED','Đã giao hàng',2,'2026-08-10 17:00:00'),(29,7,'PENDING','Đơn hàng được tạo',6,'2026-08-17 16:45:48'),(30,8,'PENDING','Đơn hàng được tạo',6,'2026-08-17 16:57:06'),(31,8,'CANCELLED',NULL,6,'2026-08-17 19:50:04'),(32,7,'CONFIRMED',NULL,6,'2026-08-17 19:51:30'),(33,9,'PENDING','Đơn hàng được tạo',6,'2026-08-17 21:52:06'),(34,9,'CONFIRMED',NULL,6,'2026-08-18 08:28:58'),(35,9,'CANCELLED',NULL,6,'2026-08-18 08:29:28'),(36,10,'PENDING','Đơn hàng được tạo',6,'2026-08-18 08:30:10'),(37,10,'CONFIRMED',NULL,6,'2026-08-18 08:30:48'),(38,10,'CANCELLED',NULL,6,'2026-08-18 08:31:05'),(39,11,'PENDING','Đơn hàng được tạo',6,'2026-08-18 08:31:32'),(40,11,'CONFIRMED',NULL,6,'2026-08-18 08:31:53'),(41,11,'PROCESSING',NULL,6,'2026-08-18 08:33:37'),(42,11,'SHIPPING',NULL,6,'2026-08-18 08:34:19'),(43,11,'DELIVERED',NULL,6,'2026-08-18 08:35:01'),(44,11,'COMPLETED',NULL,6,'2026-08-18 08:35:19'),(45,11,'RETURN_REQUESTED',NULL,6,'2026-08-18 08:35:37'),(46,11,'RETURNED',NULL,6,'2026-08-18 08:35:52'),(47,12,'PENDING','Đơn hàng được tạo',6,'2026-08-18 08:38:18'),(48,12,'CONFIRMED',NULL,6,'2026-08-18 08:38:45'),(49,12,'PROCESSING',NULL,6,'2026-08-18 08:38:59'),(50,12,'SHIPPING',NULL,6,'2026-08-18 08:39:38'),(51,12,'DELIVERED',NULL,6,'2026-08-18 08:40:04'),(52,12,'COMPLETED',NULL,6,'2026-08-18 08:41:09'),(53,12,'RETURN_REQUESTED',NULL,6,'2026-08-18 08:41:21'),(54,12,'RETURNED',NULL,6,'2026-08-18 08:43:23'),(55,13,'PENDING','Đơn hàng được tạo',6,'2026-08-18 08:44:49'),(56,13,'CONFIRMED',NULL,6,'2026-08-18 08:45:17'),(57,13,'PROCESSING',NULL,6,'2026-08-18 08:45:50'),(58,13,'SHIPPING',NULL,6,'2026-08-18 08:46:21'),(59,13,'DELIVERED',NULL,6,'2026-08-18 08:47:47'),(60,13,'COMPLETED',NULL,6,'2026-08-18 08:48:05'),(61,13,'RETURN_REQUESTED',NULL,6,'2026-08-18 08:48:18'),(62,13,'RETURNED',NULL,6,'2026-08-18 08:48:30'),(63,14,'PENDING','Đơn hàng được tạo',6,'2026-08-18 08:51:25'),(64,14,'CONFIRMED',NULL,6,'2026-08-18 08:51:53'),(65,14,'PROCESSING',NULL,6,'2026-08-18 08:52:05'),(66,15,'PENDING','Đơn hàng được tạo',6,'2026-08-18 08:59:21'),(67,15,'CONFIRMED',NULL,6,'2026-08-18 09:01:22'),(68,15,'PROCESSING',NULL,6,'2026-08-18 09:01:32'),(69,15,'SHIPPING',NULL,6,'2026-08-18 09:01:46'),(70,15,'DELIVERED',NULL,6,'2026-08-18 09:01:56'),(71,15,'COMPLETED',NULL,6,'2026-08-18 09:02:11'),(72,15,'RETURN_REQUESTED',NULL,6,'2026-08-18 09:02:30'),(73,15,'RETURNED',NULL,6,'2026-08-18 09:02:42'),(74,16,'PENDING','Đơn hàng được tạo',6,'2026-08-18 09:17:51'),(75,16,'CONFIRMED',NULL,6,'2026-08-18 09:18:30'),(76,16,'CANCELLED',NULL,6,'2026-08-18 09:18:48'),(77,17,'PENDING','Đơn hàng được tạo',6,'2026-08-19 09:27:53'),(78,18,'PENDING','Đơn hàng được tạo',6,'2026-08-26 17:31:38'),(79,18,'CONFIRMED','Chuyển trạng thái sang CONFIRMED',6,'2026-08-26 17:46:44'),(80,18,'CANCELLED','Chuyển trạng thái sang CANCELLED',6,'2026-08-26 17:47:36'),(81,19,'PENDING','Đơn hàng được tạo',6,'2026-08-26 17:49:03'),(82,19,'CONFIRMED','Chuyển trạng thái sang CONFIRMED',6,'2026-08-26 17:50:46'),(83,19,'PROCESSING','Chuyển trạng thái sang PROCESSING',6,'2026-08-26 17:51:18'),(84,19,'SHIPPING','Chuyển trạng thái sang SHIPPING',6,'2026-08-26 17:51:43'),(85,19,'DELIVERED','Chuyển trạng thái sang DELIVERED',6,'2026-08-26 17:52:10'),(86,19,'COMPLETED','Chuyển trạng thái sang COMPLETED',6,'2026-08-26 17:52:53'),(87,20,'PENDING','Đơn hàng được tạo',6,'2026-08-26 18:15:15'),(88,21,'PENDING','Đơn hàng được tạo',6,'2026-08-26 18:17:08'),(89,21,'CONFIRMED','Chuyển trạng thái sang CONFIRMED',6,'2026-08-26 19:26:59'),(90,21,'PROCESSING','Chuyển trạng thái sang PROCESSING',6,'2026-08-26 19:27:37'),(91,21,'SHIPPING','Chuyển trạng thái sang SHIPPING',6,'2026-08-26 19:28:17'),(92,21,'DELIVERED','Chuyển trạng thái sang DELIVERED',6,'2026-08-26 19:28:43'),(93,21,'COMPLETED','Chuyển trạng thái sang COMPLETED',6,'2026-08-26 19:29:35'),(94,22,'PENDING','Đơn hàng được tạo',6,'2026-08-26 19:30:46'),(95,22,'CONFIRMED','Chuyển trạng thái sang CONFIRMED',6,'2026-08-26 19:31:40'),(96,22,'PROCESSING','Đang xử lý đơn hàng',6,'2026-08-26 20:02:25'),(97,21,'RETURN_REQUESTED','Chuyển trạng thái sang RETURN_REQUESTED',6,'2026-08-26 20:09:36'),(98,21,'RETURNED','Chuyển trạng thái sang RETURNED',6,'2026-08-26 20:09:53'),(99,23,'PENDING','Đơn hàng được tạo',6,'2026-08-28 10:01:23'),(100,24,'PENDING','Đơn hàng được tạo',6,'2026-08-28 10:03:16'),(101,25,'PENDING','Đơn hàng được tạo',6,'2026-09-10 11:35:20'),(102,26,'PENDING','Đơn hàng được tạo trực tiếp qua AI',6,'2026-09-10 16:30:44'),(103,27,'PENDING','Đơn hàng được tạo trực tiếp qua AI',6,'2026-09-14 19:47:57');
/*!40000 ALTER TABLE `order_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `receiver_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_province` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_ward` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT '0.00',
  `shipping_fee` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `order_status` enum('PENDING','CONFIRMED','PROCESSING','SHIPPING','DELIVERED','COMPLETED','CANCELLED','RETURN_REQUESTED','RETURNED','REFUND_REQUESTED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `warehouse_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_code` (`order_code`),
  KEY `idx_orders_user` (`user_id`),
  KEY `idx_orders_status` (`order_status`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `fk_orders_warehouse` (`warehouse_id`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_orders_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'ORD-20260812-0001',3,'Nguyễn Văn An','0901000003','Hà Nội','Hoàng Mai','Định Công','12 phố Định Công',519000.00,30000.00,0.00,549000.00,'PROCESSING','Giao giờ hành chính','2026-08-12 08:30:00','2026-08-16 21:37:33',1),(2,'ORD-20260812-0002',4,'Trần Thị Bình','0901000004','Hà Nội','Cầu Giấy','Dịch Vọng','18 Trần Thái Tông',618000.00,30000.00,50000.00,598000.00,'SHIPPING','Đã thanh toán chuyển khoản','2026-08-11 14:20:00','2026-08-16 21:37:33',1),(3,'ORD-20260810-0003',5,'Lê Minh Cường','0901000005','Hà Nội','Thanh Xuân','Khương Đình','45 Nguyễn Trãi',799000.00,0.00,0.00,799000.00,'COMPLETED','Khách doanh nghiệp','2026-08-10 10:15:00','2026-08-16 21:37:33',1),(4,'ORD-20260809-0004',3,'Nguyễn Văn An','0901000003','Hà Nội','Hai Bà Trưng','Bạch Mai','25 phố Bạch Mai',485000.00,30000.00,0.00,515000.00,'DELIVERED','Giao thành công','2026-08-09 09:00:00','2026-08-16 21:37:33',1),(7,'ORD-20260817-3847',6,'Nguyễn Văn A','0901234567','Hà Nội','Hoàng Mai','Định Công','12 phố Định Công',330000.00,30000.00,0.00,360000.00,'CONFIRMED','Giao giờ hành chính','2026-08-17 16:45:48','2026-08-17 19:51:30',1),(8,'ORD-20260817-5598',6,'Nguyễn Văn B','0901111111','Hà Nội','Hoàng Mai','Định Công','20 phố Định Công',165000.00,30000.00,0.00,195000.00,'CANCELLED','Test payment failed','2026-08-17 16:57:06','2026-08-17 19:50:04',1),(9,'ORD-20260817-E49E64E3',6,'Nguyen Van A','0901234567','TP Ho Chi Minh','Quan 1','Ben Nghe','123 Nguyen Hue',330000.00,30000.00,0.00,360000.00,'CANCELLED','Test order','2026-08-17 21:52:06','2026-08-18 08:29:28',1),(10,'ORD-20260818-D4B7C905',6,'Nguyen Van A','0901234567','TP Ho Chi Minh','Quan 1','Ben Nghe','123 Nguyen Hue',330000.00,30000.00,0.00,360000.00,'CANCELLED','Test order','2026-08-18 08:30:10','2026-08-18 08:31:05',1),(11,'ORD-20260818-77FB1024',6,'Nguyen Van A','0901234567','TP Ho Chi Minh','Quan 1','Ben Nghe','123 Nguyen Hue',330000.00,30000.00,0.00,360000.00,'RETURNED','Test order','2026-08-18 08:31:32','2026-08-18 08:35:52',1),(12,'ORD-20260818-6A67EBA8',6,'Nguyen Van A','0901234567','TP Ho Chi Minh','Quan 1','Ben Nghe','123 Nguyen Hue',330000.00,30000.00,0.00,360000.00,'RETURNED','Test order','2026-08-18 08:38:18','2026-08-18 08:43:23',1),(13,'ORD-20260818-62FFFC6B',6,'Nguyen Van A','0901234567','TP Ho Chi Minh','Quan 1','Ben Nghe','123 Nguyen Hue',330000.00,30000.00,0.00,360000.00,'RETURNED','Test order','2026-08-18 08:44:49','2026-08-18 08:48:30',1),(14,'ORD-20260818-64B52C82',6,'Nguyen Van A','0901234567','TP Ho Chi Minh','Quan 1','Ben Nghe','123 Nguyen Hue',330000.00,30000.00,0.00,360000.00,'PROCESSING','Test order','2026-08-18 08:51:25','2026-08-18 08:52:05',1),(15,'ORD-20260818-3EABFB5E',6,'Nguyen Van A','0901234567','TP Ho Chi Minh','Quan 1','Ben Nghe','123 Nguyen Hue',330000.00,30000.00,0.00,360000.00,'RETURNED','Test order','2026-08-18 08:59:21','2026-08-18 09:02:42',1),(16,'ORD-20260818-5065560A',6,'Nguyen Van A','0901234567','TP Ho Chi Minh','Quan 1','Ben Nghe','123 Nguyen Hue',330000.00,30000.00,0.00,360000.00,'CANCELLED','Test order','2026-08-18 09:17:51','2026-08-18 09:18:48',1),(17,'ORD-20260819-AD0492A9',6,'Nguyen Van A','0901234567','Ha Noi','Cau Giay','Dich Vong','123 Duong ABC',478000.00,30000.00,0.00,508000.00,'PENDING','Test checkout','2026-08-19 09:27:53','2026-08-19 09:27:53',1),(18,'ORD-20260826-CDMYL7NQ',6,'Nguyen Van A','0901234567','Ha Noi','Cau Giay','Dich Vong','123 Duong ABC',1485000.00,30000.00,0.00,1515000.00,'CANCELLED','Test checkout','2026-08-26 17:31:38','2026-08-26 17:47:36',1),(19,'ORD-20260826-6WZ9CHXO',6,'Nguyen Van A','0901234567','Ha Noi','Cau Giay','Dich Vong','123 Duong ABC',330000.00,30000.00,0.00,360000.00,'COMPLETED','Test checkout','2026-08-26 17:49:03','2026-08-26 17:52:53',1),(20,'ORD-20260826-M21HO1ET',6,'Nguyen Van A','0901234567','Ha Noi','Cau Giay','Dich Vong','123 Duong ABC',330000.00,30000.00,0.00,360000.00,'PENDING','Test checkout','2026-08-26 18:15:15','2026-08-26 18:15:15',1),(21,'ORD-20260826-2WYE4074',6,'Nguyen Van A','0901234567','Ha Noi','Cau Giay','Dich Vong','123 Duong ABC',330000.00,30000.00,0.00,360000.00,'RETURNED','Test checkout','2026-08-26 18:17:08','2026-08-26 20:09:53',1),(22,'ORD-20260826-9Q4YFP3B',6,'Nguyen Van A','0901234567','Ha Noi','Cau Giay','Dich Vong','123 Duong ABC',330000.00,30000.00,0.00,360000.00,'PROCESSING','Test checkout','2026-08-26 19:30:46','2026-08-26 20:02:25',1),(23,'ORD-20260828-TIWAMK85',6,'Nguyen Van A','0987654321','TP. Hồ Chí Minh','Quận 1','Phường Bến Nghé','123 Đường Lê Lợi',330000.00,15000.00,10000.00,335000.00,'PENDING','Giao giờ hành chính','2026-08-28 10:01:23','2026-08-28 10:01:23',1),(24,'ORD-20260828-OMLLLXEK',6,'Nguyen Van A','0987654321','TP. Hồ Chí Minh','Quận 1','Phường Bến Nghé','123 Đường Lê Lợi',330000.00,15000.00,0.00,345000.00,'PENDING','Giao giờ hành chính','2026-08-28 10:03:16','2026-08-28 10:03:16',1),(25,'ORD-20260910-U3FFSC6T',6,'Khách hàng','0000000000','Chưa cung cấp','Chưa cung cấp','Chưa cung cấp','Chưa cung cấp',1406000.00,0.00,0.00,1406000.00,'PENDING',NULL,'2026-09-10 11:35:20','2026-09-10 11:35:20',1),(26,'ORD-20260910-F2ST85NY',6,'tôi là nguyễn Văn Đồng','0373660207','Chưa cung cấp','Chưa cung cấp','Chưa cung cấp','Hà Nội, thanh toán khi nhận hàng',1434000.00,0.00,0.00,1434000.00,'PENDING',NULL,'2026-09-10 16:30:44','2026-09-10 16:30:44',1),(27,'ORD-20260914-ZNBDHU53',6,'Nguyễn Văn Đồng','0373660207','Chưa cung cấp','Chưa cung cấp','Chưa cung cấp','ở Việt Nam',2151000.00,0.00,0.00,2151000.00,'PENDING',NULL,'2026-09-14 19:47:57','2026-09-14 19:47:57',1);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint DEFAULT NULL,
  `payment_method` enum('COD','BANK_TRANSFER','VNPAY','MOMO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_code` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('PENDING','SUCCESS','FAILED','REFUND_REQUESTED','REFUNDED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_payments_order` (`order_id`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,1,'COD',NULL,549000.00,'PENDING',NULL,'2026-08-12 13:06:11'),(2,2,'BANK_TRANSFER','BANK-20260811-0002',598000.00,'SUCCESS','2026-08-11 14:25:00','2026-08-12 13:06:11'),(3,3,'VNPAY','VNPAY-20260810-0003',799000.00,'SUCCESS','2026-08-10 10:18:00','2026-08-12 13:06:11'),(4,4,'COD',NULL,515000.00,'PENDING',NULL,'2026-08-12 13:06:11'),(5,7,'COD','COD-20260817-0001',360000.00,'REFUNDED','2026-08-17 16:54:03','2026-08-17 16:45:48'),(6,8,'COD','TEST-FAILED-001',195000.00,'FAILED',NULL,'2026-08-17 16:57:06'),(7,9,'COD',NULL,360000.00,'PENDING',NULL,'2026-08-17 21:52:06'),(8,10,'COD',NULL,360000.00,'PENDING',NULL,'2026-08-18 08:30:10'),(9,11,'COD',NULL,360000.00,'REFUNDED','2026-08-18 08:35:19','2026-08-18 08:31:32'),(10,12,'COD',NULL,360000.00,'REFUNDED','2026-08-18 08:41:09','2026-08-18 08:38:18'),(11,13,'COD',NULL,360000.00,'REFUNDED','2026-08-18 08:48:05','2026-08-18 08:44:49'),(12,14,'COD',NULL,360000.00,'PENDING',NULL,'2026-08-18 08:51:25'),(13,15,'COD',NULL,360000.00,'REFUNDED','2026-08-18 09:02:11','2026-08-18 08:59:21'),(14,16,'COD',NULL,360000.00,'PENDING',NULL,'2026-08-18 09:17:51'),(15,17,'COD',NULL,508000.00,'PENDING',NULL,'2026-08-19 09:27:53'),(16,20,'COD',NULL,360000.00,'PENDING',NULL,'2026-08-26 18:15:15'),(17,21,'COD',NULL,360000.00,'SUCCESS','2026-08-26 19:29:35','2026-08-26 18:17:08'),(18,22,'COD',NULL,360000.00,'PENDING',NULL,'2026-08-26 19:30:46'),(19,23,'COD',NULL,335000.00,'PENDING',NULL,'2026-08-28 10:01:23'),(20,24,'COD',NULL,345000.00,'PENDING',NULL,'2026-08-28 10:03:16'),(21,18,'COD',NULL,1515000.00,'FAILED',NULL,'2026-09-10 09:51:59'),(22,19,'COD',NULL,360000.00,'SUCCESS',NULL,'2026-09-10 09:51:59'),(23,25,'COD',NULL,1406000.00,'PENDING',NULL,'2026-09-10 11:35:20'),(24,26,'COD',NULL,1434000.00,'PENDING',NULL,'2026-09-10 16:30:44'),(25,27,'COD',NULL,2151000.00,'PENDING',NULL,'2026-09-14 19:47:57');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_aliases`
--

DROP TABLE IF EXISTS `product_aliases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_aliases` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint NOT NULL,
  `alias` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `normalized_alias` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_alias_product_normalized` (`product_id`,`normalized_alias`),
  KEY `idx_product_alias_normalized` (`normalized_alias`),
  KEY `idx_product_alias_product` (`product_id`),
  CONSTRAINT `fk_product_alias_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=208 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_aliases`
--

LOCK TABLES `product_aliases` WRITE;
/*!40000 ALTER TABLE `product_aliases` DISABLE KEYS */;
INSERT INTO `product_aliases` VALUES (157,1,'cà phê robusta','ca phe robusta','2026-09-03 12:05:44'),(158,1,'robusta','robusta','2026-09-03 12:05:44'),(159,1,'cafe robusta','cafe robusta','2026-09-03 12:05:44'),(160,1,'cà phê hạt robusta','ca phe hat robusta','2026-09-03 12:05:44'),(161,1,'robusta 500g','robusta 500g','2026-09-03 12:05:44'),(162,1,'cà phê robusta 500g','ca phe robusta 500g','2026-09-03 12:05:44'),(163,1,'cafe hạt robusta','cafe hat robusta','2026-09-03 12:05:44'),(164,2,'cà phê arabica','ca phe arabica','2026-09-03 12:05:44'),(165,2,'arabica','arabica','2026-09-03 12:05:44'),(166,2,'cafe arabica','cafe arabica','2026-09-03 12:05:44'),(167,2,'arabica cầu đất','arabica cau dat','2026-09-03 12:05:44'),(168,2,'cà phê arabica cầu đất','ca phe arabica cau dat','2026-09-03 12:05:44'),(169,2,'cà phê cầu đất','ca phe cau dat','2026-09-03 12:05:44'),(170,2,'cafe cầu đất','cafe cau dat','2026-09-03 12:05:44'),(171,3,'trà shan tuyết','tra shan tuyet','2026-09-03 12:05:44'),(172,3,'shan tuyết','shan tuyet','2026-09-03 12:05:44'),(173,3,'trà shan tuyết cổ thụ','tra shan tuyet co thu','2026-09-03 12:05:44'),(174,3,'shan tuyết cổ thụ','shan tuyet co thu','2026-09-03 12:05:44'),(175,4,'trà ô long','tra o long','2026-09-03 12:05:44'),(176,4,'ô long','o long','2026-09-03 12:05:44'),(177,4,'trà ô long tây bắc','tra o long tay bac','2026-09-03 12:05:44'),(178,4,'ô long tây bắc','o long tay bac','2026-09-03 12:05:44'),(179,5,'hạt điều','hat dieu','2026-09-03 12:05:44'),(180,5,'hạt điều rang muối','hat dieu rang muoi','2026-09-03 12:05:44'),(181,5,'điều rang muối','dieu rang muoi','2026-09-03 12:05:44'),(182,5,'hạt điều muối','hat dieu muoi','2026-09-03 12:05:44'),(183,6,'hạt mắc ca','hat mac ca','2026-09-03 12:05:44'),(184,6,'mắc ca','mac ca','2026-09-03 12:05:44'),(185,6,'macadamia','macadamia','2026-09-03 12:05:44'),(186,6,'hạt macadamia','hat macadamia','2026-09-03 12:05:44'),(187,7,'mật ong','mat ong','2026-09-03 12:05:44'),(188,7,'mật ong hoa rừng','mat ong hoa rung','2026-09-03 12:05:44'),(189,7,'mật ong tây bắc','mat ong tay bac','2026-09-03 12:05:44'),(190,7,'mật ong hoa rừng tây bắc','mat ong hoa rung tay bac','2026-09-03 12:05:44'),(191,8,'măng khô','mang kho','2026-09-03 12:05:44'),(192,8,'măng khô tây bắc','mang kho tay bac','2026-09-03 12:05:44'),(193,8,'măng tây bắc','mang tay bac','2026-09-03 12:05:44'),(194,9,'hộp quà tết','hop qua tet','2026-09-03 12:05:44'),(195,9,'quà tết','qua tet','2026-09-03 12:05:44'),(196,9,'hộp quà nông sản','hop qua nong san','2026-09-03 12:05:44'),(197,9,'quà tết nông sản','qua tet nong san','2026-09-03 12:05:44'),(198,9,'hộp quà tết nông sản việt','hop qua tet nong san viet','2026-09-03 12:05:44'),(199,10,'quà doanh nghiệp','qua doanh nghiep','2026-09-03 12:05:44'),(200,10,'bộ quà doanh nghiệp','bo qua doanh nghiep','2026-09-03 12:05:44'),(201,10,'quà doanh nghiệp premium','qua doanh nghiep premium','2026-09-03 12:05:44'),(202,10,'quà premium','qua premium','2026-09-03 12:05:44'),(203,11,'hộp quà tết cao cấp','hop qua tet cao cap','2026-09-03 12:05:44'),(204,11,'hộp quà lifegift','hop qua lifegift','2026-09-03 12:05:44'),(205,11,'quà tết lifegift','qua tet lifegift','2026-09-03 12:05:44'),(206,11,'hộp quà tết lifegift','hop qua tet lifegift','2026-09-03 12:05:44'),(207,11,'hộp quà cao cấp lifegift','hop qua cao cap lifegift','2026-09-03 12:05:44');
/*!40000 ALTER TABLE `product_aliases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_product_images_product` (`product_id`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (1,1,'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',1,1,'2026-08-12 13:06:11'),(2,1,'https://images.unsplash.com/photo-1512568400610-62da28bc8a13',0,2,'2026-08-12 13:06:11'),(3,2,'https://images.unsplash.com/photo-1447933601403-0c6688de566e',1,1,'2026-08-12 13:06:11'),(4,3,'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9',1,1,'2026-08-12 13:06:11'),(5,4,'https://images.unsplash.com/photo-1544787219-7f47ccb76574',1,1,'2026-08-12 13:06:11'),(6,5,'https://images.unsplash.com/photo-1508061253366-f7da158b6d46',1,1,'2026-08-12 13:06:11'),(7,6,'https://images.unsplash.com/photo-1599599810769-bcde5a160d32',1,1,'2026-08-12 13:06:11'),(8,7,'https://images.unsplash.com/photo-1471943311424-646960669fbc',1,1,'2026-08-12 13:06:11'),(9,8,'https://images.unsplash.com/photo-1600189020115-e6a9f5e7b1c1',1,1,'2026-08-12 13:06:11'),(10,9,'https://images.unsplash.com/photo-1549465220-1a8b9238cd48',1,1,'2026-08-12 13:06:11'),(11,10,'https://images.unsplash.com/photo-1607344645866-009c320b63e0',1,1,'2026-08-12 13:06:11'),(15,11,'https://example.com/images/hop-qua-tet-main.jpg',1,0,'2026-08-26 09:16:26'),(16,11,'https://example.com/images/hop-qua-tet-detail-1.jpg',0,1,'2026-08-26 09:16:26'),(17,11,'https://example.com/images/hop-qua-tet-detail-2.jpg',0,2,'2026-08-26 09:16:26');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category_id` bigint NOT NULL,
  `brand_id` bigint DEFAULT NULL,
  `sku` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(280) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `short_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(15,2) NOT NULL DEFAULT '0.00',
  `sale_price` decimal(15,2) DEFAULT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sản phẩm',
  `weight` decimal(10,2) DEFAULT NULL,
  `origin` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pricing_type` enum('FIXED_PRICE','CONTACT_FOR_PRICE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FIXED_PRICE',
  `stock_status` enum('IN_STOCK','LOW_STOCK','OUT_OF_STOCK','PRE_ORDER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IN_STOCK',
  `status` enum('ACTIVE','INACTIVE','DRAFT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_brand` (`brand_id`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_featured` (`is_featured`),
  CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,4,2,'CF-001','Cà phê Robusta nguyên hạt 500g','ca-phe-robusta-nguyen-hat-500g','Cà phê Robusta rang mộc, hương thơm mạnh, vị đậm đà, phù hợp pha phin và máy.','Cà phê Robusta rang mộc 500g.',185000.00,165000.00,'Gói',500.00,'Buôn Ma Thuột','FIXED_PRICE','IN_STOCK','ACTIVE',1,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(2,4,2,'CF-002','Cà phê Arabica Cầu Đất 500g','ca-phe-arabica-cau-dat-500g','Cà phê Arabica trồng tại vùng Cầu Đất, hương thơm dịu và hậu vị cân bằng.','Arabica Cầu Đất 500g.',260000.00,239000.00,'Gói',500.00,'Cầu Đất - Đà Lạt','FIXED_PRICE','IN_STOCK','ACTIVE',1,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(3,5,1,'TR-001','Trà Shan Tuyết cổ thụ 200g','tra-shan-tuyet-co-thu-200g','Trà Shan Tuyết được thu hái từ những cây trà cổ thụ vùng núi phía Bắc.','Trà Shan Tuyết cổ thụ 200g.',320000.00,299000.00,'Hộp',200.00,'Hà Giang','FIXED_PRICE','IN_STOCK','ACTIVE',1,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(4,5,3,'TR-002','Trà Ô Long Tây Bắc 200g','tra-o-long-tay-bac-200g','Trà Ô Long thơm nhẹ, hậu vị thanh, đóng hộp sang trọng.','Trà Ô Long 200g.',280000.00,NULL,'Hộp',200.00,'Sơn La','FIXED_PRICE','IN_STOCK','ACTIVE',0,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(5,6,4,'HN-001','Hạt điều rang muối 500g','hat-dieu-rang-muoi-500g','Hạt điều rang muối giòn thơm, phù hợp dùng hằng ngày và làm quà.','Hạt điều rang muối 500g.',210000.00,189000.00,'Hộp',500.00,'Bình Phước','FIXED_PRICE','IN_STOCK','ACTIVE',1,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(6,6,4,'HN-002','Hạt mắc ca 500g','hat-mac-ca-500g','Mắc ca giàu dinh dưỡng, đóng gói tiện lợi.','Hạt mắc ca 500g.',290000.00,269000.00,'Hộp',500.00,'Lâm Đồng','FIXED_PRICE','IN_STOCK','ACTIVE',0,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(7,7,3,'DS-001','Mật ong hoa rừng Tây Bắc 500ml','mat-ong-hoa-rung-tay-bac-500ml','Mật ong hoa rừng nguyên chất, vị thơm tự nhiên.','Mật ong hoa rừng 500ml.',350000.00,319000.00,'Chai',500.00,'Sơn La','FIXED_PRICE','IN_STOCK','ACTIVE',1,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(8,7,3,'DS-002','Măng khô Tây Bắc 500g','mang-kho-tay-bac-500g','Măng khô chọn lọc từ vùng núi Tây Bắc.','Măng khô 500g.',240000.00,NULL,'Túi',500.00,'Điện Biên','FIXED_PRICE','LOW_STOCK','ACTIVE',0,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(9,8,1,'QT-001','Hộp quà Tết Nông Sản Việt','hop-qua-tet-nong-san-viet','Bộ quà tặng gồm cà phê, trà, hạt điều và mật ong, phù hợp làm quà doanh nghiệp.','Hộp quà nông sản Việt cao cấp.',890000.00,799000.00,'Hộp',2500.00,'Việt Nam','FIXED_PRICE','IN_STOCK','ACTIVE',1,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(10,8,1,'QT-002','Quà doanh nghiệp Premium','qua-doanh-nghiep-premium','Bộ quà doanh nghiệp thiết kế theo yêu cầu. Liên hệ để nhận báo giá.','Bộ quà doanh nghiệp tùy chỉnh.',0.00,NULL,'Bộ',5000.00,'Việt Nam','CONTACT_FOR_PRICE','IN_STOCK','ACTIVE',1,'2026-08-12 13:06:11','2026-08-12 13:06:11'),(11,1,1,'LG-SP001','Hộp Quà Tết Cao Cấp LifeGift 2026','hop-qua-tet-cao-cap-lifegift-2026','Hộp quà Tết sang trọng chứa các hạt dinh dưỡng cao cấp và trà ô long thượng hạng.','Hộp quà Tết sang trọng, ý nghĩa dành cho doanh nghiệp và gia đình.',850000.00,790000.00,'Hộp',1.50,'Việt Nam','FIXED_PRICE','IN_STOCK','ACTIVE',1,'2026-08-26 09:14:08','2026-08-26 09:16:26');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `purchase_order_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `quantity` int NOT NULL,
  `unit_cost` decimal(15,2) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_purchase_order_items_order` (`purchase_order_id`),
  KEY `fk_purchase_order_items_product` (`product_id`),
  CONSTRAINT `fk_purchase_order_items_order` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_purchase_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_items`
--

LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
INSERT INTO `purchase_order_items` VALUES (1,1,1,100,120000.00,12000000.00),(2,1,2,30,180000.00,5400000.00),(3,1,5,10,60000.00,600000.00),(4,2,3,30,220000.00,6600000.00),(5,2,7,20,295000.00,5900000.00),(12,6,10,100,150000.00,15000000.00),(13,6,1,50,300000.00,15000000.00);
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `purchase_code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplier_id` bigint NOT NULL,
  `warehouse_id` bigint NOT NULL,
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('DRAFT','ORDERED','PARTIAL_RECEIVED','RECEIVED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `ordered_at` datetime DEFAULT NULL,
  `expected_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_code` (`purchase_code`),
  KEY `fk_purchase_orders_supplier` (`supplier_id`),
  KEY `fk_purchase_orders_warehouse` (`warehouse_id`),
  CONSTRAINT `fk_purchase_orders_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `fk_purchase_orders_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES (1,'PO-202608-0001',1,1,18000000.00,'RECEIVED','2026-08-01 09:00:00','2026-08-03 09:00:00','2026-08-12 13:06:11','2026-08-12 13:06:11'),(2,'PO-202608-0002',2,1,12500000.00,'PARTIAL_RECEIVED','2026-08-05 10:00:00','2026-08-15 09:00:00','2026-08-12 13:06:11','2026-08-12 13:06:11'),(6,'PO-1787717957571-8949',1,1,30000000.00,'RECEIVED','2026-03-30 08:00:00','2026-04-02 17:00:00','2026-08-26 11:19:18','2026-08-26 11:21:14');
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `order_id` bigint NOT NULL,
  `rating` tinyint NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `status` enum('PENDING','APPROVED','HIDDEN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_reviews_user` (`user_id`),
  KEY `fk_reviews_order` (`order_id`),
  KEY `idx_reviews_product` (`product_id`),
  CONSTRAINT `fk_reviews_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_reviews_rating` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,5,9,3,5,'Hộp quà rất đẹp','Đóng gói đẹp, phù hợp làm quà doanh nghiệp.','APPROVED','2026-08-12 13:06:11','2026-09-03 10:38:08'),(2,3,1,1,5,'Cà phê thơm','Hương thơm tốt, vị đậm và dễ pha phin.','APPROVED','2026-08-12 13:06:11','2026-08-12 13:06:11'),(3,4,3,2,4,'Trà ngon','Trà thơm, đóng gói khá đẹp.','APPROVED','2026-08-12 13:06:11','2026-08-12 13:06:11'),(4,3,2,4,5,'Arabica chất lượng','Vị cân bằng, phù hợp uống buổi sáng.','APPROVED','2026-08-12 13:06:11','2026-08-12 13:06:11'),(5,6,1,24,5,'Sản phẩm tuyệt vời ngoài mong đợi','Chất lượng sản phẩm rất tốt, đóng gói cẩn thận và giao hàng siêu nhanh. Sẽ ủng hộ shop dài dài!','APPROVED','2026-09-03 10:36:01','2026-09-03 10:38:21');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'ADMIN','Quản trị viên hệ thống','2026-08-12 13:06:11'),(2,'STAFF','Nhân viên quản lý bán hàng và kho','2026-08-12 13:06:11'),(3,'CUSTOMER','Khách hàng','2026-08-12 13:06:11'),(4,'AFFILIATE','Cộng tác viên / đối tác','2026-08-12 13:06:11');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'SUP-CF','HTX Cà phê Buôn Ma Thuột','0902000001','coffee@supplier.vn','Buôn Ma Thuột, Đắk Lắk','600000001','ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(2,'SUP-TB','Tây Bắc Nông Sản','0902000002','taybac@supplier.vn','Sơn La','550000002','ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(3,'SUP-HN','Nông sản Green Việt','0902000003','green@supplier.vn','Hà Nội','010000003','ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_refresh_tokens`
--

DROP TABLE IF EXISTS `user_refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_refresh_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `refresh_token` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_token_UNIQUE` (`refresh_token`),
  KEY `fk_user_refresh_tokens_users_idx` (`user_id`),
  CONSTRAINT `fk_user_refresh_tokens_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_refresh_tokens`
--

LOCK TABLES `user_refresh_tokens` WRITE;
/*!40000 ALTER TABLE `user_refresh_tokens` DISABLE KEYS */;
INSERT INTO `user_refresh_tokens` VALUES (18,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYiLCJ1c2VybmFtZSI6Ik5ndXllblZhbkRvbmciLCJpYXQiOjE3ODkwMTQ3NTEsImV4cCI6MTc4OTYxOTU1MX0.7cuPtiABfG-SWxOIa0s6lNJ0gs_vKPLrcNBWRvuTb6o','2026-09-17 11:32:32','2026-09-10 11:32:32'),(27,6,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYiLCJ1c2VybmFtZSI6Ik5ndXllblZhbkRvbmciLCJpYXQiOjE3ODkzOTAyMjUsImV4cCI6MTc4OTk5NTAyNX0.arO9e-VwquDAn6aYcKhowcn2LoP2BDHWBv7g2nrj_J0','2026-09-21 19:50:25','2026-09-14 19:50:25');
/*!40000 ALTER TABLE `user_refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `fk_user_roles_role` (`role_id`),
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1),(6,1),(2,2),(3,3),(4,3),(5,3),(7,3),(8,3),(9,3),(10,3),(11,3),(12,3),(5,4);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','LOCKED','PENDING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','Nguyễn Quản Trị','0901000001','admin@lifegift.vn',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(2,'staff01','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','Trần Thị Nhân Viên','0901000002','staff@lifegift.vn',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(3,'nguyenvana','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','Nguyễn Văn An','0901000003','an@gmail.com',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(4,'tranthib','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','Trần Thị Bình','0901000004','binh@gmail.com',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(5,'leminhc','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','Lê Minh Cường','0901000005','cuong@gmail.com',NULL,'ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(6,'NguyenVanDong','$2a$10$p/RvUvjuRkIZGAVKFGVpa.WvGNCSOI.VrdsYUwSqM2JC4FUON6LPi','Nguyễn Văn Đồng','0373660207','nguyenvandong@gmail.com',NULL,'ACTIVE','2026-08-12 14:02:20','2026-08-12 14:02:20'),(7,'NguyeVanDong1','$2a$10$HiPzYKDs83em5q4Qa/4KZOIKrl24Ija1afPuiKFZOHmEYosv3Y0U6','Nguyễn Văn Đồng','0373660208','abc@gmail.com',NULL,'ACTIVE','2026-08-12 14:27:38','2026-08-12 14:27:38'),(8,'username','$2b$10$OL0vHPzE3kVj0gcLAkogFuZhxupMMOx2g./1x51YNmIOGwLPgpOmW','Nguyễn Văn A','0987654321','nguyenvana@gmail.com',NULL,'ACTIVE','2026-08-24 10:23:43','2026-08-24 10:23:43'),(9,'username1','$2b$10$uyNP68AXu5uINZ6hGxuBnuEBEWAmn4BEP.YX1fqMDzwesa2bfz7ZO','Nguyễn Văn A','09876543211','nguyenvana1@gmail.com',NULL,'ACTIVE','2026-08-24 10:30:22','2026-08-24 10:30:22'),(10,'username2','$2b$10$eMT3gKfGjlqVGXklC2Kg1OyNWuxEW7kpVf8DK1x.RoBarnm3KaPmm','Nguyễn Văn A','sdfsdfa','nguyenvana2@gmail.com',NULL,'ACTIVE','2026-08-24 10:32:44','2026-08-24 10:32:44'),(11,'username3','$2b$10$HrvURraBWLePMuBVFEH5kuPAcAoJoHXNTcMkWLcDguJ5ZnzHdszYu','Nguyễn Văn A','03561212','nguyenvana3@gmail.com',NULL,'ACTIVE','2026-08-24 10:37:24','2026-08-24 10:37:24'),(12,'username4','$2b$10$pbjutFOKJZIVfXVRK4LhMuFmlouDHQwsY8QZfHqHnhxusQdcbLyje','Nguyễn Văn A','0356121233','nguyenvana4@gmail.com',NULL,'ACTIVE','2026-08-24 17:41:16','2026-08-24 17:41:16');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES (1,'WH-HN','Kho Hà Nội','Khu công nghiệp Thanh Trì, Hà Nội','ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(2,'WH-HCM','Kho Hồ Chí Minh','Quận 12, TP. Hồ Chí Minh','ACTIVE','2026-08-12 13:06:11','2026-08-12 13:06:11'),(3,'WH-HN1','Kho Hà Nội','Khu công nghiệp Thanh Trì','ACTIVE','2026-08-16 16:26:50','2026-08-16 16:31:15'),(4,'KHO-HN-01','Kho Hàng Hà Nội - Cầu Giấy','Số 123 Đường Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội','ACTIVE','2026-08-26 09:28:59','2026-08-26 09:28:59'),(5,'KHO-HN-0','Kho Hàng Hà Nội - Cầu Giấy','Số 123 Đường Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội','ACTIVE','2026-08-26 09:29:49','2026-08-26 09:31:19');
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-15 12:45:51
