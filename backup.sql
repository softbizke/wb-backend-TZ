--
-- PostgreSQL database dump
--

\restrict yzW1it3WtVNAa5ZpZAbz5gLMXobaz3LzI7DYye5CdHhJiCpybq4nzD5rhLMiqIQ

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

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

--
-- Name: anpr_mode_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.anpr_mode_type AS ENUM (
    'snapshot',
    'manual'
);


ALTER TYPE public.anpr_mode_type OWNER TO postgres;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: delivery_order_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delivery_order_seq
    START WITH 0
    INCREMENT BY 1
    MINVALUE 0
    MAXVALUE 9999
    CACHE 1
    CYCLE;


ALTER SEQUENCE public.delivery_order_seq OWNER TO postgres;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.knex_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_id_seq OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knex_migrations (
    id integer DEFAULT nextval('public.knex_migrations_id_seq'::regclass) NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.knex_migrations OWNER TO postgres;

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNER TO postgres;

--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knex_migrations_lock (
    index integer DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass) NOT NULL,
    is_locked integer
);


ALTER TABLE public.knex_migrations_lock OWNER TO postgres;

--
-- Name: tos_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_activities_id_seq OWNER TO postgres;

--
-- Name: tos_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_activities (
    id integer DEFAULT nextval('public.tos_activities_id_seq'::regclass) NOT NULL,
    delivery_order_id integer,
    activity_type integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    truck_no character varying(50) NOT NULL,
    trailler_no character varying(50),
    tare_weight numeric(10,2),
    qty numeric(10,2),
    gross_weight numeric(10,2),
    isactive boolean NOT NULL,
    images text[],
    weighbridge_details jsonb,
    fw_at timestamp with time zone,
    sw_at timestamp with time zone,
    fw_by integer,
    sw_by integer,
    avrg_w real,
    fw_wb integer,
    sw_wb integer,
    approved_by integer,
    approved_at timestamp with time zone,
    reason text,
    sw_truck_no character varying,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tos_activities OWNER TO postgres;

--
-- Name: tos_activity_points_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_activity_points_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_activity_points_id_seq OWNER TO postgres;

--
-- Name: tos_activity_points; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_activity_points (
    id integer DEFAULT nextval('public.tos_activity_points_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    address character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    isactive boolean NOT NULL,
    camera_ids integer[]
);


ALTER TABLE public.tos_activity_points OWNER TO postgres;

--
-- Name: tos_activity_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_activity_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_activity_type_id_seq OWNER TO postgres;

--
-- Name: tos_activity_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_activity_type (
    id integer DEFAULT nextval('public.tos_activity_type_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    isactive boolean NOT NULL
);


ALTER TABLE public.tos_activity_type OWNER TO postgres;

--
-- Name: tost_anpr_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tost_anpr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tost_anpr_id_seq OWNER TO postgres;

--
-- Name: tos_anpr; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_anpr (
    id integer DEFAULT nextval('public.tost_anpr_id_seq'::regclass) NOT NULL,
    truck_no character varying(255),
    camera_id character varying(255),
    snap_time timestamp without time zone,
    created_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    weight bigint
);


ALTER TABLE public.tos_anpr OWNER TO postgres;

--
-- Name: tost_anpr_table_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tost_anpr_table_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tost_anpr_table_id_seq OWNER TO postgres;

--
-- Name: tos_anpr_table; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_anpr_table (
    id integer DEFAULT nextval('public.tost_anpr_table_id_seq'::regclass) NOT NULL,
    truck_no character varying(50) NOT NULL,
    camera_id integer NOT NULL,
    snap_time timestamp without time zone NOT NULL,
    created_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    old_truck_no character varying(255),
    detected_truck_no character varying(255),
    mode public.anpr_mode_type DEFAULT 'snapshot'::public.anpr_mode_type NOT NULL,
    is_unlicensed boolean DEFAULT false,
    camera_ip bigint,
    weight bigint
);


ALTER TABLE public.tos_anpr_table OWNER TO postgres;

--
-- Name: tos_buying_center; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_buying_center (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cms_id integer,
    code character varying(50),
    cms_village_id bigint,
    village_name character varying(255),
    cms_cotton_type_id bigint,
    cotton_type_name character varying(255)
);


ALTER TABLE public.tos_buying_center OWNER TO postgres;

--
-- Name: tos_buying_center_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_buying_center_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_buying_center_id_seq OWNER TO postgres;

--
-- Name: tos_buying_center_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tos_buying_center_id_seq OWNED BY public.tos_buying_center.id;


--
-- Name: tos_camera_information_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_camera_information_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_camera_information_id_seq OWNER TO postgres;

--
-- Name: tos_camera_information; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_camera_information (
    id integer DEFAULT nextval('public.tos_camera_information_id_seq'::regclass) NOT NULL,
    model character varying(100) DEFAULT 'Generic Camera'::character varying,
    ip_address character varying(255) DEFAULT '0.0.0.0'::character varying,
    rtsp_url character varying(255) DEFAULT 'rtsp://localhost:554/stream'::character varying,
    status character varying(20) DEFAULT 'active'::character varying,
    location_coordinates point DEFAULT point((0)::double precision, (0)::double precision),
    configuration jsonb DEFAULT '{"fps": 30, "resolution": "1920x1080"}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    username character varying(255),
    password character varying(255)
);


ALTER TABLE public.tos_camera_information OWNER TO postgres;

--
-- Name: tos_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_customer_id_seq OWNER TO postgres;

--
-- Name: tos_customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_customer (
    id integer DEFAULT nextval('public.tos_customer_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    isactive boolean NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    customer_type_id integer,
    bp_code character varying(255)
);


ALTER TABLE public.tos_customer OWNER TO postgres;

--
-- Name: tos_customer_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_customer_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_customer_type_id_seq OWNER TO postgres;

--
-- Name: tos_customer_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_customer_type (
    id integer DEFAULT nextval('public.tos_customer_type_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    isactive boolean NOT NULL
);


ALTER TABLE public.tos_customer_type OWNER TO postgres;

--
-- Name: tos_delivery_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_delivery_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_delivery_orders_id_seq OWNER TO postgres;

--
-- Name: tos_delivery_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_delivery_orders (
    id integer DEFAULT nextval('public.tos_delivery_orders_id_seq'::regclass) NOT NULL,
    order_number character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    truck_no character varying(50) NOT NULL,
    trailler_no character varying(50),
    customer_id integer,
    driver_id integer,
    measurement character varying(50),
    isactive boolean NOT NULL,
    activitycheck integer DEFAULT 0 NOT NULL,
    product_type_id integer,
    packing_type_id integer,
    do_no character varying(50),
    vessel_id integer,
    old_truck_no character varying(255),
    wheat_type_id integer,
    detected_truck_no character varying(255),
    order_type character varying,
    transporter_id bigint,
    buying_center_id bigint,
    supplier_id bigint,
    purchase_type_id bigint,
    dispatch_type_id integer
);


ALTER TABLE public.tos_delivery_orders OWNER TO postgres;

--
-- Name: tos_dispatch_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_dispatch_type (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    isactive boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tos_dispatch_type OWNER TO postgres;

--
-- Name: tos_dispatch_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_dispatch_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_dispatch_type_id_seq OWNER TO postgres;

--
-- Name: tos_dispatch_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tos_dispatch_type_id_seq OWNED BY public.tos_dispatch_type.id;


--
-- Name: tos_drivers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_drivers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_drivers_id_seq OWNER TO postgres;

--
-- Name: tos_drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_drivers (
    id integer DEFAULT nextval('public.tos_drivers_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    id_no character varying(50) NOT NULL,
    license_no character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean NOT NULL,
    cms_id integer,
    code character varying(50),
    phone character varying(50),
    email character varying(255),
    address text,
    updated_at timestamp without time zone
);


ALTER TABLE public.tos_drivers OWNER TO postgres;

--
-- Name: tos_finished_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_finished_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_finished_orders_id_seq OWNER TO postgres;

--
-- Name: tos_finished_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_finished_orders (
    id integer DEFAULT nextval('public.tos_finished_orders_id_seq'::regclass) NOT NULL,
    delivery_order_id integer,
    sku character varying(255),
    product_id integer,
    packing_type_id integer,
    unit character varying(50),
    measurement character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    isactive boolean NOT NULL,
    source character varying(255),
    destination character varying(255),
    transaction_type character varying(100),
    packing_id bigint,
    price_per_unit numeric DEFAULT 0
);


ALTER TABLE public.tos_finished_orders OWNER TO postgres;

--
-- Name: tos_manual_mode_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_manual_mode_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_manual_mode_id_seq OWNER TO postgres;

--
-- Name: tos_manual_mode; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_manual_mode (
    id integer DEFAULT nextval('public.tos_manual_mode_id_seq'::regclass) NOT NULL,
    user_id integer NOT NULL,
    status text DEFAULT 'pending'::text,
    reason text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT tos_manual_mode_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'ended'::text])))
);


ALTER TABLE public.tos_manual_mode OWNER TO postgres;

--
-- Name: tos_packing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_packing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_packing_id_seq OWNER TO postgres;

--
-- Name: tos_packing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_packing (
    id integer DEFAULT nextval('public.tos_packing_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    isactive boolean NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    packing_type_id integer
);


ALTER TABLE public.tos_packing OWNER TO postgres;

--
-- Name: tos_packing_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_packing_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_packing_type_id_seq OWNER TO postgres;

--
-- Name: tos_packing_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_packing_type (
    id integer DEFAULT nextval('public.tos_packing_type_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    isactive boolean NOT NULL
);


ALTER TABLE public.tos_packing_type OWNER TO postgres;

--
-- Name: tos_phone_no_verification_code_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_phone_no_verification_code_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_phone_no_verification_code_id_seq OWNER TO postgres;

--
-- Name: tos_phone_no_verification_code; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_phone_no_verification_code (
    id integer DEFAULT nextval('public.tos_phone_no_verification_code_id_seq'::regclass) NOT NULL,
    phone_no character varying(20) NOT NULL,
    code character varying(10) NOT NULL,
    is_valid boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tos_phone_no_verification_code OWNER TO postgres;

--
-- Name: tos_product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_product (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    isactive boolean NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    item_code character varying(255)
);


ALTER TABLE public.tos_product OWNER TO postgres;

--
-- Name: tos_product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_product_id_seq OWNER TO postgres;

--
-- Name: tos_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tos_product_id_seq OWNED BY public.tos_product.id;


--
-- Name: tos_product_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_product_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_product_type_id_seq OWNER TO postgres;

--
-- Name: tos_product_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_product_type (
    id integer DEFAULT nextval('public.tos_product_type_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    isactive boolean NOT NULL,
    packing_type_id integer
);


ALTER TABLE public.tos_product_type OWNER TO postgres;

--
-- Name: tos_product_weight_limits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_product_weight_limits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_product_weight_limits_id_seq OWNER TO postgres;

--
-- Name: tos_product_weight_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_product_weight_limits (
    id integer DEFAULT nextval('public.tos_product_weight_limits_id_seq'::regclass) NOT NULL,
    weight character varying(255) NOT NULL,
    min numeric(8,3) NOT NULL,
    max numeric(8,3) NOT NULL,
    stable numeric(8,3) NOT NULL,
    size numeric(8,3),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.tos_product_weight_limits OWNER TO postgres;

--
-- Name: tos_purchase_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_purchase_type (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    isactive boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tos_purchase_type OWNER TO postgres;

--
-- Name: tos_purchase_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_purchase_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_purchase_type_id_seq OWNER TO postgres;

--
-- Name: tos_purchase_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tos_purchase_type_id_seq OWNED BY public.tos_purchase_type.id;


--
-- Name: tos_suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_suppliers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    phone_number character varying(50) NOT NULL,
    isactive boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tos_suppliers OWNER TO postgres;

--
-- Name: tos_suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_suppliers_id_seq OWNER TO postgres;

--
-- Name: tos_suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tos_suppliers_id_seq OWNED BY public.tos_suppliers.id;


--
-- Name: tos_sync_meta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_sync_meta (
    key character varying NOT NULL,
    value text
);


ALTER TABLE public.tos_sync_meta OWNER TO postgres;

--
-- Name: tos_transporter; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_transporter (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    isactive boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tos_transporter OWNER TO postgres;

--
-- Name: tos_transporter_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_transporter_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_transporter_id_seq OWNER TO postgres;

--
-- Name: tos_transporter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tos_transporter_id_seq OWNED BY public.tos_transporter.id;


--
-- Name: tos_user_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_user_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_user_type_id_seq OWNER TO postgres;

--
-- Name: tos_user_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_user_type (
    id integer DEFAULT nextval('public.tos_user_type_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    isactive boolean NOT NULL
);


ALTER TABLE public.tos_user_type OWNER TO postgres;

--
-- Name: tos_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_users_id_seq OWNER TO postgres;

--
-- Name: tos_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_users (
    id integer DEFAULT nextval('public.tos_users_id_seq'::regclass) NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    email character varying(255),
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by integer,
    user_type_id integer,
    isactive boolean NOT NULL,
    phone character varying(20),
    id_no character varying(20)
);


ALTER TABLE public.tos_users OWNER TO postgres;

--
-- Name: tos_vessel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_vessel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_vessel_id_seq OWNER TO postgres;

--
-- Name: tos_vessel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_vessel (
    id integer DEFAULT nextval('public.tos_vessel_id_seq'::regclass) NOT NULL,
    vessel_type_id integer,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    isactive boolean NOT NULL
);


ALTER TABLE public.tos_vessel OWNER TO postgres;

--
-- Name: tos_vessel_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_vessel_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_vessel_type_id_seq OWNER TO postgres;

--
-- Name: tos_vessel_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_vessel_type (
    id integer DEFAULT nextval('public.tos_vessel_type_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    isactive boolean NOT NULL
);


ALTER TABLE public.tos_vessel_type OWNER TO postgres;

--
-- Name: tos_wheat_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tos_wheat_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tos_wheat_type_id_seq OWNER TO postgres;

--
-- Name: tos_wheat_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tos_wheat_type (
    id integer DEFAULT nextval('public.tos_wheat_type_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    status boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.tos_wheat_type OWNER TO postgres;

--
-- Name: tos_buying_center id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_buying_center ALTER COLUMN id SET DEFAULT nextval('public.tos_buying_center_id_seq'::regclass);


--
-- Name: tos_dispatch_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_dispatch_type ALTER COLUMN id SET DEFAULT nextval('public.tos_dispatch_type_id_seq'::regclass);


--
-- Name: tos_product id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_product ALTER COLUMN id SET DEFAULT nextval('public.tos_product_id_seq'::regclass);


--
-- Name: tos_purchase_type id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_purchase_type ALTER COLUMN id SET DEFAULT nextval('public.tos_purchase_type_id_seq'::regclass);


--
-- Name: tos_suppliers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_suppliers ALTER COLUMN id SET DEFAULT nextval('public.tos_suppliers_id_seq'::regclass);


--
-- Name: tos_transporter id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_transporter ALTER COLUMN id SET DEFAULT nextval('public.tos_transporter_id_seq'::regclass);


--
-- Data for Name: knex_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knex_migrations (id, name, batch, migration_time) FROM stdin;
\.


--
-- Data for Name: knex_migrations_lock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knex_migrations_lock (index, is_locked) FROM stdin;
\.


--
-- Data for Name: tos_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_activities (id, delivery_order_id, activity_type, created_at, truck_no, trailler_no, tare_weight, qty, gross_weight, isactive, images, weighbridge_details, fw_at, sw_at, fw_by, sw_by, avrg_w, fw_wb, sw_wb, approved_by, approved_at, reason, sw_truck_no, updated_at) FROM stdin;
40	64	10	2026-05-11 13:27:52.664349	T669DZD	\N	1380.00	\N	\N	t	{"{\\"filename\\":\\"camera4_snapshot_2026-05-11T10-27-40-238Z.jpg\\",\\"camera_id\\":4,\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1}","{\\"filename\\":\\"camera5_snapshot_2026-05-11T10-27-40-651Z.jpg\\",\\"camera_id\\":5,\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1}"}	{"first_weight": {"weight": 1380, "weighbridge_id": 1}, "second_weight": {"weight": 0, "weighbridge_id": null}}	2026-05-11 13:27:52.664349+03	\N	4	\N	0	1	\N	\N	\N	\N	\N	2026-05-11 13:27:52.664349+03
41	65	10	2026-05-11 14:19:08.699858	T669DZD	\N	1420.00	980.00	440.00	f	{"{\\"filename\\":\\"camera4_snapshot_2026-05-11T11-18-54-896Z.jpg\\",\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1,\\"camera_id\\":4}","{\\"filename\\":\\"camera5_snapshot_2026-05-11T11-18-55-300Z.jpg\\",\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1,\\"camera_id\\":5}","{\\"filename\\":\\"camera4_snapshot_2026-05-11T11-26-33-785Z.jpg\\",\\"camera_id\\":4,\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1}","{\\"filename\\":\\"camera5_snapshot_2026-05-11T11-26-34-095Z.jpg\\",\\"camera_id\\":5,\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1}"}	{"first_weight": {"weight": 1420, "weighbridge_id": 1}, "second_weight": {"weight": 440, "weighbridge_id": 1}}	2026-05-11 14:19:08.699858+03	2026-05-11 14:26:43.519592+03	4	4	49	1	1	\N	\N	\N	T669DZD	2026-05-11 14:26:43.519592+03
42	66	10	2026-05-11 15:09:34.044073	T669DZD	\N	1440.00	\N	\N	t	{"{\\"filename\\":\\"camera4_snapshot_2026-05-11T12-09-21-524Z.jpg\\",\\"camera_id\\":4,\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1}","{\\"filename\\":\\"camera5_snapshot_2026-05-11T12-09-22-010Z.jpg\\",\\"camera_id\\":5,\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1}"}	{"first_weight": {"weight": 1440, "weighbridge_id": 1}, "second_weight": {"weight": 0, "weighbridge_id": null}}	2026-05-11 15:09:34.044073+03	\N	4	\N	0	1	\N	\N	\N	\N	\N	2026-05-11 15:09:34.044073+03
43	67	10	2026-05-11 15:20:02.028374	T459AEZ	\N	10100.00	1000.00	9100.00	f	{"{\\"filename\\":\\"camera4_snapshot_2026-05-11T12-19-32-387Z.jpg\\",\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1,\\"camera_id\\":4}","{\\"filename\\":\\"camera5_snapshot_2026-05-11T12-19-32-789Z.jpg\\",\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1,\\"camera_id\\":5}","{\\"filename\\":\\"camera4_snapshot_2026-05-11T12-20-54-856Z.jpg\\",\\"camera_id\\":4,\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1}","{\\"filename\\":\\"camera5_snapshot_2026-05-11T12-20-55-563Z.jpg\\",\\"camera_id\\":5,\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1}"}	{"first_weight": {"weight": 10100, "weighbridge_id": 1}, "second_weight": {"weight": 9100, "weighbridge_id": 1}}	2026-05-11 15:20:02.028374+03	2026-05-11 15:21:06.767719+03	4	4	10	1	1	\N	\N	\N	T459AEZ	2026-05-11 15:21:06.767719+03
44	68	10	2026-05-11 16:21:11.247768	T669DZD	\N	1420.00	1000.00	420.00	f	{"{\\"filename\\":\\"camera4_snapshot_2026-05-11T13-20-56-630Z.jpg\\",\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1,\\"camera_id\\":4}","{\\"filename\\":\\"camera5_snapshot_2026-05-11T13-20-57-016Z.jpg\\",\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1,\\"camera_id\\":5}","{\\"filename\\":\\"camera4_snapshot_2026-05-11T13-21-44-058Z.jpg\\",\\"camera_id\\":4,\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1}","{\\"filename\\":\\"camera5_snapshot_2026-05-11T13-21-44-546Z.jpg\\",\\"camera_id\\":5,\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1}"}	{"first_weight": {"weight": 1420, "weighbridge_id": 1}, "second_weight": {"weight": 420, "weighbridge_id": 1}}	2026-05-11 16:21:11.247768+03	2026-05-11 16:21:57.699572+03	4	4	50	1	1	\N	\N	\N	T669DZD	2026-05-11 16:21:57.699572+03
45	69	10	2026-05-11 16:36:32.459867	T669DZD	\N	1420.00	980.00	2400.00	f	{"{\\"filename\\":\\"camera4_snapshot_2026-05-11T13-36-23-680Z.jpg\\",\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1,\\"camera_id\\":4}","{\\"filename\\":\\"camera5_snapshot_2026-05-11T13-36-24-117Z.jpg\\",\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1,\\"camera_id\\":5}","{\\"filename\\":\\"camera4_snapshot_2026-05-11T13-50-58-210Z.jpg\\",\\"camera_id\\":4,\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1}","{\\"filename\\":\\"camera5_snapshot_2026-05-11T13-50-58-608Z.jpg\\",\\"camera_id\\":5,\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1}"}	{"first_weight": {"weight": 1420, "weighbridge_id": 1}, "second_weight": {"weight": 2400, "weighbridge_id": 1}}	2026-05-11 16:36:32.459867+03	2026-05-11 16:52:47.589101+03	4	4	49	1	1	\N	\N	\N	T669DZD	2026-05-11 16:52:47.589101+03
46	70	10	2026-05-12 10:12:47.702934	T845AFO	\N	7000.00	\N	\N	t	{"{\\"filename\\":\\"camera4_snapshot_2026-05-12T07-12-24-463Z.jpg\\",\\"camera_id\\":4,\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1}","{\\"filename\\":\\"camera5_snapshot_2026-05-12T07-12-25-110Z.jpg\\",\\"camera_id\\":5,\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1}"}	{"first_weight": {"weight": 7000, "weighbridge_id": 1}, "second_weight": {"weight": 0, "weighbridge_id": null}}	2026-05-12 10:12:47.702934+03	\N	4	\N	0	1	\N	\N	\N	\N	\N	2026-05-12 10:12:47.702934+03
47	71	10	2026-05-12 14:43:41.438083	T845AFD	\N	6960.00	4000.00	2960.00	f	{"{\\"filename\\":\\"camera4_snapshot_2026-05-12T11-43-29-452Z.jpg\\",\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1,\\"camera_id\\":4}","{\\"filename\\":\\"camera5_snapshot_2026-05-12T11-43-29-893Z.jpg\\",\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1,\\"camera_id\\":5}","{\\"filename\\":\\"camera4_snapshot_2026-05-12T11-45-00-903Z.jpg\\",\\"camera_id\\":4,\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1}","{\\"filename\\":\\"camera5_snapshot_2026-05-12T11-45-01-354Z.jpg\\",\\"camera_id\\":5,\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1}"}	{"first_weight": {"weight": 6960, "weighbridge_id": 1}, "second_weight": {"weight": 2960, "weighbridge_id": 1}}	2026-05-12 14:43:41.438083+03	2026-05-12 14:45:11.421624+03	4	4	20	1	1	\N	\N	\N	T845AFD	2026-05-12 14:45:11.421624+03
49	73	10	2026-05-13 15:23:52.123125	T845AFD	\N	6960.00	\N	\N	t	{"{\\"filename\\":\\"camera4_snapshot_2026-05-13T12-23-41-745Z.jpg\\",\\"camera_id\\":4,\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1}","{\\"filename\\":\\"camera5_snapshot_2026-05-13T12-23-42-277Z.jpg\\",\\"camera_id\\":5,\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1}"}	{"first_weight": {"weight": 6960, "weighbridge_id": 1}, "second_weight": {"weight": 0, "weighbridge_id": null}}	2026-05-13 15:23:52.123125+03	\N	4	\N	0	1	\N	\N	\N	\N	\N	2026-05-13 15:23:52.123125+03
48	72	10	2026-05-13 15:20:11.445071	T845ABC	\N	6860.00	100.00	6960.00	f	{"{\\"filename\\":\\"camera4_snapshot_2026-05-13T12-19-26-908Z.jpg\\",\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1,\\"camera_id\\":4}","{\\"filename\\":\\"camera5_snapshot_2026-05-13T12-19-27-821Z.jpg\\",\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1,\\"camera_id\\":5}","{\\"filename\\":\\"camera4_snapshot_2026-05-13T12-26-42-320Z.jpg\\",\\"camera_id\\":4,\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1}","{\\"filename\\":\\"camera5_snapshot_2026-05-13T12-26-42-762Z.jpg\\",\\"camera_id\\":5,\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1}"}	{"first_weight": {"weight": 6860, "weighbridge_id": 1}, "second_weight": {"weight": 6960, "weighbridge_id": 1}}	2026-05-13 15:20:11.445071+03	2026-05-13 15:27:02.830817+03	4	4	1	1	1	\N	\N	\N	T845ABC	2026-05-13 15:27:02.830817+03
50	74	10	2026-05-13 15:33:15.82968	T845AFD	\N	6860.00	100.00	6960.00	f	{"{\\"filename\\":\\"camera4_snapshot_2026-05-13T12-32-43-190Z.jpg\\",\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1,\\"camera_id\\":4}","{\\"filename\\":\\"camera5_snapshot_2026-05-13T12-32-43-648Z.jpg\\",\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1,\\"camera_id\\":5}","{\\"filename\\":\\"camera4_snapshot_2026-05-13T12-34-58-718Z.jpg\\",\\"camera_id\\":4,\\"camera_name\\":\\"WB1-CAM1\\",\\"snapshot_number\\":1}","{\\"filename\\":\\"camera5_snapshot_2026-05-13T12-34-59-250Z.jpg\\",\\"camera_id\\":5,\\"camera_name\\":\\"WB1-CAM2\\",\\"snapshot_number\\":1}"}	{"first_weight": {"weight": 6860, "weighbridge_id": 1}, "second_weight": {"weight": 6960, "weighbridge_id": 1}}	2026-05-13 15:33:15.82968+03	2026-05-13 15:35:41.563784+03	4	4	0.6666667	1	1	\N	\N	\N	T845AFD	2026-05-13 15:35:41.563784+03
\.


--
-- Data for Name: tos_activity_points; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_activity_points (id, name, address, created_at, isactive, camera_ids) FROM stdin;
1	WB01	192.168.0.225	2025-09-21 15:46:08.019599	t	{4,5}
\.


--
-- Data for Name: tos_activity_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_activity_type (id, name, type, created_at, isactive) FROM stdin;
1	WBIN	10	2025-09-21 14:58:18.89941	t
2	WBOUT	20	2025-09-21 14:58:18.89941	t
3	GATEOUT	40	2025-09-21 14:58:18.89941	t
\.


--
-- Data for Name: tos_anpr; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_anpr (id, truck_no, camera_id, snap_time, created_time, weight) FROM stdin;
37	T669DZD	WB02	2000-01-01 04:50:48.863	2026-05-10 17:30:22.95938	\N
38	T669DZD	WB02	2000-01-01 04:50:48.863	2026-05-10 17:30:23.298549	\N
39	T669DZD	WB02	2000-01-01 04:50:48.863	2026-05-10 17:30:23.522687	\N
40	T669DZD	WB02	2000-01-01 04:51:21.036	2026-05-10 17:30:55.528918	\N
41	T669DZD	WB02	2000-01-01 04:51:21.036	2026-05-10 17:30:55.662077	\N
42	T669DZD	WB02	2000-01-01 04:51:21.036	2026-05-10 17:30:55.896369	\N
43	T669DD	WB02	2000-01-01 04:52:04.493	2026-05-10 17:31:38.928276	\N
44	T669DD	WB02	2000-01-01 04:52:04.493	2026-05-10 17:31:39.062599	\N
45	T669DD	WB02	2000-01-01 04:52:04.493	2026-05-10 17:31:39.311297	\N
46	T669DZD	WB02	2000-01-01 04:54:18.027	2026-05-10 17:33:52.472281	\N
47	T669DZD	WB02	2000-01-01 04:54:18.027	2026-05-10 17:33:52.60905	\N
48	T669DZD	WB02	2000-01-01 04:54:18.027	2026-05-10 17:33:52.852673	\N
49	T669DZD	WB01	2000-01-01 04:56:03.069	2026-05-10 17:35:37.549526	\N
50	T669DZD	WB01	2000-01-01 04:56:03.069	2026-05-10 17:35:37.685558	\N
51	T669DZD	WB01	2000-01-01 04:56:03.069	2026-05-10 17:35:37.908044	\N
52	T669DZD	WB01	2000-01-01 04:57:18.939	2026-05-10 17:36:53.336703	\N
53	T669DZD	WB01	2000-01-01 04:57:18.939	2026-05-10 17:36:53.473165	\N
54	T669DZD	WB01	2000-01-01 04:57:18.939	2026-05-10 17:36:53.6956	\N
55	T669DZD	WB01	2000-01-01 04:58:42.052	2026-05-10 17:38:16.205751	\N
56	T669DZD	WB01	2000-01-01 04:58:42.052	2026-05-10 17:38:16.417099	\N
57	T669DZD	WB01	2000-01-01 04:58:42.052	2026-05-10 17:38:16.634521	\N
58	T669DZD	WB01	2000-01-01 04:58:54.577	2026-05-10 17:38:28.795543	\N
59	T669DZD	WB01	2000-01-01 04:58:54.577	2026-05-10 17:38:28.992777	\N
60	T669DZD	WB01	2000-01-01 04:58:54.577	2026-05-10 17:38:29.217854	\N
61	T669DZD	WB01	2000-01-01 04:59:11.824	2026-05-10 17:38:45.998742	\N
62	T669DZD	WB01	2000-01-01 04:59:11.824	2026-05-10 17:38:46.216097	\N
63	T669DZD	WB01	2000-01-01 04:59:11.824	2026-05-10 17:38:46.447274	\N
64	T669DD	WB01	2026-05-10 17:44:22.107	2026-05-10 17:44:23.460856	\N
65	T669DD	WB01	2026-05-10 17:44:22.107	2026-05-10 17:44:23.736115	\N
66	T669DD	WB01	2026-05-10 17:44:22.107	2026-05-10 17:44:23.939698	\N
67	T669DD	WB01	2026-05-10 17:44:48.878	2026-05-10 17:44:50.247076	\N
68	T669DD	WB01	2026-05-10 17:44:48.878	2026-05-10 17:44:50.512278	\N
69	T669DD	WB01	2026-05-10 17:44:48.878	2026-05-10 17:44:50.752591	\N
70	T667DD	WB01	2026-05-10 17:45:04.884	2026-05-10 17:45:06.214835	\N
71	T667DD	WB01	2026-05-10 17:45:04.884	2026-05-10 17:45:06.435418	\N
72	T667DD	WB01	2026-05-10 17:45:04.884	2026-05-10 17:45:06.661284	\N
73	T667DD	WB01	2026-05-10 17:45:16.409	2026-05-10 17:45:17.941495	\N
74	T667DD	WB01	2026-05-10 17:45:16.409	2026-05-10 17:45:18.086698	\N
75	T667DD	WB01	2026-05-10 17:45:16.409	2026-05-10 17:45:18.327122	\N
76	T667DD	WB01	2026-05-10 17:45:26.053	2026-05-10 17:45:27.697153	\N
77	T667DD	WB01	2026-05-10 17:45:26.053	2026-05-10 17:45:27.855382	\N
78	T667DD	WB01	2026-05-10 17:45:26.053	2026-05-10 17:45:28.065811	\N
79	T667DD	WB01	2026-05-10 17:45:39.418	2026-05-10 17:45:41.101038	\N
80	T667DD	WB01	2026-05-10 17:45:39.418	2026-05-10 17:45:41.237204	\N
81	T667DD	WB01	2026-05-10 17:45:39.418	2026-05-10 17:45:41.477811	\N
82	T667DD	WB01	2026-05-10 17:45:45.9	2026-05-10 17:45:47.15831	\N
83	T667DD	WB01	2026-05-10 17:45:45.9	2026-05-10 17:45:47.626592	\N
84	T667DD	WB01	2026-05-10 17:45:45.9	2026-05-10 17:45:47.865264	\N
85	T689DD	WB01	2026-05-10 17:46:26.917	2026-05-10 17:46:28.421838	\N
86	T68DD	WB01	2026-05-10 17:47:20.184	2026-05-10 17:47:21.872384	\N
87	69D7	WB01	2026-05-10 17:48:39.175	2026-05-10 17:48:40.824164	\N
88	69D7	WB01	2026-05-10 17:48:45.861	2026-05-10 17:48:47.491001	\N
89	T6DD	WB01	2026-05-10 17:50:31.356	2026-05-10 17:50:32.578934	\N
90	T6DD	WB01	2026-05-10 17:52:40.038	2026-05-10 17:52:41.175448	\N
91	AGL19	WB01	2026-05-10 17:56:37.207	2026-05-10 17:56:38.616695	\N
92	AGL19	WB01	2026-05-10 17:56:44.971	2026-05-10 17:56:46.12862	\N
93	T669DZD	WB02	2026-05-10 18:25:32.879	2026-05-10 18:25:33.509493	\N
94	AGL19	WB01	2026-05-10 18:25:32.822	2026-05-10 18:25:34.006201	\N
95	AGL19	WB02	2026-05-10 18:29:53.504	2026-05-10 18:29:54.119555	\N
96	T669DZD	WB01	2026-05-10 18:29:53.326	2026-05-10 18:29:54.446402	\N
97	AGL19	WB02	2026-05-10 18:31:13.616	2026-05-10 18:31:14.249443	\N
98	T669DZD	WB01	2026-05-10 18:31:13.438	2026-05-10 18:31:14.792196	\N
99	AGL19	WB02	2026-05-10 18:47:44.732	2026-05-10 18:47:45.235088	\N
100	T669DZD	WB01	2026-05-10 18:47:44.514	2026-05-10 18:47:45.551488	\N
101	AML19	WB02	2026-05-10 18:51:12.095	2026-05-10 18:51:12.576036	\N
102	T669DZD	WB01	2026-05-10 18:51:11.837	2026-05-10 18:51:12.872647	\N
103	AGL19	WB02	2026-05-10 19:10:30.091	2026-05-10 19:10:30.680905	\N
104	T669DZD	WB01	2026-05-10 19:10:29.792	2026-05-10 19:10:30.85155	\N
105	AGL19	WB02	2026-05-10 19:13:56.254	2026-05-10 19:13:56.808659	\N
106	T669DZD	WB01	2026-05-10 19:13:55.954	2026-05-10 19:13:57.058302	\N
107	AGL19	WB02	2026-05-10 19:20:20.087	2026-05-10 19:20:20.706117	\N
108	T669DZD	WB01	2026-05-10 19:20:19.788	2026-05-10 19:20:20.848622	\N
109	AGL19	WB02	2026-05-10 20:12:08.665	2026-05-10 20:12:09.344302	\N
110	T669DZD	WB01	2026-05-10 20:12:08.4	2026-05-10 20:12:09.616897	\N
111	AGL19	WB02	2026-05-10 20:12:23.469	2026-05-10 20:12:24.133142	\N
112	T669DZD	WB01	2026-05-10 20:12:23.166	2026-05-10 20:12:24.407287	\N
113	AGL19	WB02	2026-05-10 20:23:29.656	2026-05-10 20:23:30.273423	\N
114	T669DZD	WB01	2026-05-10 20:23:29.352	2026-05-10 20:23:30.566376	\N
115	T669DZD	WB01	2026-05-10 20:40:29.24	2026-05-10 20:40:30.428022	\N
116	AGL19	WB02	2026-05-11 09:26:06.826	2026-05-11 09:26:08.988609	\N
117	T669DZD	WB01	2026-05-11 09:26:06.536	2026-05-11 09:26:09.031654	\N
118	AGL19	WB02	2026-05-11 09:34:18.89	2026-05-11 09:34:20.955924	\N
119	T669DZD	WB01	2026-05-11 09:34:18.472	2026-05-11 09:34:21.075995	\N
120	AGL19	WB02	2026-05-11 09:34:56.446	2026-05-11 09:34:58.402498	\N
121	T669DZD	WB01	2026-05-11 09:34:56.167	2026-05-11 09:34:59.247083	\N
122	AGL19	WB02	2026-05-11 09:35:11.205	2026-05-11 09:35:13.220801	\N
123	T669DZD	WB01	2026-05-11 09:35:10.813	2026-05-11 09:35:13.639064	\N
124	AGL19	WB02	2026-05-11 09:36:23.204	2026-05-11 09:36:25.185613	\N
125	T669DZD	WB01	2026-05-11 09:36:22.961	2026-05-11 09:36:25.569223	\N
126	AGL19	WB02	2026-05-11 09:40:23.86	2026-05-11 09:40:25.83702	\N
127	T669DZD	WB01	2026-05-11 09:40:23.538	2026-05-11 09:40:26.541606	\N
128	AGL19	WB02	2026-05-11 09:42:20.106	2026-05-11 09:42:22.101392	\N
129	T669DZD	WB01	2026-05-11 09:42:19.824	2026-05-11 09:42:22.664835	\N
130	T215DZJ	WB01	2026-05-11 10:35:29.671	2026-05-11 10:35:32.319087	\N
131	T215DZJ	WB01	2026-05-11 11:03:22.821	2026-05-11 11:03:25.547564	\N
132	AGL19	WB02	2026-05-11 12:26:11.862	2026-05-11 12:26:14.115091	\N
133	T669DZD	WB01	2026-05-11 12:26:11.622	2026-05-11 12:26:14.462955	\N
134	AGL19	WB02	2026-05-11 12:31:21.066	2026-05-11 12:31:23.480629	\N
135	T669DZD	WB01	2026-05-11 12:31:20.908	2026-05-11 12:31:23.737098	\N
136	AGL19	WB02	2026-05-11 12:43:12.671	2026-05-11 12:43:15.284998	\N
137	T669DZD	WB01	2026-05-11 12:43:12.443	2026-05-11 12:43:15.349633	\N
138	AGL19	WB02	2026-05-11 12:45:58.337	2026-05-11 12:46:00.936106	\N
139	T669DZD	WB01	2026-05-11 12:45:57.989	2026-05-11 12:46:00.948483	\N
140	AGL19	WB02	2026-05-11 12:48:37.16	2026-05-11 12:48:39.386815	\N
141	T669DZD	WB01	2026-05-11 12:48:36.893	2026-05-11 12:48:39.815601	\N
142	AGL19	WB02	2026-05-11 12:58:35.48	2026-05-11 12:58:37.711348	\N
143	T669DZD	WB01	2026-05-11 12:58:35.212	2026-05-11 12:58:38.379221	\N
144	AGL19	WB02	2026-05-11 12:58:56.408	2026-05-11 12:58:58.715802	\N
145	T669DZD	WB01	2026-05-11 12:58:56.14	2026-05-11 12:58:59.029258	\N
146	AGL19	WB02	2026-05-11 13:27:38.061	2026-05-11 13:27:40.441477	\N
147	T669DZD	WB01	2026-05-11 13:27:37.725	2026-05-11 13:27:40.849286	\N
148	T669DZD	WB01	2026-05-11 13:34:24.487	2026-05-11 13:34:27.541041	\N
149	T669DZD	WB02	2026-05-11 14:15:36.741	2026-05-11 14:15:39.229286	\N
150	T669DZD	WB01	2026-05-11 14:15:36.451	2026-05-11 14:15:39.849607	\N
151	T669DZD	WB02	2026-05-11 14:17:22.623	2026-05-11 14:17:25.189465	\N
152	T669DZD	WB01	2026-05-11 14:17:22.253	2026-05-11 14:17:25.824537	\N
153	T669DZD	WB02	2026-05-11 14:17:54.156	2026-05-11 14:17:56.665439	\N
154	T669DZD	WB01	2026-05-11 14:17:53.906	2026-05-11 14:17:57.058515	\N
155	T669DZD	WB02	2026-05-11 14:18:52.579	2026-05-11 14:18:55.114175	\N
156	T669DZD	WB01	2026-05-11 14:18:52.289	2026-05-11 14:18:55.46628	\N
157	T669DZD	WB02	2026-05-11 14:26:31.363	2026-05-11 14:26:33.852311	\N
158	T669DZD	WB01	2026-05-11 14:26:31.113	2026-05-11 14:26:34.282637	\N
159	T669DZD	WB02	2026-05-11 15:09:19.088	2026-05-11 15:09:21.962675	\N
160	T669DZD	WB01	2026-05-11 15:09:18.795	2026-05-11 15:09:22.092808	\N
161	T669DZD	WB02	2026-05-11 15:17:31.405	2026-05-11 15:17:34.31317	\N
162	T669DZD	WB01	2026-05-11 15:17:31.152	2026-05-11 15:17:34.537392	\N
163	T669DZD	WB01	2026-05-11 15:17:36.914	2026-05-11 15:17:40.233711	\N
164	T459EZ	WB02	2026-05-11 15:19:29.852	2026-05-11 15:19:32.523552	\N
165	T459AEZ	WB01	2026-05-11 15:19:29.639	2026-05-11 15:19:33.350917	\N
166	MUNGUYUP0	WB02	2026-05-11 15:20:52.045	2026-05-11 15:20:54.868326	\N
167	T459AEZ	WB01	2026-05-11 15:20:52.072	2026-05-11 15:20:55.799096	\N
168	T459AEZ	WB01	2026-05-11 15:21:30.596	2026-05-11 15:21:34.269365	\N
169	T669DZD	WB02	2026-05-11 15:31:28.299	2026-05-11 15:31:31.080789	\N
170	T669DZD	WB01	2026-05-11 15:31:28.066	2026-05-11 15:31:31.544017	\N
171	T669DZD	WB01	2026-05-11 15:49:22.169	2026-05-11 15:49:24.923545	\N
172	T669DZD	WB01	2026-05-11 15:49:21.975	2026-05-11 15:49:25.472455	\N
173	AGL19	WB01	2026-05-11 15:53:16.742	2026-05-11 15:53:19.641813	\N
174	T669DZD	WB01	2026-05-11 15:53:16.429	2026-05-11 15:53:19.884891	\N
175	AGL19	WB01	2026-05-11 16:20:54.061	2026-05-11 16:20:56.875162	\N
176	T669DZD	WB01	2026-05-11 16:20:53.622	2026-05-11 16:20:57.140106	\N
177	AGL19	WB01	2026-05-11 16:21:19.711	2026-05-11 16:21:22.826412	\N
178	T669DZD	WB01	2026-05-11 16:21:19.312	2026-05-11 16:21:22.895678	\N
179	AGL19	WB01	2026-05-11 16:21:41.48	2026-05-11 16:21:44.275084	\N
180	T669DZD	WB01	2026-05-11 16:21:41.081	2026-05-11 16:21:44.703855	\N
181	AGL19	WB01	2026-05-11 16:36:20.992	2026-05-11 16:36:23.831324	\N
182	T669DZD	WB01	2026-05-11 16:36:20.673	2026-05-11 16:36:24.214047	\N
183	T669DZU	WB01	2026-05-11 16:41:01.945	2026-05-11 16:41:05.781911	\N
184	T669DZD	WB01	2026-05-11 16:46:23.514	2026-05-11 16:46:27.040774	\N
185	T669DZ	WB01	2026-05-11 16:50:55.262	2026-05-11 16:50:59.197094	\N
186	T669DZD	WB01	2026-05-11 17:11:29.035	2026-05-11 17:11:31.872906	\N
187	T459AEZ	WB01	2026-05-11 17:14:26.426	2026-05-11 17:14:29.161169	\N
188	T669DZD	WB01	2026-05-11 19:56:36.363	2026-05-11 19:56:40.212494	\N
189	AGL19	WB01	2026-05-12 09:37:55.553	2026-05-12 09:38:00.250245	\N
190	AGL19	WB01	2026-05-12 09:38:59.059	2026-05-12 09:39:03.278025	\N
191	AGL19	WB01	2026-05-12 10:12:20.277	2026-05-12 10:12:24.592966	\N
192	T845AFO	WB01	2026-05-12 10:12:19.84	2026-05-12 10:12:25.364699	\N
193	AGL19	WB01	2026-05-12 10:59:40.712	2026-05-12 10:59:45.105874	\N
194	AGL19	WB01	2026-05-12 10:59:51.196	2026-05-12 10:59:55.606672	\N
195	AGL19	WB01	2026-05-12 11:00:00.96	2026-05-12 11:00:05.42854	\N
196	AGL19	WB01	2026-05-12 11:01:51.165	2026-05-12 11:01:55.950062	\N
197	AGL19	WB01	2026-05-12 11:44:43.356	2026-05-12 11:44:47.962345	\N
198	AGL19	WB01	2026-05-12 11:45:21.372	2026-05-12 11:45:25.87443	\N
199	AGL19	WB01	2026-05-12 11:45:28.934	2026-05-12 11:45:33.457291	\N
200	AGL19	WB01	2026-05-12 11:45:36.538	2026-05-12 11:45:41.426607	\N
201	AGL19	WB01	2026-05-12 11:45:44.861	2026-05-12 11:45:49.713409	\N
202	AGL19	WB01	2026-05-12 11:45:55.545	2026-05-12 11:46:00.289492	\N
203	AGL19	WB01	2026-05-12 11:46:07.63	2026-05-12 11:46:12.49019	\N
204	AGL19	WB01	2026-05-12 11:46:18.194	2026-05-12 11:46:23.135347	\N
205	AGL19	WB01	2026-05-12 13:04:48.145	2026-05-12 13:04:52.843003	\N
206	AGL19	WB01	2026-05-12 13:07:44.855	2026-05-12 13:07:49.551366	\N
207	AGL19	WB01	2026-05-12 13:08:42.078	2026-05-12 13:08:46.885058	\N
208	AGL19	WB01	2026-05-12 13:08:56.164	2026-05-12 13:09:00.906586	\N
209	AGL19	WB01	2026-05-12 13:11:49.033	2026-05-12 13:11:54.140189	\N
210	T845AFD	WB01	2026-05-12 14:43:24.131	2026-05-12 14:43:29.95104	\N
211	T845AFD	WB01	2026-05-12 14:44:18.593	2026-05-12 14:44:24.455944	\N
212	T845AFD	WB01	2026-05-12 14:44:55.608	2026-05-12 14:45:01.444254	\N
213	T643BTG	WB01	2026-05-13 10:16:00.017	2026-05-13 15:02:20.820105	\N
214	AGL19	WB01	2026-05-13 09:32:14.006	2026-05-13 15:02:20.844526	\N
215	T918CKL	WB01	2026-05-13 10:21:59.481	2026-05-13 15:02:21.096242	\N
216	AGL19	WB01	2026-05-13 09:45:39.858	2026-05-13 15:02:21.147491	\N
217	AGL19	WB01	2026-05-13 09:45:51.063	2026-05-13 15:02:21.379538	\N
218	AGL19	WB01	2026-05-13 09:45:58.626	2026-05-13 15:02:21.610581	\N
219	AGL19	WB01	2026-05-13 10:00:30.895	2026-05-13 15:02:21.838364	\N
220	T643BTG	WB01	2026-05-13 11:32:46.074	2026-05-13 15:02:22.043743	\N
221	T918CKL	WB01	2026-05-13 11:36:44.816	2026-05-13 15:02:22.257764	\N
222	T918CKL	WB01	2026-05-13 11:48:49.188	2026-05-13 15:02:22.480133	\N
223	T140AHQ	WB01	2026-05-13 12:01:55.503	2026-05-13 15:02:22.691565	\N
224	T845AFD	WB01	2026-05-13 15:12:55.488	2026-05-13 15:13:04.061617	\N
225	T845AFD	WB01	2026-05-13 15:19:18.808	2026-05-13 15:19:27.870129	\N
226	T845AFD	WB01	2026-05-13 15:23:33.627	2026-05-13 15:23:42.701494	\N
227	T845AFD	WB01	2026-05-13 15:26:34.179	2026-05-13 15:26:42.829207	\N
228	T845AFD	WB01	2026-05-13 15:32:35.083	2026-05-13 15:32:43.967116	\N
229	AGL19	WB01	2026-05-13 15:33:52.156	2026-05-13 15:33:59.818013	\N
230	T845AFD	WB01	2026-05-13 15:33:51.674	2026-05-13 15:34:00.489069	\N
231	T845AFD	WB01	2026-05-13 15:34:50.618	2026-05-13 15:34:59.366771	\N
232	AGL19	WB01	2026-05-13 15:35:12.588	2026-05-13 15:35:19.879197	\N
233	AGL19	WB01	2026-05-13 15:35:20.951	2026-05-13 15:35:28.244305	\N
\.


--
-- Data for Name: tos_anpr_table; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_anpr_table (id, truck_no, camera_id, snap_time, created_time, old_truck_no, detected_truck_no, mode, is_unlicensed, camera_ip, weight) FROM stdin;
156	T669DZD	1	2000-01-01 04:56:03.069	2026-05-10 17:35:37.564557	\N	\N	snapshot	f	5	\N
157	T669DZD	1	2000-01-01 04:56:03.069	2026-05-10 17:35:37.692094	\N	\N	snapshot	f	5	\N
158	T669DZD	1	2000-01-01 04:56:03.069	2026-05-10 17:35:37.915358	\N	\N	snapshot	f	5	\N
159	T669DZD	1	2000-01-01 04:57:18.939	2026-05-10 17:36:53.353269	\N	\N	snapshot	f	5	\N
160	T669DZD	1	2000-01-01 04:57:18.939	2026-05-10 17:36:53.479884	\N	\N	snapshot	f	5	\N
161	T669DZD	1	2000-01-01 04:57:18.939	2026-05-10 17:36:53.701984	\N	\N	snapshot	f	5	\N
162	T669DZD	1	2000-01-01 04:58:42.052	2026-05-10 17:38:16.224009	\N	\N	snapshot	f	5	\N
163	T669DZD	1	2000-01-01 04:58:42.052	2026-05-10 17:38:16.421718	\N	\N	snapshot	f	5	\N
164	T669DZD	1	2000-01-01 04:58:42.052	2026-05-10 17:38:16.638277	\N	\N	snapshot	f	5	\N
165	T669DZD	1	2000-01-01 04:58:54.577	2026-05-10 17:38:28.808964	\N	\N	snapshot	f	5	\N
166	T669DZD	1	2000-01-01 04:58:54.577	2026-05-10 17:38:28.998913	\N	\N	snapshot	f	5	\N
167	T669DZD	1	2000-01-01 04:58:54.577	2026-05-10 17:38:29.224512	\N	\N	snapshot	f	5	\N
168	T669DZD	1	2000-01-01 04:59:11.824	2026-05-10 17:38:46.01707	\N	\N	snapshot	f	5	\N
169	T669DZD	1	2000-01-01 04:59:11.824	2026-05-10 17:38:46.219913	\N	\N	snapshot	f	5	\N
170	T669DZD	1	2000-01-01 04:59:11.824	2026-05-10 17:38:46.454034	\N	\N	snapshot	f	5	\N
171	T669DD	1	2026-05-10 17:44:22.107	2026-05-10 17:44:23.473356	\N	\N	snapshot	f	5	\N
172	T669DD	1	2026-05-10 17:44:22.107	2026-05-10 17:44:23.740018	\N	\N	snapshot	f	5	\N
173	T669DD	1	2026-05-10 17:44:22.107	2026-05-10 17:44:23.942515	\N	\N	snapshot	f	5	\N
174	T669DD	1	2026-05-10 17:44:48.878	2026-05-10 17:44:50.255042	\N	\N	snapshot	f	5	\N
175	T669DD	1	2026-05-10 17:44:48.878	2026-05-10 17:44:50.517325	\N	\N	snapshot	f	5	\N
176	T669DD	1	2026-05-10 17:44:48.878	2026-05-10 17:44:50.755929	\N	\N	snapshot	f	5	\N
177	T667DD	1	2026-05-10 17:45:04.884	2026-05-10 17:45:06.227745	\N	\N	snapshot	f	5	\N
178	T667DD	1	2026-05-10 17:45:04.884	2026-05-10 17:45:06.44098	\N	\N	snapshot	f	5	\N
179	T667DD	1	2026-05-10 17:45:04.884	2026-05-10 17:45:06.66508	\N	\N	snapshot	f	5	\N
180	T667DD	1	2026-05-10 17:45:16.409	2026-05-10 17:45:17.953623	\N	\N	snapshot	f	5	\N
181	T667DD	1	2026-05-10 17:45:16.409	2026-05-10 17:45:18.09337	\N	\N	snapshot	f	5	\N
182	T667DD	1	2026-05-10 17:45:16.409	2026-05-10 17:45:18.331185	\N	\N	snapshot	f	5	\N
183	T667DD	1	2026-05-10 17:45:26.053	2026-05-10 17:45:27.701389	\N	\N	snapshot	f	5	\N
184	T667DD	1	2026-05-10 17:45:26.053	2026-05-10 17:45:27.858466	\N	\N	snapshot	f	5	\N
185	T667DD	1	2026-05-10 17:45:26.053	2026-05-10 17:45:28.069102	\N	\N	snapshot	f	5	\N
186	T667DD	1	2026-05-10 17:45:39.418	2026-05-10 17:45:41.111613	\N	\N	snapshot	f	5	\N
187	T667DD	1	2026-05-10 17:45:39.418	2026-05-10 17:45:41.24002	\N	\N	snapshot	f	5	\N
188	T667DD	1	2026-05-10 17:45:39.418	2026-05-10 17:45:41.482702	\N	\N	snapshot	f	5	\N
189	T667DD	1	2026-05-10 17:45:45.9	2026-05-10 17:45:47.163402	\N	\N	snapshot	f	5	\N
190	T667DD	1	2026-05-10 17:45:45.9	2026-05-10 17:45:47.63176	\N	\N	snapshot	f	5	\N
191	T667DD	1	2026-05-10 17:45:45.9	2026-05-10 17:45:47.871467	\N	\N	snapshot	f	5	\N
192	T689DD	1	2026-05-10 17:46:26.917	2026-05-10 17:46:28.435862	\N	\N	snapshot	f	5	\N
193	T68DD	1	2026-05-10 17:47:20.184	2026-05-10 17:47:21.880807	\N	\N	snapshot	f	5	\N
194	69D7	1	2026-05-10 17:48:39.175	2026-05-10 17:48:40.832056	\N	\N	snapshot	f	5	\N
195	69D7	1	2026-05-10 17:48:45.861	2026-05-10 17:48:47.494602	\N	\N	snapshot	f	5	\N
196	T6DD	1	2026-05-10 17:50:31.356	2026-05-10 17:50:32.587406	\N	\N	snapshot	f	5	\N
197	T6DD	1	2026-05-10 17:52:40.038	2026-05-10 17:52:41.19505	\N	\N	snapshot	f	5	\N
198	AGL19	1	2026-05-10 17:56:37.207	2026-05-10 17:56:38.653041	\N	\N	snapshot	f	5	\N
199	AGL19	1	2026-05-10 17:56:44.971	2026-05-10 17:56:46.132024	\N	\N	snapshot	f	5	\N
200	AGL19	1	2026-05-10 18:25:32.822	2026-05-10 18:25:34.016609	\N	\N	snapshot	f	5	\N
201	T669DZD	1	2026-05-10 18:29:53.326	2026-05-10 18:29:54.465898	\N	\N	snapshot	f	5	\N
202	T669DZD	1	2026-05-10 18:31:13.438	2026-05-10 18:31:14.809475	\N	\N	snapshot	f	5	\N
203	T669DZD	1	2026-05-10 18:47:44.514	2026-05-10 18:47:45.574082	\N	\N	snapshot	f	5	\N
204	T669DZD	1	2026-05-10 18:51:11.837	2026-05-10 18:51:12.891582	\N	\N	snapshot	f	5	\N
205	T669DZD	1	2026-05-10 19:10:29.792	2026-05-10 19:10:30.873757	\N	\N	snapshot	f	5	\N
206	T669DZD	1	2026-05-10 19:13:55.954	2026-05-10 19:13:57.078232	\N	\N	snapshot	f	5	\N
207	T669DZD	1	2026-05-10 19:20:19.788	2026-05-10 19:20:20.873072	\N	\N	snapshot	f	5	\N
208	T669DZD	1	2026-05-10 20:12:08.4	2026-05-10 20:12:09.637506	\N	\N	snapshot	f	5	\N
209	T669DZD	1	2026-05-10 20:12:23.166	2026-05-10 20:12:24.428328	\N	\N	snapshot	f	5	\N
210	T669DZD	1	2026-05-10 20:23:29.352	2026-05-10 20:23:30.58676	\N	\N	snapshot	f	5	\N
211	T669DZD	1	2026-05-10 20:40:29.24	2026-05-10 20:40:30.445993	\N	\N	snapshot	f	5	\N
212	T669DZD	1	2026-05-11 09:26:06.536	2026-05-11 09:26:09.049678	\N	\N	snapshot	f	5	\N
213	T669DZD	1	2026-05-11 09:34:18.472	2026-05-11 09:34:21.091298	\N	\N	snapshot	f	5	\N
214	T669DZD	1	2026-05-11 09:34:56.167	2026-05-11 09:34:59.266493	\N	\N	snapshot	f	5	\N
215	T669DZD	1	2026-05-11 09:35:10.813	2026-05-11 09:35:13.658539	\N	\N	snapshot	f	5	\N
216	T669DZD	1	2026-05-11 09:36:22.961	2026-05-11 09:36:25.587078	\N	\N	snapshot	f	5	\N
217	T669DZD	1	2026-05-11 09:40:23.538	2026-05-11 09:40:26.563467	\N	\N	snapshot	f	5	\N
218	T669DZD	1	2026-05-11 09:42:19.824	2026-05-11 09:42:22.685863	\N	\N	snapshot	f	5	\N
219	T215DZJ	1	2026-05-11 10:35:29.671	2026-05-11 10:35:32.354975	\N	\N	snapshot	f	5	\N
220	T215DZJ	1	2026-05-11 11:03:22.821	2026-05-11 11:03:25.568021	\N	\N	snapshot	f	5	\N
221	T669DZD	1	2026-05-11 12:26:11.622	2026-05-11 12:26:14.483453	\N	\N	snapshot	f	5	\N
222	T669DZD	1	2026-05-11 12:31:20.908	2026-05-11 12:31:23.758122	\N	\N	snapshot	f	5	\N
223	T669DZD	1	2026-05-11 12:43:12.443	2026-05-11 12:43:15.371201	\N	\N	snapshot	f	5	\N
224	T669DZD	1	2026-05-11 12:45:57.989	2026-05-11 12:46:00.950891	\N	\N	snapshot	f	5	\N
225	T669DZD	1	2026-05-11 12:48:36.893	2026-05-11 12:48:39.834631	\N	\N	snapshot	f	5	\N
226	T669DZD	1	2026-05-11 12:58:35.212	2026-05-11 12:58:38.402426	\N	\N	snapshot	f	5	\N
227	T669DZD	1	2026-05-11 12:58:56.14	2026-05-11 12:58:59.046628	\N	\N	snapshot	f	5	\N
228	T669DZD	1	2026-05-11 13:27:37.725	2026-05-11 13:27:40.869138	\N	\N	snapshot	f	5	\N
229	T669DZD	1	2026-05-11 13:34:24.487	2026-05-11 13:34:27.562662	\N	\N	snapshot	f	5	\N
230	T669DZD	1	2026-05-11 14:15:36.451	2026-05-11 14:15:39.871523	\N	\N	snapshot	f	5	\N
231	T669DZD	1	2026-05-11 14:17:22.253	2026-05-11 14:17:25.844793	\N	\N	snapshot	f	5	\N
232	T669DZD	1	2026-05-11 14:17:53.906	2026-05-11 14:17:57.081109	\N	\N	snapshot	f	5	\N
233	T669DZD	1	2026-05-11 14:18:52.289	2026-05-11 14:18:55.485929	\N	\N	snapshot	f	5	\N
234	T669DZD	1	2026-05-11 14:26:31.113	2026-05-11 14:26:34.303694	\N	\N	snapshot	f	5	\N
235	T669DZD	1	2026-05-11 15:09:18.795	2026-05-11 15:09:22.111146	\N	\N	snapshot	f	5	\N
236	T669DZD	1	2026-05-11 15:17:31.152	2026-05-11 15:17:34.558186	\N	\N	snapshot	f	5	\N
237	T669DZD	1	2026-05-11 15:17:36.914	2026-05-11 15:17:40.240603	\N	\N	snapshot	f	5	\N
238	T459AEZ	1	2026-05-11 15:19:29.639	2026-05-11 15:19:33.369137	\N	\N	snapshot	f	5	\N
239	T459AEZ	1	2026-05-11 15:20:52.072	2026-05-11 15:20:55.818116	\N	\N	snapshot	f	5	\N
240	T459AEZ	1	2026-05-11 15:21:30.596	2026-05-11 15:21:34.28494	\N	\N	snapshot	f	5	\N
241	T669DZD	1	2026-05-11 15:31:28.066	2026-05-11 15:31:31.550801	\N	\N	snapshot	f	5	\N
242	T669DZD	1	2026-05-11 15:49:22.169	2026-05-11 15:49:24.942902	\N	\N	snapshot	f	4	\N
243	T669DZD	1	2026-05-11 15:49:21.975	2026-05-11 15:49:25.475535	\N	\N	snapshot	f	5	\N
244	AGL19	1	2026-05-11 15:53:16.742	2026-05-11 15:53:19.664529	\N	\N	snapshot	f	4	\N
245	T669DZD	1	2026-05-11 15:53:16.429	2026-05-11 15:53:19.890778	\N	\N	snapshot	f	5	\N
246	AGL19	1	2026-05-11 16:20:54.061	2026-05-11 16:20:56.899717	\N	\N	snapshot	f	4	\N
247	T669DZD	1	2026-05-11 16:20:53.622	2026-05-11 16:20:57.146381	\N	\N	snapshot	f	5	\N
248	AGL19	1	2026-05-11 16:21:19.711	2026-05-11 16:21:22.872119	\N	\N	snapshot	f	4	\N
249	T669DZD	1	2026-05-11 16:21:19.312	2026-05-11 16:21:22.899983	\N	\N	snapshot	f	5	\N
250	AGL19	1	2026-05-11 16:21:41.48	2026-05-11 16:21:44.294044	\N	\N	snapshot	f	4	\N
251	T669DZD	1	2026-05-11 16:21:41.081	2026-05-11 16:21:44.710456	\N	\N	snapshot	f	5	\N
252	AGL19	1	2026-05-11 16:36:20.992	2026-05-11 16:36:23.879717	\N	\N	snapshot	f	4	\N
253	T669DZD	1	2026-05-11 16:36:20.673	2026-05-11 16:36:24.221164	\N	\N	snapshot	f	5	\N
254	T669DZU	1	2026-05-11 16:41:01.945	2026-05-11 16:41:05.794447	\N	\N	snapshot	f	5	\N
255	T669DZD	1	2026-05-11 16:46:23.514	2026-05-11 16:46:27.05966	\N	\N	snapshot	f	5	\N
256	T669DZ	1	2026-05-11 16:50:55.262	2026-05-11 16:50:59.248363	\N	\N	snapshot	f	5	\N
257	T669DZD	1	2026-05-11 16:51:45.902263	2026-05-11 16:51:45.902263	T669DZ	\N	snapshot	f	\N	\N
258	T669DZD	1	2026-05-11 17:11:29.035	2026-05-11 17:11:31.91021	\N	\N	snapshot	f	4	\N
259	T459AEZ	1	2026-05-11 17:14:26.426	2026-05-11 17:14:29.181928	\N	\N	snapshot	f	4	\N
260	T669DZD	1	2026-05-11 19:56:36.363	2026-05-11 19:56:40.260766	\N	\N	snapshot	f	5	\N
261	AGL19	1	2026-05-12 09:37:55.553	2026-05-12 09:38:00.299821	\N	\N	snapshot	f	4	\N
262	AGL19	1	2026-05-12 09:38:59.059	2026-05-12 09:39:03.3266	\N	\N	snapshot	f	4	\N
263	AGL19	1	2026-05-12 10:12:20.277	2026-05-12 10:12:24.641449	\N	\N	snapshot	f	4	\N
264	T845AFO	1	2026-05-12 10:12:19.84	2026-05-12 10:12:25.374438	\N	\N	snapshot	f	5	\N
265	AGL19	1	2026-05-12 10:59:40.712	2026-05-12 10:59:45.126624	\N	\N	snapshot	f	4	\N
266	AGL19	1	2026-05-12 10:59:51.196	2026-05-12 10:59:55.624296	\N	\N	snapshot	f	4	\N
267	AGL19	1	2026-05-12 11:00:00.96	2026-05-12 11:00:05.435685	\N	\N	snapshot	f	4	\N
268	AGL19	1	2026-05-12 11:01:51.165	2026-05-12 11:01:55.969182	\N	\N	snapshot	f	4	\N
269	AGL19	1	2026-05-12 11:44:43.356	2026-05-12 11:44:47.98161	\N	\N	snapshot	f	4	\N
270	AGL19	1	2026-05-12 11:45:21.372	2026-05-12 11:45:25.891061	\N	\N	snapshot	f	4	\N
271	AGL19	1	2026-05-12 11:45:28.934	2026-05-12 11:45:33.46376	\N	\N	snapshot	f	4	\N
272	AGL19	1	2026-05-12 11:45:36.538	2026-05-12 11:45:41.433523	\N	\N	snapshot	f	4	\N
273	AGL19	1	2026-05-12 11:45:44.861	2026-05-12 11:45:49.721238	\N	\N	snapshot	f	4	\N
274	AGL19	1	2026-05-12 11:45:55.545	2026-05-12 11:46:00.311167	\N	\N	snapshot	f	4	\N
275	AGL19	1	2026-05-12 11:46:07.63	2026-05-12 11:46:12.510997	\N	\N	snapshot	f	4	\N
276	AGL19	1	2026-05-12 11:46:18.194	2026-05-12 11:46:23.149642	\N	\N	snapshot	f	4	\N
277	AGL19	1	2026-05-12 13:04:48.145	2026-05-12 13:04:52.86365	\N	\N	snapshot	f	4	\N
278	AGL19	1	2026-05-12 13:07:44.855	2026-05-12 13:07:49.570373	\N	\N	snapshot	f	4	\N
279	AGL19	1	2026-05-12 13:08:42.078	2026-05-12 13:08:46.900791	\N	\N	snapshot	f	4	\N
280	AGL19	1	2026-05-12 13:08:56.164	2026-05-12 13:09:00.924811	\N	\N	snapshot	f	4	\N
281	AGL19	1	2026-05-12 13:11:49.033	2026-05-12 13:11:54.160747	\N	\N	snapshot	f	4	\N
282	T845AFD	1	2026-05-12 14:43:24.131	2026-05-12 14:43:29.971951	\N	\N	snapshot	f	5	\N
283	T845AFD	1	2026-05-12 14:44:18.593	2026-05-12 14:44:24.476193	\N	\N	snapshot	f	5	\N
284	T845AFD	1	2026-05-12 14:44:55.608	2026-05-12 14:45:01.463586	\N	\N	snapshot	f	5	\N
285	T643BTG	1	2026-05-13 10:16:00.017	2026-05-13 15:02:20.845687	\N	\N	snapshot	f	5	\N
286	AGL19	1	2026-05-13 09:32:14.006	2026-05-13 15:02:20.849537	\N	\N	snapshot	f	4	\N
287	T918CKL	1	2026-05-13 10:21:59.481	2026-05-13 15:02:21.101072	\N	\N	snapshot	f	5	\N
288	AGL19	1	2026-05-13 09:45:39.858	2026-05-13 15:02:21.152518	\N	\N	snapshot	f	4	\N
289	AGL19	1	2026-05-13 09:45:51.063	2026-05-13 15:02:21.386781	\N	\N	snapshot	f	4	\N
290	AGL19	1	2026-05-13 09:45:58.626	2026-05-13 15:02:21.615204	\N	\N	snapshot	f	4	\N
291	AGL19	1	2026-05-13 10:00:30.895	2026-05-13 15:02:21.844651	\N	\N	snapshot	f	4	\N
292	T643BTG	1	2026-05-13 11:32:46.074	2026-05-13 15:02:22.049279	\N	\N	snapshot	f	4	\N
293	T918CKL	1	2026-05-13 11:36:44.816	2026-05-13 15:02:22.264993	\N	\N	snapshot	f	4	\N
294	T918CKL	1	2026-05-13 11:48:49.188	2026-05-13 15:02:22.486482	\N	\N	snapshot	f	4	\N
295	T140AHQ	1	2026-05-13 12:01:55.503	2026-05-13 15:02:22.698213	\N	\N	snapshot	f	4	\N
296	T845AFD	1	2026-05-13 15:12:55.488	2026-05-13 15:13:04.081956	\N	\N	snapshot	f	5	\N
297	T845AFD	1	2026-05-13 15:19:18.808	2026-05-13 15:19:27.880201	\N	\N	snapshot	f	5	\N
298	T845AFD	1	2026-05-13 15:23:33.627	2026-05-13 15:23:42.710156	\N	\N	snapshot	f	5	\N
299	T845AFD	1	2026-05-13 15:26:34.179	2026-05-13 15:26:42.83833	\N	\N	snapshot	f	5	\N
300	T845ABC	1	2026-05-13 15:26:55.597822	2026-05-13 15:26:55.597822	T845AFD	\N	snapshot	f	\N	\N
301	T845AFD	1	2026-05-13 15:32:35.083	2026-05-13 15:32:43.978098	\N	\N	snapshot	f	5	\N
302	AGL19	1	2026-05-13 15:33:52.156	2026-05-13 15:33:59.853546	\N	\N	snapshot	f	4	\N
303	T845AFD	1	2026-05-13 15:33:51.674	2026-05-13 15:34:00.495306	\N	\N	snapshot	f	5	\N
304	T845AFD	1	2026-05-13 15:34:25.359475	2026-05-13 15:34:25.359475	T845AFD	\N	snapshot	f	\N	\N
305	T845AFD	1	2026-05-13 15:34:50.618	2026-05-13 15:34:59.376763	\N	\N	snapshot	f	5	\N
306	AGL19	1	2026-05-13 15:35:12.588	2026-05-13 15:35:19.885813	\N	\N	snapshot	f	4	\N
307	AGL19	1	2026-05-13 15:35:20.951	2026-05-13 15:35:28.247022	\N	\N	snapshot	f	4	\N
\.


--
-- Data for Name: tos_buying_center; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_buying_center (id, name, is_active, created_at, updated_at, cms_id, code, cms_village_id, village_name, cms_cotton_type_id, cotton_type_name) FROM stdin;
21	Nairobi	t	2026-05-11 09:06:24.856789	2026-03-23 08:42:10	1	CEN001	524	bufanka	2	Conventional
22	Mwaka Amcos	t	2026-05-11 09:06:24.864758	2026-04-28 07:52:23	2	CEN002	1	kasoli	1	Organic
23	BUGATU AMCOS	t	2026-05-11 09:06:24.867038	2026-04-28 08:00:06	3	CEN003	30	bugatu	1	Organic
24	NGOGO AMCOS	t	2026-05-11 09:06:24.869264	2026-04-28 08:03:55	4	CEN004	50	mhulula	1	Organic
25	MIZALELO AMCOS	t	2026-05-11 09:06:24.871163	2026-04-28 08:08:32	5	CEN005	71	gaswa,sagata	1	Organic
26	NYAMATEMBE MZR 4232 AMCOS	t	2026-05-11 09:06:24.87288	2026-04-28 08:11:17	6	CEN006	104	nyamatembe.	1	Organic
27	SENANI AMCOS	t	2026-05-11 09:06:24.875224	2026-04-28 08:13:34	7	CEN007	132	senani	1	Organic
28	IKIGIJO - MWABUSALU AMCOS	t	2026-05-11 09:06:24.877749	2026-04-28 08:16:51	8	CEN008	165	ikigijo	1	Organic
29	Bukore Amcos	t	2026-05-11 09:06:24.879773	2026-04-28 08:20:11	9	CEN009	219	bukore	1	Organic
30	Kabutacha Amcos	t	2026-05-11 09:06:24.881838	2026-04-28 08:26:20	10	CEN010	292	kabutacha	1	Organic
31	MWATAGA  AMCOS	t	2026-05-11 09:06:24.883674	2026-04-28 08:30:36	11	CEN011	329	mwataga	1	Organic
32	Wichamoyo Amcos	t	2026-05-11 09:06:24.885573	2026-04-28 08:33:41	12	CEN012	2	mwamlapa	1	Organic
33	Ihumilo Amcos	t	2026-05-11 09:06:24.887254	2026-04-28 08:43:20	13	CEN013	3	kilalo	1	Organic
34	Masanyiwa Amcos	t	2026-05-11 09:06:24.888542	2026-04-28 08:58:16	14	CEN014	131	masewa	1	Organic
35	MLIMANI ( GASUMA) AMCOS	t	2026-05-11 09:06:24.8901	2026-04-28 09:01:20	15	CEN015	129	gasuma	1	Organic
36	GIMAGI AMCOS	t	2026-05-11 09:06:24.891597	2026-04-28 11:42:14	16	CEN016	333	gimagi	1	Organic
37	Mwandamo Amcos	t	2026-05-11 09:06:24.893058	2026-04-28 11:49:27	17	CEN017	49	mwamabanza	1	Organic
38	IDOSHABALIMI AMCOS	t	2026-05-11 09:06:24.894448	2026-04-29 06:50:14	18	CEN018	140	mwabayanda	1	Organic
39	MWATUMBE AMCOS	t	2026-05-11 09:06:24.895982	2026-04-29 06:51:13	19	CEN019	141	mwatumbe	1	Organic
40	KADASHI AMCOS	t	2026-05-11 09:06:24.897387	2026-04-29 08:07:29	20	CEN020	177	kadashi	1	Organic
\.


--
-- Data for Name: tos_camera_information; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_camera_information (id, model, ip_address, rtsp_url, status, location_coordinates, configuration, created_at, updated_at, username, password) FROM stdin;
4	WB1-CAM1	192.168.0.226	http://192.168.0.226/	active	(0,0)	{"fps": 50, "resolution": "1920x1080"}	2026-05-10 13:30:38.897621+03	2026-05-10 13:30:38.897621+03	admin	pass123#
5	WB1-CAM2	192.168.0.227	http://192.168.0.227/	active	(0,0)	{"fps": 50, "resolution": "1920x1080"}	2026-05-10 13:30:56.452483+03	2026-05-10 13:30:56.452483+03	admin	pass123#
\.


--
-- Data for Name: tos_customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_customer (id, name, isactive, created_at, customer_type_id, bp_code) FROM stdin;
1	ANWAR BAJBER	t	2025-09-21 14:57:23.099372	1	\N
2	NAIVAS	t	2025-09-21 14:57:23.099372	2	\N
3	SUPAFLO FLOUR MILLS LTD	t	2025-09-21 14:57:23.099372	2	\N
4	PERFECT FRUITS & NUTS (EPZ) LIMITED - (NRB A/C)	t	2025-09-21 14:57:23.099372	2	LC003986
5	BULKSTREAM LTD	t	2025-09-21 14:57:23.099372	1	\N
6	SALIM WAZARAN KENYA CO. LTD	t	2025-09-21 14:57:23.099372	2	LC000662
7	FAJRI BAKERS LTD	t	2025-09-21 14:57:23.099372	2	LC001560
8	MAMA NGINA GIRLS SEC. SCHOOL	t	2025-09-21 14:57:23.099372	2	LC000402
9	MAGUNA-ANDU WHOLESALERS (K) LIMITED	t	2025-09-21 14:57:23.099372	2	LC000391
10	PHOCAN FEED LIMITED	t	2025-09-21 14:57:23.099372	2	LC000900
11	ZINGA BAKERS LTD	t	2025-09-21 14:57:23.099372	2	LC003435
12	SUMMER MILLERS LIMITED-(MACHAKOS)	t	2025-09-21 14:57:23.099372	2	LC003740
13	DPL- FESTIVE LTD	t	2025-09-21 14:57:23.099372	2	LC000199
14	PERFECT FRUITS & NUTS (EPZ) LIMITED - (MSA A/C)	t	2025-09-21 14:57:23.099372	2	LC004001
15	BUSBUL TRADING CO. LTD	t	2025-09-21 14:57:23.099372	2	LC000154
16	MANJI FOOD INDUSTRIES LIMITED	t	2025-09-21 14:57:23.099372	2	LC000932
17	STOCK TRANSFER KFM	t	2025-09-21 14:57:23.099372	1	\N
18	NAIVAS SUPER CENTRE	t	2025-09-21 14:57:23.099372	2	LC000496
19	SUPAFLO FLOUR MILLS LTD	t	2025-09-21 14:57:23.099372	2	LC000707
20	KENAFRIC BAKERIES LTD	t	2025-09-21 14:57:23.099372	2	LC000328
21	FRESHWAYS BAKERY LTD	t	2025-09-21 14:57:23.099372	2	LC002857
22	YUBASH BAKERY LTD	t	2025-09-21 14:57:23.099372	2	LC004080
23	A ONE SUPERMARKET LTD	t	2025-09-21 14:57:23.099372	2	LC000003
24	HASSAZIP ENTERPRISE LIMITED	t	2025-09-21 14:57:23.099372	2	LC001288
25	WALK IN CUSTOMER-ELDORET	t	2025-09-21 14:57:23.099372	2	LC001969
26	WOOL MATT  LIMITED	t	2025-09-21 14:57:23.099372	2	LC001992
27	NAFUU SHOP (YASSER HASSAN SWALEH)	t	2025-09-21 14:57:23.099372	2	LC002188
28	Kwa Msonjo Shop 1(UKD)	t	2025-09-21 14:57:23.099372	2	LC004103
29	AUTOPORTS FREIGHT TERMINALS LTD	t	2025-09-21 14:57:23.099372	2	LC001071
30	NAIVAS BAMBURI	t	2025-09-21 14:57:23.099372	2	LC000492
31	MINI BAKERIES MSA LTD	t	2025-09-21 14:57:23.099372	2	LC000439
32	BETA BAKERS CO.LTD	t	2025-09-21 14:57:23.099372	2	LC000132
33	KFM THIKA DEPOT	t	2025-09-21 14:57:23.099372	2	LC000811
34	ELDORET GRAINS LTD-ELDORET	t	2025-09-21 14:57:23.099372	2	LC000210
35	BAKERS CORNER CO.LTD	t	2025-09-21 14:57:23.099372	2	LC000115
36	FARMER'S CHOICE LTD	t	2025-09-21 14:57:23.099372	2	LC002353
37	MINI BAKERY	t	2025-09-21 14:57:23.099372	2	LC000440
38	KENBLEST FOODS LIMITED	t	2025-09-21 14:57:23.099372	2	LC002087
39	KENBLEST LTD	t	2025-09-21 14:57:23.099372	2	LC000329
40	BAKEMARK LIMITED	t	2025-09-21 14:57:23.099372	2	LC000113
41	MALINDI DEPOT NEW	t	2025-09-21 14:57:23.099372	2	LC000399
42	Malindi Depot	t	2025-09-21 14:57:23.099372	2	MALINDI
43	KFM MACHAKOS DEPOT	t	2025-09-21 14:57:23.099372	2	LC001099
44	KFM NAIROBI DEPOT BRANCH	t	2025-09-21 14:57:23.099372	2	BR000002
45	KFM MERU DEPOT BRANCH	t	2025-09-21 14:57:23.099372	2	BR000001
46	KFM ELDORET DEPOT BRANCH	t	2025-09-21 14:57:23.099372	2	BR000003
47	MAFUKO INDUSTRIES LTD	t	2025-09-21 14:57:23.099372	2	LC000389
48	WELLBAKE WHEAT PRODUCTS	t	2025-09-21 14:57:23.099372	2	LC000769
49	SCOOBY ENTERPRISES LTD	t	2025-09-21 14:57:23.099372	2	LC000979
50	S.M SWALEH ALI SWALEH	t	2025-09-21 14:57:23.099372	2	LC000605
51	S.M SWALEH SHARIFF	t	2025-09-21 14:57:23.099372	2	LC000852
52	S.M SWALEH M.HUSSEIN	t	2025-09-21 14:57:23.099372	2	LC000626
53	RESOURCES GENERAL TRADING (FZE) - A/C 2	t	2025-09-21 14:57:23.099372	2	FC000007
54	PEMBE  FLOUR  MILLS   LTD	t	2025-09-21 14:57:23.099372	2	LC000554
55	KFM KILIFI DEPOT	t	2025-09-21 14:57:23.099372	2	LC000814
56	MALINDI SHOP	t	2025-09-21 14:57:23.099372	2	LC000400
57	MWAKEMI STORE	t	2025-09-21 14:57:23.099372	2	LC000483
58	KFM VOI DEPOT	t	2025-09-21 14:57:23.099372	2	LC000812
59	KHETIA DRAPPERS LTD - CROSSROADS	t	2025-09-21 14:57:23.099372	2	LC001949
60	JPN TRADING LTD	t	2025-09-21 14:57:23.099372	2	LC001886
61	BIASHARA TRADING CO.	t	2025-09-21 14:57:23.099372	2	LC002222
62	SALAMA GENERAL SUPPLIES LTD	t	2025-09-21 14:57:23.099372	2	LC000952
63	ANYTIME LTD	t	2025-09-21 14:57:23.099372	2	LC000914
64	BANSI WHOLESALERS	t	2025-09-21 14:57:23.099372	2	LC002170
65	CAMU WHOLESALERS C/O CYNTHIA NJOKA	t	2025-09-21 14:57:23.099372	2	LC001096
66	MUSTAKIM INVESTMENT LIMITED	t	2025-09-21 14:57:23.099372	2	LC003958
67	DPL-FESTIVE LTD (KISUMU)	t	2025-09-21 14:57:23.099372	2	LC000200
68	SUPA FESTIVE LTD	t	2025-09-21 14:57:23.099372	2	LC002148
69	OTHAYA FEEDS	t	2025-09-21 14:57:23.099372	2	LC000548
70	ROYAL TEA &COMMODITIES	t	2025-09-21 14:57:23.099372	2	FC000004
71	ABDALLA ABUBAKAR SALIM	t	2025-09-21 14:57:23.099372	2	LC000008
72	KAKAMEGA SCHOOL	t	2025-09-21 14:57:23.099372	2	LC002332
73	LESPHINE INVESTMENTS LTD	t	2025-09-21 14:57:23.099372	2	LC000976
74	KHETIA DRAPPERS LTD - HIGHWAY BUNGOMA	t	2025-09-21 14:57:23.099372	2	LC001945
75	MIDLAND GENERAL MERCHANTS	t	2025-09-21 14:57:23.099372	2	LC001042
76	MAJENGO BAKERY LTD	t	2025-09-21 14:57:23.099372	2	LC002289
77	BUSBUL  TRADERS	t	2025-09-21 14:57:23.099372	2	LC000153
78	MAHADEV DRAPERS LTD	t	2025-09-21 14:57:23.099372	2	LC001623
79	PACK INGREDIENTS E.A LTD	t	2025-09-21 14:57:23.099372	2	LC001505
80	MAJENGO RETAIL SHOP	t	2025-09-21 14:57:23.099372	2	LC000395
81	A.S STORES	t	2025-09-21 14:57:23.099372	2	LC000005
82	GILANIS SUPERMARKET-EGL A/C	t	2025-09-21 14:57:23.099372	2	LC001985
83	A.M STORE	t	2025-09-21 14:57:23.099372	2	LC000004
84	ELDORET GRAINS LTD - MWINGI	t	2025-09-21 14:57:23.099372	2	LC000209
85	RESOURCES GENERAL TRADING (FZE)	t	2025-09-21 14:57:23.099372	2	LC001183
86	KFM MACHAKOS DEPOT(COOKING OIL)	t	2025-09-21 14:57:23.099372	2	LC002456
87	NEW MTWAPA DEPOT	t	2025-09-21 14:57:23.099372	2	LC000521
88	MASSMART KENYA LIMITED	t	2025-09-21 14:57:23.099372	2	LC000934
89	AHMED HUSSEIN MOHAMED	t	2025-09-21 14:57:23.099372	2	LC000035
90	KAILASHNATH ENTERPRISES LTD	t	2025-09-21 14:57:23.099372	2	LC001239
91	Machakos Depot	t	2025-09-21 14:57:23.099372	2	MACHAKOS
92	NAIVAS LIMITED NAIROBI	t	2025-09-21 14:57:23.099372	2	LC000494
93	NAIVAS LIKONI	t	2025-09-21 14:57:23.099372	2	LC001155
94	NAIVAS HAZINA	t	2025-09-21 14:57:23.099372	2	LC000493
95	NAIVAS UKUNDA	t	2025-09-21 14:57:23.099372	2	LC000497
96	NAIVAS UMOJA NAIROBI	t	2025-09-21 14:57:23.099372	2	LC000498
97	NAIVAS LTD (MACHAKOS)	t	2025-09-21 14:57:23.099372	2	LC000495
98	BHAYKO DISTRIBUTORS LTD	t	2025-09-21 14:57:23.099372	2	LC001959
99	KFM KILIFI DEPOT (NEW A/C)	t	2025-09-21 14:57:23.099372	2	LC001324
100	ISINYA FEEDS LTD	t	2025-09-21 14:57:23.099372	2	LC002185
101	KFM HQ	t	2025-09-21 14:57:23.099372	2	\N
102	BARGAIN SAM KENYA LTD	t	2025-09-21 14:57:23.099372	2	LC001567
103	SWALEH ABUD	t	2025-09-21 14:57:23.099372	2	LC000708
104	SWALEH KARAMA	t	2025-09-21 14:57:23.099372	2	LC000710
105	SWALEH JARWAN	t	2025-09-21 14:57:23.099372	2	LC001887
106	SAID SWALEH ABUD	t	2025-09-21 14:57:23.099372	2	LC000649
107	JPN TRADING LTD-NAIROBI	t	2025-09-21 14:57:23.099372	2	LC004150
108	DOLA FEEDS LIMITED	t	2025-09-21 14:57:23.099372	2	LC000194
109	KFM MKINDANI SILO	t	2025-09-21 14:57:23.099372	2	\N
110	VICKSTAR BAKERS LIMITED	t	2025-09-21 14:57:23.099372	2	LC001287
111	ALI MOHAMED YUSUF	t	2025-09-21 14:57:23.099372	2	LC000069
112	BAKEVILLE LIMITED	t	2025-09-21 14:57:23.099372	2	LC001563
113	KENSALT LIMITED	t	2025-09-21 14:57:23.099372	2	LC000726
114	NDANAI RAHISI ENTERPRISES LTD	t	2025-09-21 14:57:23.099372	2	LC001878
115	PAULS BAKERY & CONFECTIONARY LTD	t	2025-09-21 14:57:23.099372	2	LC001716
116	MTONDIA B SHOP (KLF)	t	2025-09-21 14:57:23.099372	2	LC002504
117	MJENGO LTD	t	2025-09-21 14:57:23.099372	2	LC000443
118	CITY LOAF LIMITED	t	2025-09-21 14:57:23.099372	2	LC000170
119	SUMMER MILLERS LIMITED	t	2025-09-21 14:57:23.099372	2	LC001111
120	SALAMA WESTERN TOAST LTD - JAMAL AHMED MOHAMED	t	2025-09-21 14:57:23.099372	2	LC003577
121	S.M JAMES KIMATHI SUPERVISOR (MERU)	t	2025-09-21 14:57:23.099372	2	LC001628
122	KILIMANJARO BISCUITS LTD	t	2025-09-21 14:57:23.099372	2	LC000874
123	ANSH ENTERPRISES	t	2025-09-21 14:57:23.099372	2	LC001452
124	SUCH ENTERPRISES LIMITED	t	2025-09-21 14:57:23.099372	2	LC001319
125	SUMMER LTD	t	2025-09-21 14:57:23.099372	2	LC000703
126	GUSII MATT	t	2025-09-21 14:57:23.099372	2	LC002175
127	Thika Depot	t	2025-09-21 14:57:23.099372	2	THIKA
128	KFM MERU DEPOT	t	2025-09-21 14:57:23.099372	2	LC001513
129	PEMBE F. M LTD	t	2025-09-21 14:57:23.099372	2	LC000555
\.


--
-- Data for Name: tos_customer_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_customer_type (id, name, created_at, isactive) FROM stdin;
1	SUPPLIER	2025-09-21 14:56:41.75616	t
2	CUSTOMER	2025-09-21 14:56:41.75616	t
3	TEST	2025-09-21 14:56:41.75616	t
\.


--
-- Data for Name: tos_delivery_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_delivery_orders (id, order_number, created_at, truck_no, trailler_no, customer_id, driver_id, measurement, isactive, activitycheck, product_type_id, packing_type_id, do_no, vessel_id, old_truck_no, wheat_type_id, detected_truck_no, order_type, transporter_id, buying_center_id, supplier_id, purchase_type_id, dispatch_type_id) FROM stdin;
64	202605110063	2026-05-11 13:27:52.652072	T669DZD	\N	\N	6	1380	t	1	\N	\N	\N	\N	\N	\N	\N	products_in	4	23	2	1	\N
65	202605110064	2026-05-11 14:19:08.692156	T669DZD	\N	\N	6	980	f	2	\N	\N	\N	\N	\N	\N	\N	products_in	10	23	2	1	\N
66	202605110065	2026-05-11 15:09:34.035354	T669DZD	\N	\N	6	1440	t	1	\N	\N	\N	\N	\N	\N	\N	products_in	10	23	2	1	\N
67	202605110066	2026-05-11 15:20:02.020373	T459AEZ	\N	\N	6	1000	f	2	\N	\N	\N	\N	\N	\N	\N	products_in	10	23	2	1	\N
68	202605110067	2026-05-11 16:21:11.23513	T669DZD	\N	\N	6	1000	f	2	\N	\N	\N	\N	\N	\N	\N	products_in	6	22	2	1	\N
69	202605110068	2026-05-11 16:36:32.45305	T669DZD	\N	23	8	980	f	2	\N	1	\N	\N	T669DZ	\N	\N	products_out	10	\N	\N	\N	\N
70	202605120069	2026-05-12 10:12:47.695918	T845AFO	\N	\N	6	7000	t	1	\N	\N	\N	\N	\N	\N	\N	products_in	9	23	2	1	\N
71	202605120070	2026-05-12 14:43:41.431455	T845AFD	\N	\N	8	4000	f	2	\N	\N	\N	\N	\N	\N	\N	products_in	10	22	2	3	4
73	202605130072	2026-05-13 15:23:52.114363	T845AFD	\N	\N	6	6960	t	1	\N	\N	\N	\N	\N	\N	\N	products_in	9	23	2	3	1
72	202605130071	2026-05-13 15:20:11.434745	T845ABC	\N	\N	6	100	f	2	\N	\N	\N	\N	T845AFD	\N	\N	products_in	10	23	2	3	\N
74	202605130073	2026-05-13 15:33:15.821327	T845AFD	\N	\N	8	100	f	2	\N	\N	\N	\N	T845AFD	\N	\N	products_in	8	33	2	3	\N
\.


--
-- Data for Name: tos_dispatch_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_dispatch_type (id, title, isactive, created_at, updated_at) FROM stdin;
1	Planting	t	2026-05-12 13:15:37.463775	2026-05-12 13:15:37.463775
2	Animal Feed	t	2026-05-12 13:15:54.819119	2026-05-12 13:15:54.819119
3	Oil production	t	2026-05-12 13:16:11.666598	2026-05-12 13:16:11.666598
4	Cotton Lint	t	2026-05-12 13:16:22.267183	2026-05-12 13:16:22.267183
\.


--
-- Data for Name: tos_drivers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_drivers (id, name, id_no, license_no, created_at, is_active, cms_id, code, phone, email, address, updated_at) FROM stdin;
6	James Obonyo	23423423	324234	2026-04-14 10:36:42.889705	t	1	DRV001	324234234	jamesobonyo@gmail.com	Nairobi Kenya	2026-04-13 12:37:44
7	Mary Baraka	435345	2354345	2026-04-14 10:36:42.896763	t	2	DRV002	2342	maryb@gmail.com	Dodoma Tz	2026-04-13 12:38:15
8	Johnstone	32532432	3242342	2026-04-14 12:00:00.600834	t	3	DRV003	Bull	johnbull@john.com	Mombasa Kenya	2026-04-14 08:08:29
\.


--
-- Data for Name: tos_finished_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_finished_orders (id, delivery_order_id, sku, product_id, packing_type_id, unit, measurement, created_at, updated_at, isactive, source, destination, transaction_type, packing_id, price_per_unit) FROM stdin;
48	64	\N	\N	\N	KG	20	2026-05-11 13:27:52.652072	2026-05-11 13:27:52.652072	t	SSS	AAA	products_in	\N	\N
49	65	\N	\N	\N	KG	20	2026-05-11 14:19:08.692156	2026-05-11 14:19:08.692156	t	ssss	aaaa	products_in	\N	\N
50	66	\N	\N	\N	KG	29	2026-05-11 15:09:34.035354	2026-05-11 15:09:34.035354	t	ssss	aaaaa	products_in	\N	\N
51	67	\N	18	\N	KG	100	2026-05-11 15:20:02.020373	2026-05-11 15:20:02.020373	t	ssss	aaaa	products_in	\N	\N
52	68	\N	18	\N	KG	20	2026-05-11 16:21:11.23513	2026-05-11 16:21:11.23513	t	sasssas	wwwww	products_in	\N	\N
53	69	\N	15	\N	KG	20	2026-05-11 16:52:47.560453	2026-05-11 16:52:47.560453	t	ssss	aaaa	products_out	\N	0
54	70	\N	18	\N	KG	100	2026-05-12 10:12:47.695918	2026-05-12 10:12:47.695918	t	Bugatu Amcos	Saw Gin A	products_in	\N	0
55	71	\N	18	\N	KG	200	2026-05-12 14:43:41.431455	2026-05-12 14:43:41.431455	t	Mwaka	Saw Gin	products_in	\N	0
56	72	\N	18	\N	KG	100	2026-05-13 15:20:11.434745	2026-05-13 15:20:11.434745	t	Bariadi	Saw Gin	products_in	\N	0
57	73	\N	18	\N	KG	100	2026-05-13 15:23:52.114363	2026-05-13 15:23:52.114363	t	Bariadi	Saw Gin	products_in	\N	0
58	74	\N	18	\N	KG	150	2026-05-13 15:33:15.821327	2026-05-13 15:33:15.821327	t	bariadi	suction area	products_in	\N	0
\.


--
-- Data for Name: tos_manual_mode; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_manual_mode (id, user_id, status, reason, expires_at, created_at, updated_at) FROM stdin;
1	4	ended	Camears knocked down, power failure	2025-06-14 17:18:09.035509+03	2025-09-21 14:59:30.943596+03	2025-09-21 14:59:30.943596+03
3	4	rejected	Rejected via UI	\N	2025-09-21 14:59:30.943596+03	2025-09-21 14:59:30.943596+03
4	4	ended	camera down	2025-07-24 12:03:53.302609+03	2025-09-21 14:59:30.943596+03	2025-09-21 14:59:30.943596+03
5	8	ended	camera damage	2025-07-24 12:03:54.767713+03	2025-09-21 14:59:30.943596+03	2025-09-21 14:59:30.943596+03
6	10	ended	camera problem	2025-07-24 12:03:55.972713+03	2025-09-21 14:59:30.943596+03	2025-09-21 14:59:30.943596+03
7	9	ended	camera	2025-07-24 12:04:01.500701+03	2025-09-21 14:59:30.943596+03	2025-09-21 14:59:30.943596+03
8	13	ended	camera under maintenance	2025-09-11 11:37:58.740789+03	2025-09-21 14:59:30.943596+03	2025-09-21 14:59:30.943596+03
2	4	approved	test	2026-04-30 00:00:00+03	2025-10-18 17:09:34.57427+03	2026-04-28 14:42:13.236768+03
\.


--
-- Data for Name: tos_packing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_packing (id, name, isactive, created_at, packing_type_id) FROM stdin;
1	50 KGS	t	2024-12-18 01:38:02.889785	1
2	24KG	t	2024-12-21 11:26:08.106726	1
3	25KG	t	2025-01-09 08:08:49.750926	1
4	12KG	t	2025-03-09 04:58:39.883183	1
\.


--
-- Data for Name: tos_packing_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_packing_type (id, name, created_at, isactive) FROM stdin;
1	BAGS	2025-09-21 14:44:06.069187	t
2	BULK	2025-09-21 14:44:06.069187	t
3	BALES	2025-09-21 14:44:06.069187	t
4	PIECES	2025-09-21 14:44:06.069187	t
5	LITRES	2025-09-21 14:44:06.069187	t
\.


--
-- Data for Name: tos_phone_no_verification_code; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_phone_no_verification_code (id, phone_no, code, is_valid, created_at) FROM stdin;
\.


--
-- Data for Name: tos_product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_product (id, name, isactive, created_at, item_code) FROM stdin;
1	Bar Soap	t	2026-05-10 15:20:10.062308	\N
2	Bibiti Seed Cotton	t	2026-05-10 15:20:10.062308	\N
3	Cotton Lint	t	2026-05-10 15:20:10.062308	\N
4	Cotton seeds	t	2026-05-10 15:20:10.062308	\N
5	Desi Chick Peas(Dengu)	t	2026-05-10 15:20:10.062308	\N
6	Farm Yard Manure	t	2026-05-10 15:20:10.062308	\N
7	Green Gram	t	2026-05-10 15:20:10.062308	\N
8	Husk-Fine	t	2026-05-10 15:20:10.062308	\N
9	Husk-Rough	t	2026-05-10 15:20:10.062308	\N
10	Lint Bales	t	2026-05-10 15:20:10.062308	\N
11	Milled Rice	t	2026-05-10 15:20:10.062308	\N
12	Others	t	2026-05-10 15:20:10.062308	\N
13	Pigeon Peas(Mbaazi)	t	2026-05-10 15:20:10.062308	\N
14	Processed Oil	t	2026-05-10 15:20:10.062308	\N
15	Rice Paddy (Mpunga)	t	2026-05-10 15:20:10.062308	\N
16	Rice Bran	t	2026-05-10 15:20:10.062308	\N
17	Seed Cakes	t	2026-05-10 15:20:10.062308	\N
18	Seed Cotton	t	2026-05-10 15:20:10.062308	\N
\.


--
-- Data for Name: tos_product_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_product_type (id, name, created_at, isactive, packing_type_id) FROM stdin;
1	MAIZE	2025-09-21 14:51:58.347293	t	1
2	WHEAT	2025-09-21 14:51:58.347293	t	2
3	COOKIN	2025-09-21 14:51:58.347293	f	3
4	DIESEL	2025-09-21 14:51:58.347293	t	2
5	WATER	2025-09-21 14:51:58.347293	t	5
6	OTHER	2025-09-21 14:51:58.347293	t	1
7	RETURN	2025-09-21 14:51:58.347293	f	2
8	SOYA	2025-09-21 14:51:58.347293	t	1
9	WHEAT SHUNTING	2025-09-21 14:51:58.347293	t	2
10	WASTE	2025-09-21 14:51:58.347293	t	2
\.


--
-- Data for Name: tos_product_weight_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_product_weight_limits (id, weight, min, max, stable, size, is_active, created_at, updated_at) FROM stdin;
69	12x2Kgs	24.000	24.295	24.000	\N	t	2025-09-21 14:47:54.386469+03	2025-09-21 14:47:54.386469+03
70	24x1Kgs	24.000	24.364	24.000	\N	t	2025-09-21 14:47:54.386469+03	2025-09-21 14:47:54.386469+03
71	24x0.5Kgs	12.000	12.240	12.000	\N	t	2025-09-21 14:47:54.386469+03	2025-09-21 14:47:54.386469+03
72	12 Pack	12.190	12.220	12.000	\N	t	2025-09-21 14:47:54.386469+03	2025-09-21 14:47:54.386469+03
73	6 Pack	12.160	12.195	12.000	\N	t	2025-09-21 14:47:54.386469+03	2025-09-21 14:47:54.386469+03
74	45	45.000	45.315	45.000	\N	t	2025-09-21 14:47:54.386469+03	2025-09-21 14:47:54.386469+03
75	Maize Bran	50.085	50.340	50.000	\N	t	2025-09-21 14:47:54.386469+03	2025-09-21 14:47:54.386469+03
76	5	5.040	5.090	5.000	\N	t	2025-09-21 14:47:54.386469+03	2025-09-21 14:47:54.386469+03
77	10kgs	10.045	10.300	10.000	\N	t	2025-09-21 14:47:54.386469+03	2025-09-21 14:47:54.386469+03
78	G Balers	24.235	24.314	24.000	\N	t	2025-09-21 14:47:54.386469+03	2025-09-21 14:47:54.386469+03
79	50kg	50.000	50.300	50.000	\N	t	2025-09-21 14:47:54.386469+03	2025-09-21 14:47:54.386469+03
80	25	25.000	25.300	25.000	\N	t	2025-09-21 14:47:54.386469+03	2025-09-21 14:47:54.386469+03
\.


--
-- Data for Name: tos_purchase_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_purchase_type (id, title, isactive, created_at, updated_at) FROM stdin;
1	Agent	t	2025-10-17 12:58:03.814167	2025-10-17 12:58:03.814167
2	Busese	t	2025-10-17 12:58:28.485176	2025-10-17 12:58:28.485176
3	Buying Center	t	2026-05-12 12:14:13.224204	2026-05-12 12:14:13.224204
4	Direct Purchase	t	2026-05-12 12:14:39.445331	2026-05-12 12:14:39.445331
\.


--
-- Data for Name: tos_suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_suppliers (id, name, phone_number, isactive, created_at, updated_at) FROM stdin;
1	Russia Maize	2557112345678	t	2025-10-17 14:56:22.933431	2025-10-17 14:56:22.933431
2	Dar Wheat Farm	2333333345	t	2025-10-17 14:56:47.112456	2025-10-17 14:56:47.112456
\.


--
-- Data for Name: tos_sync_meta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_sync_meta (key, value) FROM stdin;
drivers_last_sync	2026-04-14T08:08:29.000000Z
bc_last_sync	2026-04-29T08:07:29.000000Z
wb_last_sync	2026-05-13T15:35:41.563+03:00
\.


--
-- Data for Name: tos_transporter; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_transporter (id, title, isactive, created_at, updated_at) FROM stdin;
3	A.A KONDO FAMILY CO, LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
4	AAA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
5	abc	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
6	ABDALLA MOHAMMED JUMA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
7	ABDULAZIZI ALMAS RAZGAALA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
8	ABEL NGWAKWA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
9	ACER PETROLEUM (T) LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
10	AFRIC SUPPLIERS LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
11	AFRISIAN GINNING LIMITED	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
12	AGL	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
13	AGRO HAULIERS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
14	AHMED ANWAR AHMED	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
15	AHMED HUSSEIN	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
16	ALLIANCE GINNERIES LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
17	ALPHONCE MAPIGANO	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
18	AMOS K. MAHAGIJA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
19	AMOSI KIJA MAHAGIJA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
20	ANDREW BUKWIMBA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
21	BIOSUSTAIN	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
22	BIRCHARD OIL MILL	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
23	BONAVENTURA M. MAKUNDUMLA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
24	BONIFACE KAVULANYA MUTEMI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
25	BONIFACE MUTEMI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
26	CARGOWAX	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
27	CHESANO COTTON GINNERY	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
28	CHUMAS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
29	CLEMENT SHIGUKULU	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
30	CMG INVESTMENTS LTD.	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
31	DAKIANGA DISTRIBUTORS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
32	DANIEL CHEPKONGA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
33	DANIEL JAGILA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
34	DANIEL MAKULA SENI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
35	DANIEL MOGESI NGOCHO/CFC BANK	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
36	DAVID BALELE	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
37	DAVID KAMOTHO KURIA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
38	DAVID MUANGE AND EQUITY	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
39	DAWA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
40	DIDAS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
41	DOTTO RYOBA KIBANDELA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
42	EMMANUEL MBITI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
43	EMMANUEL TABU MJIKA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
44	ERASTO MANJALA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
45	FAHAD ABDALLAH SULEIMAN	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
46	FAMAN INVESTMENT T LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
47	FESSALLY ALLY	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
48	FLORENCIA SERERYA DAUDI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
49	FRANCIS MAINGI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
50	G.M DEWJI CO.LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
51	GAGANI NGALA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
52	GAINI COMPANY LIMITED	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
53	GAUDENCIA RHOBI MAKORI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
54	GAUDENSIA SIMON	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
55	GITONGA W. DAVID	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
56	GRAET LAKES CONSTUCTION CO. LTD.	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
57	GREEN GOLD PETROLEUM	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
58	GTS LOGISTICS LIMITED	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
59	HALADA MTEMI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
60	HARUNA SAID	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
61	HASSAN HUSSEIN	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
62	HERBERT LUSWETI MASENGELI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
63	HUMA NGALAJA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
64	HUSSEIN ABDULLAH MAHMUD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
65	INNOVATION AGENCIES LIMITED	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
66	INTERFREIGHT	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
67	JAFARI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
68	JAMES KWILIGWA MISALABA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
69	JIE LONG HOLDINGS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
70	JNM TRANSPORTER	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
71	JOHN BAHAME SABU	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
72	John Kabole	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
73	john mashaka	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
74	JOHN MBOGO	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
75	JOHN SABU	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
76	JOSEPH MWANZIA NYAMUANGA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
77	KAHAMA OIL MILL LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
78	KAZINZA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
79	KENUNGA ENTERPRISE	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
80	LANDWIEVE TRANSPORTERS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
81	LIVERCOT IMPEX	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
82	MR TRANSPORTERS LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
83	MAGUMBA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
84	MAHSEIN SHARIFF	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
85	MALIMI LUBATULA NGHOLO	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
86	MANCO LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
87	MANESTA ENTERPRISES	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
88	MANGO VISSION FREIGHTERS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
89	MANLAX TRANSPORTERS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
90	MARCO KENGELE	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
91	MARKO KENGELE	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
92	MARTIN P. NYANJUI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
93	MASANJA MAPILYA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
94	MASHIMBA MATULANYA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
95	MASUDI JANI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
96	MATHAYOSONS ENTERPRISES	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
97	MBARAKA MUSTAFA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
98	METL ENTERPRISE LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
99	mhandi	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
100	MICHEAL ODHIAMBO OWING	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
101	MLIMANZILA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
102	MOHAMED	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
103	MOHAMED RASHID ALLY	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
104	Mohamed Enterprise	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
105	MOHAMMED BALEHE	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
106	MOUNT MERU MILLERS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
107	MPEMBA RYASI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
108	MTANI ISRAEL	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
109	MUTEMI BONIFACE	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
110	MWANZA UDUMA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
111	MWATEX HIRED TRUCKS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
112	NASAM PETROLEUM	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
113	NASIBU	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
114	Ngeta	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
115	NGS INVESTMENTS CO. LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
116	NHOLAS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
117	NSAGALI COMPANY LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
118	NYANZA COTTON	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
119	ODAY AGENCIES LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
120	ODEI AGENCIES	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
121	Olam Intemational	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
122	OMAR JABBER SHABIBY	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
123	OMARY	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
124	PAMBAS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
125	PANAL FREIGHTERS LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
126	PAULO NGWANI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
127	PAWA FRANCIS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
128	PAWA TRANSPORT	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
129	PRIVATE TRANSPORTER	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
130	RAHA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
131	RAHA OIL MILL	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
132	RAMADHANI JANI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
133	RAZAK LADHA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
134	RAZAK RADA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
135	RELIABLE HAULIERS LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
136	REUBEN NKANDI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
137	ROBERT MOSES KOWELIJ	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
138	RODGERS MUGISHA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
139	ROKO INVESTMENTS CO LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
140	RUEBEN NKANDI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
141	S & C GINNING CO. LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
142	S&C GINNING COMPANY	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
143	S&C GNNING COMPANY	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
144	SALIM SAID SULEMANI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
145	SALLY JACKSON	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
146	SAMMY NG'ANG'A/KCB	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
147	SAMORA ROBERT MANDALU	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
148	SAMWEL LUCAS TRANSPORTERS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
149	SAMWEL SINZA SITTA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
150	SAUL Z. WEKESA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
151	SAYI DANIEL JAGILA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
152	SENGEREMA MOTOR INVESTMENTS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
153	SHARIFF AND BROTHERS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
154	SHUGA MAGEME	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
155	SIMON KATINA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
156	SINGIDA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
157	SPEEDAG INTERFREIGHT KENYA LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
158	SULEMANI NASOR	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
159	SULEMANI NASSOR ALLY	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
160	SUMMER TRADERS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
161	SUNGWA MALUGU MONGU	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
162	SUPER CONVEYORS LTD	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
163	TARGET TRANSPORT	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
164	THEMISTOCKLES RWEKAZA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
165	Thika Coth Mils	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
166	THOMAS MARWA EM MOHERE ENT	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
167	TITO LUSANA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
168	TRANSWORLD HAULIERS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
169	TSM INTERNATIONAL	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
170	UKIRUGURU	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
171	VISHAL BIBITI	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
172	WETAA INVESTMENTS	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
173	wilbert	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
174	YOHANA	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
175	YUSUF RAZAK	t	2026-05-10 16:05:07.48737	2026-05-10 16:05:07.48737
\.


--
-- Data for Name: tos_user_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_user_type (id, name, created_at, isactive) FROM stdin;
1	admin	2025-09-21 14:50:46.90214	t
2	user	2025-09-21 14:50:46.90214	t
4	supervisor	2025-09-21 14:50:46.90214	t
\.


--
-- Data for Name: tos_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_users (id, first_name, last_name, email, password, created_at, updated_at, updated_by, user_type_id, isactive, phone, id_no) FROM stdin;
1	John	Doe	john.doe@example.com	$2a$10$q0ss5vyv295TWYfN26HzLuwjG3vW/zzXQ.4KuG0e4n/sXlON8C3We	2025-09-21 14:50:46.90214	2025-09-21 14:50:46.90214	\N	1	f	\N	\N
4	Back	Office	back.office@example.com	$2a$10$qt5rwfp.YFZ9q48gAWRzvuNAssX7oT/X.7wMG7yRTiEALCK8sftPK	2025-09-21 14:50:46.90214	2025-09-21 14:50:46.90214	\N	1	t	254712345678	\N
5	admin	admin	admin@example.com	$2a$10$eKaMi5q6Go9W5Na6F4DydeaRBvsh7brEUuA71J3N1vmNIPrDTADna	2025-09-21 14:50:46.90214	2025-09-21 14:50:46.90214	\N	1	t	\N	\N
7	Test	User	\N	$2a$10$2XUpaDOwuy31hEeH2A.uG.y0SpqTeFJ1wqwuqC9cQwQtsmr0k6ewe	2025-09-21 14:50:46.90214	2025-09-21 14:50:46.90214	\N	2	t	254726964270	\N
8	Rashid	Abbas Ali	\N	$2a$10$NFezho9FSlIqDXqku4kAJO27veVrAeVlKxLq1MwbXjHB6m/w6.RY.	2025-09-21 14:50:46.90214	2025-09-21 14:50:46.90214	\N	2	t	254724620561	8454964
9	Abubakar	Imran Baishe	\N	$2a$10$dl8fhwPYmUM6UeaGwNrQEujSXU6D6IcP5CwU3ScnFqdXTYoJFgbyO	2025-09-21 14:50:46.90214	2025-09-21 14:50:46.90214	\N	2	t	254721468449	23079094
10	Elhilaly	Khalid Salim 	\N	$2a$10$kNQLG51.iM6/Czxz1Nh05ei7NBP1wuenLZrz9k7t.rOPDF8uKbOkS	2025-09-21 14:50:46.90214	2025-09-21 14:50:46.90214	\N	2	t	254787034111	24498982
11	Abud	Silos	\N	$2a$10$8yTn9STKNwIKU0uxi9UASOpji0AI73O/Lclu.5LAWZuqOVQT3ZhuK	2025-09-21 14:50:46.90214	2025-09-21 14:50:46.90214	\N	4	t	254716135613	12365478
12	Fahmy	Omar	\N	$2a$10$M9RtK1dfoYoeYdMzY5gPXu3Q4F9uPnAVH4axwsLkHyFaQqrmLdSDK	2025-09-21 14:50:46.90214	2025-09-21 14:50:46.90214	\N	1	t	254729220777	22826865
13	Said	Salim	\N	$2a$10$djKNukehwHgTFKS79OmKz.DfHNZC0Ma9jsgaKFm4a13QaqaPBc9Ue	2025-09-21 14:50:46.90214	2025-09-21 14:50:46.90214	\N	2	t	254723528892	87654123
\.


--
-- Data for Name: tos_vessel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_vessel (id, vessel_type_id, name, created_at, isactive) FROM stdin;
1	1	VESSEL 1	2025-09-21 14:55:33.308567	f
2	1	VESSEL 2	2025-09-21 14:55:33.308567	f
3	1	MV	2025-09-21 14:55:33.308567	f
4	1	RG	2025-09-21 14:55:33.308567	f
5	1	RHEA	2025-09-21 14:55:33.308567	f
6	1	MV RG RHEA	2025-09-21 14:55:33.308567	f
7	1	MV LIVITA	2025-09-21 14:55:33.308567	f
8	1	WATER	2025-09-21 14:55:33.308567	f
9	1	CANADIAN	2025-09-21 14:55:33.308567	f
10	1	BELHAWK	2025-09-21 14:55:33.308567	t
11	1	ALI M	2025-09-21 14:55:33.308567	t
12	1	JETTA	2025-09-21 14:55:33.308567	t
13	1	KARDAM	2025-09-21 14:55:33.308567	t
\.


--
-- Data for Name: tos_vessel_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_vessel_type (id, name, created_at, isactive) FROM stdin;
1	BULK	2025-09-21 14:54:46.335456	t
\.


--
-- Data for Name: tos_wheat_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tos_wheat_type (id, name, status, created_at, updated_at, deleted_at) FROM stdin;
1	TEST A	f	2025-09-21 14:53:53.087161+03	\N	\N
2	AUSTRALIAN	f	2025-09-21 14:53:53.087161+03	\N	\N
3	TEST B	f	2025-09-21 14:53:53.087161+03	\N	\N
4	CANADIAN	t	2025-09-21 14:53:53.087161+03	\N	\N
5	RUSSIAN	t	2025-09-21 14:53:53.087161+03	\N	\N
6	KARDAM	f	2025-09-21 14:53:53.087161+03	\N	\N
\.


--
-- Name: delivery_order_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_order_seq', 73, true);


--
-- Name: knex_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knex_migrations_id_seq', 1, false);


--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knex_migrations_lock_index_seq', 1, false);


--
-- Name: tos_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_activities_id_seq', 50, true);


--
-- Name: tos_activity_points_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_activity_points_id_seq', 1, true);


--
-- Name: tos_activity_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_activity_type_id_seq', 1, false);


--
-- Name: tos_buying_center_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_buying_center_id_seq', 80, true);


--
-- Name: tos_camera_information_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_camera_information_id_seq', 5, true);


--
-- Name: tos_customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_customer_id_seq', 1, false);


--
-- Name: tos_customer_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_customer_type_id_seq', 1, false);


--
-- Name: tos_delivery_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_delivery_orders_id_seq', 74, true);


--
-- Name: tos_dispatch_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_dispatch_type_id_seq', 4, true);


--
-- Name: tos_drivers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_drivers_id_seq', 17, true);


--
-- Name: tos_finished_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_finished_orders_id_seq', 58, true);


--
-- Name: tos_manual_mode_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_manual_mode_id_seq', 2, true);


--
-- Name: tos_packing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_packing_id_seq', 1, false);


--
-- Name: tos_packing_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_packing_type_id_seq', 1, false);


--
-- Name: tos_phone_no_verification_code_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_phone_no_verification_code_id_seq', 1, false);


--
-- Name: tos_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_product_id_seq', 18, true);


--
-- Name: tos_product_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_product_type_id_seq', 1, false);


--
-- Name: tos_product_weight_limits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_product_weight_limits_id_seq', 1, false);


--
-- Name: tos_purchase_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_purchase_type_id_seq', 4, true);


--
-- Name: tos_suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_suppliers_id_seq', 2, true);


--
-- Name: tos_transporter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_transporter_id_seq', 175, true);


--
-- Name: tos_user_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_user_type_id_seq', 1, false);


--
-- Name: tos_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_users_id_seq', 1, false);


--
-- Name: tos_vessel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_vessel_id_seq', 1, false);


--
-- Name: tos_vessel_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_vessel_type_id_seq', 1, false);


--
-- Name: tos_wheat_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tos_wheat_type_id_seq', 1, false);


--
-- Name: tost_anpr_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tost_anpr_id_seq', 233, true);


--
-- Name: tost_anpr_table_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tost_anpr_table_id_seq', 307, true);


--
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- Name: tos_activities tos_activities_delivery_order_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_activities
    ADD CONSTRAINT tos_activities_delivery_order_id_key UNIQUE (delivery_order_id);


--
-- Name: tos_activities tos_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_activities
    ADD CONSTRAINT tos_activities_pkey PRIMARY KEY (id);


--
-- Name: tos_activity_points tos_activity_points_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_activity_points
    ADD CONSTRAINT tos_activity_points_pkey PRIMARY KEY (id);


--
-- Name: tos_activity_type tos_activity_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_activity_type
    ADD CONSTRAINT tos_activity_type_pkey PRIMARY KEY (id);


--
-- Name: tos_anpr tos_anpr_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_anpr
    ADD CONSTRAINT tos_anpr_pkey PRIMARY KEY (id);


--
-- Name: tos_anpr_table tos_anpr_table_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_anpr_table
    ADD CONSTRAINT tos_anpr_table_pkey PRIMARY KEY (id);


--
-- Name: tos_buying_center tos_buying_center_cms_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_buying_center
    ADD CONSTRAINT tos_buying_center_cms_id_key UNIQUE (cms_id);


--
-- Name: tos_buying_center tos_buying_center_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_buying_center
    ADD CONSTRAINT tos_buying_center_pkey PRIMARY KEY (id);


--
-- Name: tos_camera_information tos_camera_information_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_camera_information
    ADD CONSTRAINT tos_camera_information_pkey PRIMARY KEY (id);


--
-- Name: tos_customer tos_customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_customer
    ADD CONSTRAINT tos_customer_pkey PRIMARY KEY (id);


--
-- Name: tos_customer_type tos_customer_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_customer_type
    ADD CONSTRAINT tos_customer_type_pkey PRIMARY KEY (id);


--
-- Name: tos_delivery_orders tos_delivery_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_delivery_orders
    ADD CONSTRAINT tos_delivery_orders_order_number_key UNIQUE (order_number);


--
-- Name: tos_delivery_orders tos_delivery_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_delivery_orders
    ADD CONSTRAINT tos_delivery_orders_pkey PRIMARY KEY (id);


--
-- Name: tos_dispatch_type tos_dispatch_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_dispatch_type
    ADD CONSTRAINT tos_dispatch_type_pkey PRIMARY KEY (id);


--
-- Name: tos_drivers tos_drivers_cms_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_drivers
    ADD CONSTRAINT tos_drivers_cms_id_key UNIQUE (cms_id);


--
-- Name: tos_drivers tos_drivers_id_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_drivers
    ADD CONSTRAINT tos_drivers_id_no_key UNIQUE (id_no);


--
-- Name: tos_drivers tos_drivers_license_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_drivers
    ADD CONSTRAINT tos_drivers_license_no_key UNIQUE (license_no);


--
-- Name: tos_drivers tos_drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_drivers
    ADD CONSTRAINT tos_drivers_pkey PRIMARY KEY (id);


--
-- Name: tos_finished_orders tos_finished_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_finished_orders
    ADD CONSTRAINT tos_finished_orders_pkey PRIMARY KEY (id);


--
-- Name: tos_manual_mode tos_manual_mode_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_manual_mode
    ADD CONSTRAINT tos_manual_mode_pkey PRIMARY KEY (id);


--
-- Name: tos_packing tos_packing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_packing
    ADD CONSTRAINT tos_packing_pkey PRIMARY KEY (id);


--
-- Name: tos_packing_type tos_packing_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_packing_type
    ADD CONSTRAINT tos_packing_type_pkey PRIMARY KEY (id);


--
-- Name: tos_phone_no_verification_code tos_phone_no_verification_code_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_phone_no_verification_code
    ADD CONSTRAINT tos_phone_no_verification_code_pkey PRIMARY KEY (id);


--
-- Name: tos_product tos_product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_product
    ADD CONSTRAINT tos_product_pkey PRIMARY KEY (id);


--
-- Name: tos_product_type tos_product_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_product_type
    ADD CONSTRAINT tos_product_type_pkey PRIMARY KEY (id);


--
-- Name: tos_product_weight_limits tos_product_weight_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_product_weight_limits
    ADD CONSTRAINT tos_product_weight_limits_pkey PRIMARY KEY (id);


--
-- Name: tos_purchase_type tos_purchase_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_purchase_type
    ADD CONSTRAINT tos_purchase_type_pkey PRIMARY KEY (id);


--
-- Name: tos_suppliers tos_suppliers_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_suppliers
    ADD CONSTRAINT tos_suppliers_phone_number_key UNIQUE (phone_number);


--
-- Name: tos_suppliers tos_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_suppliers
    ADD CONSTRAINT tos_suppliers_pkey PRIMARY KEY (id);


--
-- Name: tos_sync_meta tos_sync_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_sync_meta
    ADD CONSTRAINT tos_sync_meta_pkey PRIMARY KEY (key);


--
-- Name: tos_transporter tos_transporter_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_transporter
    ADD CONSTRAINT tos_transporter_pkey PRIMARY KEY (id);


--
-- Name: tos_user_type tos_user_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_user_type
    ADD CONSTRAINT tos_user_type_pkey PRIMARY KEY (id);


--
-- Name: tos_users tos_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_users
    ADD CONSTRAINT tos_users_email_key UNIQUE (email);


--
-- Name: tos_users tos_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_users
    ADD CONSTRAINT tos_users_pkey PRIMARY KEY (id);


--
-- Name: tos_vessel tos_vessel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_vessel
    ADD CONSTRAINT tos_vessel_pkey PRIMARY KEY (id);


--
-- Name: tos_vessel_type tos_vessel_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_vessel_type
    ADD CONSTRAINT tos_vessel_type_pkey PRIMARY KEY (id);


--
-- Name: tos_wheat_type tos_wheat_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_wheat_type
    ADD CONSTRAINT tos_wheat_type_pkey PRIMARY KEY (id);


--
-- Name: idx_camera_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_camera_status ON public.tos_camera_information USING btree (status);


--
-- Name: tos_dispatch_type trg_tos_dispatch_type_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_tos_dispatch_type_updated_at BEFORE UPDATE ON public.tos_dispatch_type FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tos_activities trigger_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON public.tos_activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: tos_delivery_orders fk_delivery_orders_buying_center; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_delivery_orders
    ADD CONSTRAINT fk_delivery_orders_buying_center FOREIGN KEY (buying_center_id) REFERENCES public.tos_buying_center(id) ON DELETE SET NULL;


--
-- Name: tos_finished_orders fk_delivery_orders_packing; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_finished_orders
    ADD CONSTRAINT fk_delivery_orders_packing FOREIGN KEY (packing_id) REFERENCES public.tos_packing(id) ON DELETE SET NULL;


--
-- Name: tos_delivery_orders fk_delivery_orders_purchase_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_delivery_orders
    ADD CONSTRAINT fk_delivery_orders_purchase_type FOREIGN KEY (purchase_type_id) REFERENCES public.tos_purchase_type(id) ON DELETE SET NULL;


--
-- Name: tos_delivery_orders fk_delivery_orders_supplier; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_delivery_orders
    ADD CONSTRAINT fk_delivery_orders_supplier FOREIGN KEY (supplier_id) REFERENCES public.tos_suppliers(id) ON DELETE SET NULL;


--
-- Name: tos_delivery_orders fk_delivery_orders_transporter; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_delivery_orders
    ADD CONSTRAINT fk_delivery_orders_transporter FOREIGN KEY (transporter_id) REFERENCES public.tos_transporter(id) ON DELETE SET NULL;


--
-- Name: tos_delivery_orders fk_tos_delivery_orders_dispatch_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_delivery_orders
    ADD CONSTRAINT fk_tos_delivery_orders_dispatch_type FOREIGN KEY (dispatch_type_id) REFERENCES public.tos_dispatch_type(id);


--
-- Name: tos_activities tos_activities_approved_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_activities
    ADD CONSTRAINT tos_activities_approved_by_foreign FOREIGN KEY (approved_by) REFERENCES public.tos_users(id) ON DELETE SET NULL;


--
-- Name: tos_activities tos_activities_delivery_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_activities
    ADD CONSTRAINT tos_activities_delivery_order_id_fkey FOREIGN KEY (delivery_order_id) REFERENCES public.tos_delivery_orders(id);


--
-- Name: tos_activities tos_activities_fw_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_activities
    ADD CONSTRAINT tos_activities_fw_by_foreign FOREIGN KEY (fw_by) REFERENCES public.tos_users(id) ON DELETE SET NULL;


--
-- Name: tos_activities tos_activities_fw_wb_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_activities
    ADD CONSTRAINT tos_activities_fw_wb_foreign FOREIGN KEY (fw_wb) REFERENCES public.tos_activity_points(id) ON DELETE SET NULL;


--
-- Name: tos_activities tos_activities_sw_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_activities
    ADD CONSTRAINT tos_activities_sw_by_foreign FOREIGN KEY (sw_by) REFERENCES public.tos_users(id) ON DELETE SET NULL;


--
-- Name: tos_activities tos_activities_sw_wb_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_activities
    ADD CONSTRAINT tos_activities_sw_wb_foreign FOREIGN KEY (sw_wb) REFERENCES public.tos_activity_points(id) ON DELETE SET NULL;


--
-- Name: tos_anpr_table tos_anpr_table_camera_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_anpr_table
    ADD CONSTRAINT tos_anpr_table_camera_id_foreign FOREIGN KEY (camera_id) REFERENCES public.tos_activity_points(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tos_anpr_table tos_anpr_table_camera_ip_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_anpr_table
    ADD CONSTRAINT tos_anpr_table_camera_ip_foreign FOREIGN KEY (camera_ip) REFERENCES public.tos_camera_information(id) ON DELETE CASCADE NOT VALID;


--
-- Name: tos_customer tos_customer_customer_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_customer
    ADD CONSTRAINT tos_customer_customer_type_id_fkey FOREIGN KEY (customer_type_id) REFERENCES public.tos_customer_type(id);


--
-- Name: tos_delivery_orders tos_delivery_orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_delivery_orders
    ADD CONSTRAINT tos_delivery_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.tos_customer(id);


--
-- Name: tos_delivery_orders tos_delivery_orders_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_delivery_orders
    ADD CONSTRAINT tos_delivery_orders_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.tos_drivers(id);


--
-- Name: tos_finished_orders tos_finished_orders_delivery_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_finished_orders
    ADD CONSTRAINT tos_finished_orders_delivery_order_id_fkey FOREIGN KEY (delivery_order_id) REFERENCES public.tos_delivery_orders(id);


--
-- Name: tos_finished_orders tos_finished_orders_packing_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_finished_orders
    ADD CONSTRAINT tos_finished_orders_packing_type_id_fkey FOREIGN KEY (packing_type_id) REFERENCES public.tos_packing_type(id);


--
-- Name: tos_finished_orders tos_finished_orders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_finished_orders
    ADD CONSTRAINT tos_finished_orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.tos_product(id);


--
-- Name: tos_manual_mode tos_manual_mode_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_manual_mode
    ADD CONSTRAINT tos_manual_mode_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.tos_users(id) ON DELETE CASCADE;


--
-- Name: tos_packing tos_packing_packing_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_packing
    ADD CONSTRAINT tos_packing_packing_type_id_fkey FOREIGN KEY (packing_type_id) REFERENCES public.tos_packing_type(id);


--
-- Name: tos_users tos_users_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_users
    ADD CONSTRAINT tos_users_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.tos_users(id);


--
-- Name: tos_users tos_users_user_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_users
    ADD CONSTRAINT tos_users_user_type_id_fkey FOREIGN KEY (user_type_id) REFERENCES public.tos_user_type(id);


--
-- Name: tos_vessel tos_vessel_vessel_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tos_vessel
    ADD CONSTRAINT tos_vessel_vessel_type_id_fkey FOREIGN KEY (vessel_type_id) REFERENCES public.tos_vessel_type(id);


--
-- PostgreSQL database dump complete
--

\unrestrict yzW1it3WtVNAa5ZpZAbz5gLMXobaz3LzI7DYye5CdHhJiCpybq4nzD5rhLMiqIQ

