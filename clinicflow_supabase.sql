-- ============================================================
-- ClinicFlow - Complete Database Restoration Script
-- Compatible with Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- DROP EXISTING TABLES (respecting foreign key dependencies)
-- ============================================================

DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- ============================================================
-- CREATE TABLES
-- ============================================================

-- 1. accounts (no FK dependencies)
CREATE TABLE accounts (
    id character varying NOT NULL DEFAULT gen_random_uuid(),
    email character varying NOT NULL,
    password_hash character varying NOT NULL,
    first_name character varying,
    verified boolean NOT NULL DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    last_name character varying,
    CONSTRAINT accounts_pkey PRIMARY KEY (id),
    CONSTRAINT accounts_email_unique UNIQUE (email)
);

-- 2. users (no FK dependencies)
CREATE TABLE users (
    id character varying NOT NULL DEFAULT gen_random_uuid(),
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- 3. sessions (no FK dependencies)
CREATE TABLE sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL,
    CONSTRAINT sessions_pkey PRIMARY KEY (sid)
);

CREATE INDEX "IDX_session_expire" ON sessions USING btree (expire);

-- 4. profiles (FK to users)
CREATE TABLE profiles (
    id serial NOT NULL,
    user_id text NOT NULL,
    role text NOT NULL DEFAULT 'assistant'::text,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 5. visits (FK to accounts, users)
CREATE TABLE visits (
    id serial NOT NULL,
    patient_name text NOT NULL,
    arrival_time timestamp with time zone NOT NULL DEFAULT now(),
    condition text NOT NULL,
    status text NOT NULL DEFAULT 'waiting'::text,
    price integer,
    next_step text,
    last_updated_by text,
    visit_date date NOT NULL DEFAULT now(),
    age integer,
    mutuelle text NOT NULL DEFAULT 'Non'::text,
    mutuelle_remplie text NOT NULL DEFAULT 'Non'::text,
    phone_number text,
    account_id character varying,
    CONSTRAINT visits_pkey PRIMARY KEY (id),
    CONSTRAINT visits_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES accounts(id),
    CONSTRAINT visits_last_updated_by_users_id_fk FOREIGN KEY (last_updated_by) REFERENCES users(id)
);

-- 6. verification_tokens (FK to accounts)
CREATE TABLE verification_tokens (
    id serial NOT NULL,
    account_id character varying NOT NULL,
    token character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    CONSTRAINT verification_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT verification_tokens_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- 7. password_reset_tokens (FK to accounts)
CREATE TABLE password_reset_tokens (
    id serial NOT NULL,
    account_id character varying NOT NULL,
    token character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT password_reset_tokens_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- ============================================================
-- INSERT DATA
-- ============================================================

-- accounts
INSERT INTO accounts (id, email, password_hash, first_name, verified, created_at, last_name) VALUES
('1a68ffae-ac2d-4816-b200-0fa2f9c92691', 'test@test.com', '$2b$12$eiAeoN1Gqg1QEFEey7fcy.opt5YjfER5geEOmkGfEcFM2FZf6xQ7q', NULL, true, '2026-02-15 19:43:41.511736', NULL),
('25d66a86-374e-4374-86f1-f69847c78c3d', 'e2e_ry2l58@test.com', '$2b$12$reeG39cNvV454X1S1O0khOUF9nOT0ur69sNXePd3GzpgZjoY0rHoS', NULL, true, '2026-02-15 19:46:54.951269', NULL),
('43cde1b6-4fb0-45b1-a0cc-a6a4c4d59d37', 'dr.moutayamine@gmail.com', '$2b$12$/UOypt2UecL9KL2nn9M.iekOYKGhFKgvKW7GzaIZOwhX2RGYsxt4G', 'Hakim', true, '2026-02-15 21:49:16.783963', 'Moutayamine'),
('e27f660e-5692-47f5-b9ed-30cb0d6d25a7', 'fatihhamza2001@gmail.com', '$2b$12$ojf9eRFcJLRzaYxvyphx1OnTLVlufJgcuzM0ekHX6EQKsOM9bGZVG', 'Hamza', true, '2026-02-15 21:49:16.783963', 'Fatih');

-- users
INSERT INTO users (id, email, first_name, last_name, profile_image_url, created_at, updated_at) VALUES
('doctor-chart-test', 'doctor-chart@test.com', 'Chart', 'Doctor', NULL, '2026-02-10 14:48:25.996837', '2026-02-10 14:48:25.996837'),
('9957232', 'doctor@test.com', 'Fatih', 'Hamza', NULL, '2026-02-02 18:37:57.66326', '2026-02-10 14:54:51.989');

-- profiles
INSERT INTO profiles (id, user_id, role) VALUES
(1, '9957232', 'doctor'),
(2, 'doctor-chart-test', 'assistant');

-- visits
INSERT INTO visits (id, patient_name, arrival_time, condition, status, price, next_step, last_updated_by, visit_date, age, mutuelle, mutuelle_remplie, phone_number, account_id) VALUES
(1, 'John Doe', '2026-02-02 18:31:06.941825+00', 'Flu symptoms', 'waiting', NULL, NULL, NULL, '2026-02-02', NULL, 'Non', 'Non', NULL, NULL),
(2, 'Jane Smith', '2026-02-02 18:31:06.986078+00', 'Back pain', 'done', 400, 'rdv 2 semaines', '9957232', '2026-02-02', NULL, 'Non', 'Non', NULL, NULL),
(3, 'John Doe', '2026-02-04 12:39:29.647047+00', 'Flu symptoms', 'waiting', NULL, NULL, NULL, '2026-02-04', NULL, 'Non', 'Non', NULL, NULL),
(4, 'Jane Smith', '2026-02-04 12:39:29.662256+00', 'Back pain', 'in_consultation', NULL, NULL, NULL, '2026-02-04', NULL, 'Non', 'Non', NULL, NULL),
(5, 'John Doe', '2026-02-05 23:01:53.464711+00', 'Flu symptoms', 'waiting', NULL, NULL, NULL, '2026-02-05', NULL, 'Non', 'Non', NULL, NULL),
(6, 'Jane Smith', '2026-02-05 23:01:53.485595+00', 'Back pain', 'in_consultation', NULL, NULL, NULL, '2026-02-05', NULL, 'Non', 'Non', NULL, NULL),
(7, 'John Doe', '2026-02-06 08:32:05.689583+00', 'Flu symptoms', 'waiting', NULL, NULL, NULL, '2026-02-06', NULL, 'Non', 'Non', NULL, NULL),
(8, 'Jane Smith', '2026-02-06 08:32:05.701877+00', 'Back pain', 'in_consultation', NULL, NULL, NULL, '2026-02-06', NULL, 'Non', 'Non', NULL, NULL),
(9, 'John Doe', '2026-02-08 15:14:20.356622+00', 'Flu symptoms', 'waiting', NULL, NULL, NULL, '2026-02-08', NULL, 'Non', 'Non', NULL, NULL),
(10, 'Jane Smith', '2026-02-08 15:14:20.371506+00', 'Back pain', 'in_consultation', NULL, NULL, NULL, '2026-02-08', NULL, 'Non', 'Non', NULL, NULL),
(11, 'Hamza Fatih', '2026-02-08 16:07:00.890442+00', 'Fièvre', 'waiting', 2000, 'Suivi après deux semaines', '9957232', '2026-02-08', 27, 'Oui', 'Oui', NULL, NULL),
(12, 'El ammari Ahmed', '2026-02-08 16:08:44.649924+00', 'mal au dos', 'waiting', NULL, NULL, NULL, '2026-02-08', 52, 'Non', 'Non', NULL, NULL),
(13, 'Jean Dupont', '2026-02-09 18:12:14.690948+00', 'Symptômes grippaux', 'waiting', NULL, NULL, NULL, '2026-02-09', 45, 'Oui', 'Non', NULL, NULL),
(14, 'Marie Durant', '2026-02-09 18:12:14.702842+00', 'Mal de dos', 'in_consultation', NULL, NULL, NULL, '2026-02-09', 32, 'Non', 'Non', NULL, NULL),
(15, 'kjo', '2026-02-09 18:52:47.176528+00', 'kjk', 'left', NULL, NULL, '9957232', '2026-02-09', NULL, 'Non', 'Non', NULL, NULL),
(16, 'sdfqsdf', '2026-02-09 19:19:14.789642+00', 'sdfq', 'waiting', 400, NULL, '9957232', '2026-02-09', NULL, 'Non', 'Non', NULL, NULL),
(17, 'zetrze', '2026-02-09 19:19:55.881371+00', 'zerzer', 'waiting', 200, NULL, '9957232', '2026-02-09', NULL, 'Non', 'Non', NULL, NULL),
(19, 'Hamza Fatih', '2026-02-10 09:33:57.227943+00', 'MMM', 'waiting', NULL, NULL, NULL, '2026-02-10', NULL, 'Non', 'Non', NULL, NULL),
(18, 'Simo Zaki', '2026-02-10 09:33:32.870122+00', 'Fièvre', 'done', 300, NULL, '9957232', '2026-02-10', NULL, 'Oui', 'Non', NULL, NULL),
(20, 'El ammari Ahmed', '2026-02-10 09:34:09.192182+00', 'xxx', 'done', 400, NULL, '9957232', '2026-02-10', NULL, 'Non', 'Non', NULL, NULL),
(21, 'www ppp', '2026-02-10 09:35:18.89999+00', 'wpwp', 'waiting', NULL, NULL, NULL, '2026-02-10', NULL, 'Non', 'Non', NULL, NULL),
(22, 'Simo Zaki', '2026-02-10 09:35:50.842637+00', 'www', 'waiting', NULL, NULL, NULL, '2026-02-10', NULL, 'Non', 'Non', NULL, NULL),
(25, 'Simo Zaki', '2026-02-10 09:36:12.741352+00', 'Simo Zaki', 'waiting', NULL, NULL, NULL, '2026-02-10', NULL, 'Oui', 'Oui', NULL, NULL),
(27, 'Simo Zaki', '2026-02-10 09:36:54.528582+00', 'Simo Zaki', 'done', 800, NULL, '9957232', '2026-02-10', NULL, 'Oui', 'Oui', NULL, NULL),
(55, 'Jean', '2026-02-10 15:05:16.568275+00', 'Jean', 'waiting', NULL, NULL, NULL, '2026-02-10', 1, 'Oui', 'Oui', NULL, NULL),
(26, 'Simo Zakiop', '2026-02-10 09:36:45.225709+00', 'Simo Zaki', 'waiting', NULL, NULL, NULL, '2026-02-10', NULL, 'Oui', 'Non', NULL, NULL),
(24, 'Simo Zaki3', '2026-02-10 09:36:01.791663+00', 'Simo Zaki', 'done', 500, NULL, '9957232', '2026-02-10', NULL, 'Oui', 'Oui', NULL, NULL),
(58, 'Hamza', '2026-02-11 09:06:02.108101+00', 'Fièvre', 'waiting', 250, NULL, NULL, '2026-02-11', 20, 'Oui', 'Non', '00000', NULL);

-- ============================================================
-- RESET SEQUENCES to correct values
-- ============================================================

SELECT setval('visits_id_seq', 61, true);
SELECT setval('profiles_id_seq', 2, true);
SELECT setval('verification_tokens_id_seq', 2, true);
SELECT setval('password_reset_tokens_id_seq', 1, true);

-- ============================================================
-- END OF RESTORATION SCRIPT
-- ============================================================
