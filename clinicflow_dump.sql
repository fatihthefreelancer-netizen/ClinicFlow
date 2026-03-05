--
-- PostgreSQL database dump
--

\restrict Rh9bFQoinMqF5gBSxCDkVJqVkyNHTwP7JRWlGteCQxDbhd5GyMxMK7TfK59v8Oz

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.visits DROP CONSTRAINT IF EXISTS visits_last_updated_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.visits DROP CONSTRAINT IF EXISTS visits_account_id_accounts_id_fk;
ALTER TABLE IF EXISTS ONLY public.verification_tokens DROP CONSTRAINT IF EXISTS verification_tokens_account_id_accounts_id_fk;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_account_id_accounts_id_fk;
DROP INDEX IF EXISTS public."IDX_session_expire";
ALTER TABLE IF EXISTS ONLY public.visits DROP CONSTRAINT IF EXISTS visits_pkey;
ALTER TABLE IF EXISTS ONLY public.verification_tokens DROP CONSTRAINT IF EXISTS verification_tokens_token_unique;
ALTER TABLE IF EXISTS ONLY public.verification_tokens DROP CONSTRAINT IF EXISTS verification_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_token_unique;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS accounts_email_unique;
ALTER TABLE IF EXISTS public.visits ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.verification_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.password_reset_tokens ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.visits_id_seq;
DROP TABLE IF EXISTS public.visits;
DROP SEQUENCE IF EXISTS public.verification_tokens_id_seq;
DROP TABLE IF EXISTS public.verification_tokens;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.sessions;
DROP SEQUENCE IF EXISTS public.profiles_id_seq;
DROP TABLE IF EXISTS public.profiles;
DROP SEQUENCE IF EXISTS public.password_reset_tokens_id_seq;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP TABLE IF EXISTS public.accounts;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    password_hash character varying NOT NULL,
    first_name character varying,
    verified boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    last_name character varying
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    account_id character varying NOT NULL,
    token character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id integer NOT NULL,
    user_id text NOT NULL,
    role text DEFAULT 'assistant'::text NOT NULL
);


--
-- Name: profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profiles_id_seq OWNED BY public.profiles.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_tokens (
    id integer NOT NULL,
    account_id character varying NOT NULL,
    token character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


--
-- Name: verification_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verification_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verification_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verification_tokens_id_seq OWNED BY public.verification_tokens.id;


--
-- Name: visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visits (
    id integer NOT NULL,
    patient_name text NOT NULL,
    arrival_time timestamp with time zone DEFAULT now() NOT NULL,
    condition text NOT NULL,
    status text DEFAULT 'waiting'::text NOT NULL,
    price integer,
    next_step text,
    last_updated_by text,
    visit_date date DEFAULT now() NOT NULL,
    age integer,
    mutuelle text DEFAULT 'Non'::text NOT NULL,
    mutuelle_remplie text DEFAULT 'Non'::text NOT NULL,
    phone_number text,
    account_id character varying
);


--
-- Name: visits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visits_id_seq OWNED BY public.visits.id;


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles ALTER COLUMN id SET DEFAULT nextval('public.profiles_id_seq'::regclass);


--
-- Name: verification_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens ALTER COLUMN id SET DEFAULT nextval('public.verification_tokens_id_seq'::regclass);


--
-- Name: visits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits ALTER COLUMN id SET DEFAULT nextval('public.visits_id_seq'::regclass);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, email, password_hash, first_name, verified, created_at, last_name) FROM stdin;
1a68ffae-ac2d-4816-b200-0fa2f9c92691	test@test.com	$2b$12$eiAeoN1Gqg1QEFEey7fcy.opt5YjfER5geEOmkGfEcFM2FZf6xQ7q	\N	t	2026-02-15 19:43:41.511736	\N
25d66a86-374e-4374-86f1-f69847c78c3d	e2e_ry2l58@test.com	$2b$12$reeG39cNvV454X1S1O0khOUF9nOT0ur69sNXePd3GzpgZjoY0rHoS	\N	t	2026-02-15 19:46:54.951269	\N
43cde1b6-4fb0-45b1-a0cc-a6a4c4d59d37	dr.moutayamine@gmail.com	$2b$12$/UOypt2UecL9KL2nn9M.iekOYKGhFKgvKW7GzaIZOwhX2RGYsxt4G	Hakim	t	2026-02-15 21:49:16.783963	Moutayamine
e27f660e-5692-47f5-b9ed-30cb0d6d25a7	fatihhamza2001@gmail.com	$2b$12$ojf9eRFcJLRzaYxvyphx1OnTLVlufJgcuzM0ekHX6EQKsOM9bGZVG	Hamza	t	2026-02-15 21:49:16.783963	Fatih
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, account_id, token, expires_at) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, user_id, role) FROM stdin;
1	9957232	doctor
2	doctor-chart-test	assistant
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (sid, sess, expire) FROM stdin;
73qzqXSOiXHnwdhAZ0xpowL8ktOfK4Fy	{"user": {"id": "doctor-hakim1", "role": "doctor", "lastName": "Doctor", "username": "Hakim1", "firstName": "Hakim"}, "cookie": {"path": "/", "secure": false, "expires": "2026-02-17T15:50:34.141Z", "httpOnly": true, "originalMaxAge": 604800000}}	2026-02-17 15:51:47
cejmInsLaIpb7OsGKrkN3cJKF7i1lqDI	{"user": {"id": "doctor-hakim1", "role": "doctor", "lastName": "Doctor", "username": "Hakim1", "firstName": "Hakim"}, "cookie": {"path": "/", "secure": false, "expires": "2026-02-17T15:52:45.628Z", "httpOnly": true, "originalMaxAge": 604800000}}	2026-02-17 15:52:46
C8hxgegvUbJvvpd1rviUksZ-doD8PhxW	{"cookie": {"path": "/", "secure": false, "expires": "2026-02-22T22:21:31.875Z", "httpOnly": true, "originalMaxAge": 604800000}, "account": {"id": "43cde1b6-4fb0-45b1-a0cc-a6a4c4d59d37", "email": "dr.moutayamine@gmail.com", "lastName": "Moutayamine", "firstName": "Hakim"}}	2026-02-22 22:21:32
HHbkTkHONodLFlJoU-NtgQGldWSiw_Yj	{"cookie": {"path": "/", "secure": false, "expires": "2026-02-22T22:21:32.275Z", "httpOnly": true, "originalMaxAge": 604800000}, "account": {"id": "e27f660e-5692-47f5-b9ed-30cb0d6d25a7", "email": "fatihhamza2001@gmail.com", "lastName": "Fatih", "firstName": "Hamza"}}	2026-02-22 22:21:33
rTEjtdI73G5FxlEUb2ScDpGTipXFnf3R	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-17T09:14:37.716Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "68431b3d-ef84-4041-86c0-f78ee4498eb3", "exp": 1770718477, "iat": 1770714877, "iss": "https://replit.com/oidc", "sub": "9957232", "email": "fatihhamza2001@gmail.com", "at_hash": "2BAIQeIVkfRd5DNJOknNkg", "username": "FatihHamza1", "auth_time": 1770564459, "last_name": "Hamza", "first_name": "Fatih", "email_verified": true}, "expires_at": 1770718477, "access_token": "uq-Wlc1QahOSa-q5dvx-fEkDH3b68ppEqZhfnB7ZZG7", "refresh_token": "nhId8Pi8vp0ZARBXdHJf1b-NRf6fTLbSLE6juRxDSpx"}}}	2026-02-17 09:43:24
E-vhCZ0wbcGjVid6cOOXSYmVqpcahwv4	{"cookie": {"path": "/", "secure": false, "expires": "2026-02-22T21:49:32.140Z", "httpOnly": true, "originalMaxAge": 604800000}, "account": {"id": "43cde1b6-4fb0-45b1-a0cc-a6a4c4d59d37", "email": "dr.moutayamine@gmail.com", "lastName": "Moutayamine", "firstName": "Hakim"}}	2026-02-22 21:49:33
KWPh3nTK5XMi2ZFQIrQF7PJhW8v17xGA	{"user": {"id": "doctor-hakim1", "role": "doctor", "lastName": "Doctor", "username": "Hakim1", "firstName": "Hakim"}, "cookie": {"path": "/", "secure": false, "expires": "2026-02-18T09:05:12.591Z", "httpOnly": true, "originalMaxAge": 604800000}}	2026-02-24 10:53:46
GJGjHuxC1n-4XH7zmRBcmDMQH4C_Pi5V	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-17T14:49:41.820Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "68431b3d-ef84-4041-86c0-f78ee4498eb3", "exp": 1770738581, "iat": 1770734981, "iss": "https://test-mock-oidc.replit.app/", "jti": "436e11b3c7cd0979dfdeace0ee862822", "sub": "9957232", "email": "doctor@test.com", "auth_time": 1770734981, "last_name": "Hamza", "first_name": "Fatih"}, "expires_at": 1770738581, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzcwNzM0OTgxLCJleHAiOjE3NzA3Mzg1ODEsInN1YiI6Ijk5NTcyMzIiLCJlbWFpbCI6ImRvY3RvckB0ZXN0LmNvbSIsImZpcnN0X25hbWUiOiJGYXRpaCIsImxhc3RfbmFtZSI6IkhhbXphIn0.ub6piLBdTn9g-1n12CCaFOhImedInY4hKpSagv-Spe6KZuA51uXSc0C26ohovh9rkrN-ohhCuAL0ij43CygaQHYOlr2Udfi6YmR89YkJY6Fn136aCEtO4_t7oGanYNIIqS0lX-dtQzNEkCBmcJnXiIpM4TMUfgRCBJVXd_j_iaBBN0cf6NCsUV9k-6lvGLDYjMZeMrBJuTaplApJ1A2D4esRsZhakduokrgGXR7Ow3trJ10OlwiB3GLU4MBg0iTOENgHEtyTuiDCenjDptYLkgrvfiadifRJmeDgVNf3he-01mZC-Ztvgq23GFkEPaMfsBjlONPTzfKWuuwNohxXgQ", "refresh_token": "eyJzdWIiOiI5OTU3MjMyIiwiZW1haWwiOiJkb2N0b3JAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiRmF0aWgiLCJsYXN0X25hbWUiOiJIYW16YSJ9"}}}	2026-02-17 14:50:38
1tZGEVMn5BHL8QrKhd36CBtKl73dO8Id	{"cookie": {"path": "/", "secure": false, "expires": "2026-02-22T19:44:00.689Z", "httpOnly": true, "originalMaxAge": 604800000}, "account": {"id": "1a68ffae-ac2d-4816-b200-0fa2f9c92691", "email": "test@test.com", "clinicName": "Test Clinic"}}	2026-02-22 19:44:13
nAlbJOMcil-vXNYZBTx737m37Uk9Riyp	{"user": {"id": "doctor-hakim1", "role": "doctor", "lastName": "Doctor", "username": "Hakim1", "firstName": "Hakim"}, "cookie": {"path": "/", "secure": false, "expires": "2026-02-22T19:22:25.519Z", "httpOnly": true, "originalMaxAge": 604800000}}	2026-02-22 19:24:24
MKmYZuLtQ8ifKDfLTCxA0YsoGn1GR0j5	{"cookie": {"path": "/", "secure": false, "expires": "2026-02-22T21:49:33.228Z", "httpOnly": true, "originalMaxAge": 604800000}, "account": {"id": "e27f660e-5692-47f5-b9ed-30cb0d6d25a7", "email": "fatihhamza2001@gmail.com", "lastName": "Fatih", "firstName": "Hamza"}}	2026-02-22 21:49:34
BZ2n5ee1hmyEx--qMYHIx_zirneoIsrL	{"user": {"id": "assistant-1", "role": "assistant", "lastName": "Clinique", "username": "Assistant1", "firstName": "Assistant"}, "cookie": {"path": "/", "secure": false, "expires": "2026-02-17T15:17:07.358Z", "httpOnly": true, "originalMaxAge": 604800000}}	2026-02-17 15:17:42
PThDYhPlYYvgvgPYxw2VaUm3eTFAeKHn	{"user": {"id": "doctor-hakim1", "role": "doctor", "lastName": "Doctor", "username": "Hakim1", "firstName": "Hakim"}, "cookie": {"path": "/", "secure": false, "expires": "2026-02-17T15:53:17.282Z", "httpOnly": true, "originalMaxAge": 604800000}}	2026-02-17 15:53:18
Uhdg-UP3dZYIthsl3VV6gqjRnp-dl8Ef	{"user": {"id": "doctor-hakim1", "role": "doctor", "lastName": "Doctor", "username": "Hakim1", "firstName": "Hakim"}, "cookie": {"path": "/", "secure": false, "expires": "2026-02-17T15:54:02.653Z", "httpOnly": true, "originalMaxAge": 604800000}}	2026-02-17 15:54:03
jQTZNRoX-5jw6x0DCV9hK07XAxIOD3qF	{"cookie": {"path": "/", "secure": false, "expires": "2026-02-22T19:49:34.807Z", "httpOnly": true, "originalMaxAge": 604800000}, "account": {"id": "1a68ffae-ac2d-4816-b200-0fa2f9c92691", "email": "test@test.com", "clinicName": "Test Clinic"}}	2026-02-22 19:49:36
HQtquPqMgfnVC9RYrzUIFXf5q2gkVCa9	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-17T14:54:52.014Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "68431b3d-ef84-4041-86c0-f78ee4498eb3", "exp": 1770738891, "iat": 1770735291, "iss": "https://test-mock-oidc.replit.app/", "jti": "0e3c4f4108b7cefb1a6ff5da0560e8bd", "sub": "9957232", "email": "doctor@test.com", "auth_time": 1770735291, "last_name": "Hamza", "first_name": "Fatih"}, "expires_at": 1770738891, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzcwNzM1MjkxLCJleHAiOjE3NzA3Mzg4OTEsInN1YiI6Ijk5NTcyMzIiLCJlbWFpbCI6ImRvY3RvckB0ZXN0LmNvbSIsImZpcnN0X25hbWUiOiJGYXRpaCIsImxhc3RfbmFtZSI6IkhhbXphIn0.hr4ANB8_sH_tuDQvxtT5-O60VdIP90gxOGqs7fXQDdYmDftrGVQjI_4T3MI54S7pV3-n6Zbiab8TbNXjIltIMdob1v5X2XAIXXlT7NvxeBxd0yiHcymbF50CX8t5Gi_Q6IZc50Kg22IH5tsbAGlsWU5AWlBhFmmmtn1BHe4jVlX_sAzGygd7EaxOc7zgSJYAvunWBPhX2zX_bM1ZB4-Ac52IygzRzhusB-o43dZIhKbpsUAaQHA22fLNHqgqoTj1VC9y4YOv-tc-4BqlCVbn2o7nu5NIQub4S5o-C4OylT89HMjFJU7-sAP5PCsAdEKJP05rqhFg3lRxD2ErH9BJbQ", "refresh_token": "eyJzdWIiOiI5OTU3MjMyIiwiZW1haWwiOiJkb2N0b3JAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiRmF0aWgiLCJsYXN0X25hbWUiOiJIYW16YSJ9"}}}	2026-02-17 14:55:01
RdfOo7ooC31wfxyqHgTR-Z1Fv0a3Qs0M	{"user": {"id": "doctor-hakim1", "role": "doctor", "lastName": "Doctor", "username": "Hakim1", "firstName": "Hakim"}, "cookie": {"path": "/", "secure": false, "expires": "2026-02-17T15:54:44.950Z", "httpOnly": true, "originalMaxAge": 604800000}}	2026-02-17 15:56:26
Pi1qtAIRi41-j7IKvm_pkgdSv-wsOk2Y	{"cookie": {"path": "/", "secure": false, "expires": "2026-02-22T22:14:27.100Z", "httpOnly": true, "originalMaxAge": 604800000}, "account": {"id": "43cde1b6-4fb0-45b1-a0cc-a6a4c4d59d37", "email": "dr.moutayamine@gmail.com", "lastName": "Moutayamine", "firstName": "Hakim"}}	2026-02-22 22:14:28
w4mt_BcttH6abBYDQHBaXRiWjEmBjhhu	{"cookie": {"path": "/", "secure": false, "expires": "2026-02-22T22:14:27.582Z", "httpOnly": true, "originalMaxAge": 604800000}, "account": {"id": "e27f660e-5692-47f5-b9ed-30cb0d6d25a7", "email": "fatihhamza2001@gmail.com", "lastName": "Fatih", "firstName": "Hamza"}}	2026-02-22 22:14:28
1_gAWY51QTcOWnqh2GddRjQZYpuZamUI	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-17T14:48:26.010Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "68431b3d-ef84-4041-86c0-f78ee4498eb3", "exp": 1770738505, "iat": 1770734905, "iss": "https://test-mock-oidc.replit.app/", "jti": "56baa5e2e9a6fbc551de80ef1b44843d", "sub": "doctor-chart-test", "email": "doctor-chart@test.com", "auth_time": 1770734905, "last_name": "Doctor", "first_name": "Chart"}, "expires_at": 1770738505, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzcwNzM0OTA1LCJleHAiOjE3NzA3Mzg1MDUsInN1YiI6ImRvY3Rvci1jaGFydC10ZXN0IiwiZW1haWwiOiJkb2N0b3ItY2hhcnRAdGVzdC5jb20iLCJmaXJzdF9uYW1lIjoiQ2hhcnQiLCJsYXN0X25hbWUiOiJEb2N0b3IifQ.srgmzb1AkpMByfLTOpXfoTMZV2S3FxhuLyhF14KoSbSjH3_0f3af1Ot8jDIexPY6wt5mrgwpnsd3wyaoy6Z_BNGvlJ5S6iRM4awquIcHLSIBpmPYgyXEI9_l_UEefF5PHzcv1S8tWlhxAyAemn9cdjlXy5K8c-Db0wOxudv8jfz8cntdjTwsLIXM-jO0KIa7ugz4cvAoP2b9d8w3eWaUa4DE3yNSwbIWZVmMFFGxIFvHlXOONTHf2NLcrvzg5AHe6wg4FlwpKcQF-dIjhXY-x9w5J1l1j2t8pvfzp3vwY2-RDpluFWXHBO5F2tstw2Ooo2o3cYS2N1WGw9kQk4Ja3w", "refresh_token": "eyJzdWIiOiJkb2N0b3ItY2hhcnQtdGVzdCIsImVtYWlsIjoiZG9jdG9yLWNoYXJ0QHRlc3QuY29tIiwiZmlyc3RfbmFtZSI6IkNoYXJ0IiwibGFzdF9uYW1lIjoiRG9jdG9yIn0"}}}	2026-02-17 14:48:27
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, first_name, last_name, profile_image_url, created_at, updated_at) FROM stdin;
doctor-chart-test	doctor-chart@test.com	Chart	Doctor	\N	2026-02-10 14:48:25.996837	2026-02-10 14:48:25.996837
9957232	doctor@test.com	Fatih	Hamza	\N	2026-02-02 18:37:57.66326	2026-02-10 14:54:51.989
\.


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verification_tokens (id, account_id, token, expires_at) FROM stdin;
\.


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.visits (id, patient_name, arrival_time, condition, status, price, next_step, last_updated_by, visit_date, age, mutuelle, mutuelle_remplie, phone_number, account_id) FROM stdin;
1	John Doe	2026-02-02 18:31:06.941825+00	Flu symptoms	waiting	\N	\N	\N	2026-02-02	\N	Non	Non	\N	\N
2	Jane Smith	2026-02-02 18:31:06.986078+00	Back pain	done	400	rdv 2 semaines	9957232	2026-02-02	\N	Non	Non	\N	\N
3	John Doe	2026-02-04 12:39:29.647047+00	Flu symptoms	waiting	\N	\N	\N	2026-02-04	\N	Non	Non	\N	\N
4	Jane Smith	2026-02-04 12:39:29.662256+00	Back pain	in_consultation	\N	\N	\N	2026-02-04	\N	Non	Non	\N	\N
5	John Doe	2026-02-05 23:01:53.464711+00	Flu symptoms	waiting	\N	\N	\N	2026-02-05	\N	Non	Non	\N	\N
6	Jane Smith	2026-02-05 23:01:53.485595+00	Back pain	in_consultation	\N	\N	\N	2026-02-05	\N	Non	Non	\N	\N
7	John Doe	2026-02-06 08:32:05.689583+00	Flu symptoms	waiting	\N	\N	\N	2026-02-06	\N	Non	Non	\N	\N
8	Jane Smith	2026-02-06 08:32:05.701877+00	Back pain	in_consultation	\N	\N	\N	2026-02-06	\N	Non	Non	\N	\N
9	John Doe	2026-02-08 15:14:20.356622+00	Flu symptoms	waiting	\N	\N	\N	2026-02-08	\N	Non	Non	\N	\N
10	Jane Smith	2026-02-08 15:14:20.371506+00	Back pain	in_consultation	\N	\N	\N	2026-02-08	\N	Non	Non	\N	\N
11	Hamza Fatih	2026-02-08 16:07:00.890442+00	Fièvre	waiting	2000	Suivi après deux semaines	9957232	2026-02-08	27	Oui	Oui	\N	\N
12	El ammari Ahmed	2026-02-08 16:08:44.649924+00	mal au dos	waiting	\N	\N	\N	2026-02-08	52	Non	Non	\N	\N
13	Jean Dupont	2026-02-09 18:12:14.690948+00	Symptômes grippaux	waiting	\N	\N	\N	2026-02-09	45	Oui	Non	\N	\N
14	Marie Durant	2026-02-09 18:12:14.702842+00	Mal de dos	in_consultation	\N	\N	\N	2026-02-09	32	Non	Non	\N	\N
15	kjo	2026-02-09 18:52:47.176528+00	kjk	left	\N	\N	9957232	2026-02-09	\N	Non	Non		\N
16	sdfqsdf	2026-02-09 19:19:14.789642+00	sdfq	waiting	400	\N	9957232	2026-02-09	\N	Non	Non		\N
17	zetrze	2026-02-09 19:19:55.881371+00	zerzer	waiting	200	\N	9957232	2026-02-09	\N	Non	Non		\N
19	Hamza Fatih	2026-02-10 09:33:57.227943+00	MMM	waiting	\N	\N	\N	2026-02-10	\N	Non	Non		\N
18	Simo Zaki	2026-02-10 09:33:32.870122+00	Fièvre	done	300	\N	9957232	2026-02-10	\N	Oui	Non		\N
20	El ammari Ahmed	2026-02-10 09:34:09.192182+00	xxx	done	400	\N	9957232	2026-02-10	\N	Non	Non		\N
21	www ppp	2026-02-10 09:35:18.89999+00	wpwp	waiting	\N	\N	\N	2026-02-10	\N	Non	Non		\N
22	Simo Zaki	2026-02-10 09:35:50.842637+00	www	waiting	\N	\N	\N	2026-02-10	\N	Non	Non		\N
25	Simo Zaki	2026-02-10 09:36:12.741352+00	Simo Zaki	waiting	\N	\N	\N	2026-02-10	\N	Oui	Oui		\N
27	Simo Zaki	2026-02-10 09:36:54.528582+00	Simo Zaki	done	800	\N	9957232	2026-02-10	\N	Oui	Oui		\N
55	Jean	2026-02-10 15:05:16.568275+00	Jean	waiting	\N	\N	\N	2026-02-10	1	Oui	Oui		\N
26	Simo Zakiop	2026-02-10 09:36:45.225709+00	Simo Zaki	waiting	\N	\N	\N	2026-02-10	\N	Oui	Non		\N
24	Simo Zaki3	2026-02-10 09:36:01.791663+00	Simo Zaki	done	500	\N	9957232	2026-02-10	\N	Oui	Oui		\N
58	Hamza	2026-02-11 09:06:02.108101+00	Fièvre	waiting	250	\N	\N	2026-02-11	20	Oui	Non	00000	\N
\.


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- Name: profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.profiles_id_seq', 2, true);


--
-- Name: verification_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.verification_tokens_id_seq', 2, true);


--
-- Name: visits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.visits_id_seq', 61, true);


--
-- Name: accounts accounts_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_email_unique UNIQUE (email);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_unique UNIQUE (token);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_tokens verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: verification_tokens verification_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_token_unique UNIQUE (token);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: password_reset_tokens password_reset_tokens_account_id_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: verification_tokens verification_tokens_account_id_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: visits visits_account_id_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: visits visits_last_updated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_last_updated_by_users_id_fk FOREIGN KEY (last_updated_by) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict Rh9bFQoinMqF5gBSxCDkVJqVkyNHTwP7JRWlGteCQxDbhd5GyMxMK7TfK59v8Oz

