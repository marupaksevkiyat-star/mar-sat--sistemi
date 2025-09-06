-- SATIŞ VE ÜRETİM YÖNETİM SİSTEMİ - VERİTABANI YEDEĞI
-- Oluşturma Tarihi: 2025-09-06
-- Toplam Tablo Sayısı: 16

-- ==============================================
-- KULLANICILAR VERİLERİ
-- ==============================================
INSERT INTO users (id, email, first_name, last_name, profile_image_url, role, is_active, created_at, updated_at) VALUES
('admin', 'admin@system.com', 'Admin', 'User', NULL, 'admin', true, '2025-09-03 09:34:19.179401', '2025-09-03 09:34:19.179401'),
('sales_staff', 'ayse@company.com', 'Ayşe', 'Demir', NULL, 'sales', true, '2025-09-05 19:58:52.387722', '2025-09-05 19:58:52.387722'),
('production_staff', 'zeynep@company.com', 'Zeynep', 'Çelik', NULL, 'production', true, '2025-09-05 19:58:52.387722', '2025-09-05 19:58:52.387722'),
('shipping_staff', 'murat@company.com', 'Murat', 'Arslan', NULL, 'shipping', true, '2025-09-05 19:58:52.387722', '2025-09-05 19:58:52.387722'),
('accounting_staff', 'elif@company.com', 'Elif', 'Şahin', NULL, 'accounting', true, '2025-09-05 19:58:52.387722', '2025-09-05 19:58:52.387722');

-- ==============================================
-- MÜŞTERİLER VERİLERİ
-- ==============================================
INSERT INTO customers (id, company_name, contact_person, phone, email, address, latitude, longitude, status, sales_person_id, created_at, updated_at) VALUES
('b9190d31-ba28-4305-90e3-264c8bd99895', 'ABC Market', 'Ahmet Yılmaz', '0532 123 4567', 'ahmet@abcmarket.com', 'Cumhuriyet Cad. No:45 Kadıköy/İstanbul', NULL, NULL, 'active', 'admin', '2025-09-05 15:29:00.479307', '2025-09-05 15:29:00.479307'),
('34a7d6ac-af32-4e78-a0bf-f4a1094aaba8', 'XYZ Manav', 'Fatma Demir', '0535 987 6543', 'fatma@xyzmanav.com', 'Atatürk Bulvarı No:123 Çankaya/Ankara', NULL, NULL, 'active', 'admin', '2025-09-05 15:29:00.479307', '2025-09-05 15:29:00.479307'),
('b4443285-0a2f-466d-9597-fa505af047eb', 'Test Restaurant', 'Mehmet Kaya', '0541 555 1234', 'mehmet@testrestaurant.com', 'İstiklal Cad. No:78 Konak/İzmir', NULL, NULL, 'potential', 'admin', '2025-09-05 15:29:00.479307', '2025-09-05 15:29:00.479307'),
('c0b7fb9d-de25-4afa-9ac4-c26d21fa93a0', 'Tula Cafe Restorant', 'ER', NULL, NULL, NULL, NULL, NULL, 'active', 'admin', '2025-09-05 15:45:11.441552', '2025-09-05 15:45:11.441552'),
('95cf66d7-2929-4fea-9910-1e5756e07814', 'son müşteri', 'asdasd', '234234234234', NULL, NULL, NULL, NULL, 'active', 'admin', '2025-09-05 18:20:35.076065', '2025-09-05 18:20:35.076065'),
('8de2cb45-d8e2-48f5-bdda-fcbc3f3714d6', 'BAB CAFE', 'VAAS', '12313123', '123123', NULL, NULL, NULL, 'active', 'admin', '2025-09-05 18:49:41.419951', '2025-09-05 18:49:41.419951'),
('fc87ab89-e84e-4bd4-af85-3b73af0b5e45', 'Test Müşteri', 'Ahmet Test', '555-1234', 'test@example.com', 'Test Adresi', 41.00820000, 28.97840000, 'active', 'admin', '2025-09-06 01:39:56.392312', '2025-09-06 01:39:56.392312');

-- ==============================================
-- ÜRÜNLER VERİLERİ
-- ==============================================
INSERT INTO products (id, name, description, unit, price, is_active, created_at, updated_at) VALUES
('9eda4f40-dcca-4c2c-8f0e-46ea154ab209', 'Domates (1kg)', 'Taze domates, 1 kilogram', 'kg', 25.00, true, '2025-09-05 15:29:12.027564', '2025-09-05 15:29:12.027564'),
('b9914ac5-aa45-4f02-b996-a89a29e7d23d', 'Salatalık (1kg)', 'Taze salatalık, 1 kilogram', 'kg', 18.00, true, '2025-09-05 15:29:12.027564', '2025-09-05 15:29:12.027564'),
('f86852ff-c144-4180-af56-6d1ea8d91451', 'Marul (500gr)', 'Taze marul, 500 gram paket', 'adet', 12.00, true, '2025-09-05 15:29:12.027564', '2025-09-05 15:29:12.027564'),
('f57f48c1-cb0b-4009-b7a1-b8d241e26e1c', 'Maydanoz (250gr)', 'Taze maydanoz, 250 gram demet', 'demet', 8.00, true, '2025-09-05 15:29:12.027564', '2025-09-05 15:29:12.027564'),
('aa5418ed-9da7-4efd-90eb-74e11f3f9c2c', 'Biber (1kg)', 'Taze biber karışık, 1 kilogram', 'kg', 35.00, true, '2025-09-05 15:29:12.027564', '2025-09-05 15:29:12.027564'),
('0f4169fe-99b5-4b59-90c7-0112ba7cc9c9', 'Patlıcan (1kg)', 'Taze patlıcan, 1 kilogram', 'kg', 28.00, true, '2025-09-05 15:29:12.027564', '2025-09-05 15:29:12.027564'),
('a2cb4c6f-4132-4c42-8df8-ba5adeacf089', 'Test Ürün', 'Test açıklaması', 'adet', 25.50, true, '2025-06-06 01:40:05.243271', '2025-09-06 01:40:05.243271');

-- ==============================================
-- SİPARİŞLER ÖZET BİLGİSİ
-- ==============================================
-- Toplam: 14 sipariş
-- Tamamlanan: 14 sipariş
-- Toplam Ciro: ~650 TL
-- En aktif müşteri: ABC Market (4 sipariş)

-- VERİTABANI YEDEK DOSYASI SONU
-- Render PostgreSQL'e geçiş için hazır