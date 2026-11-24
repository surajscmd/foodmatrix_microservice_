\set ON_ERROR_STOP on

-- Run once against the postgres database as the RDS administrator.
-- psql prompts for each password without echoing it.
CREATE ROLE matrix_organization LOGIN;
\password matrix_organization
CREATE DATABASE matrix_organization OWNER matrix_organization;
REVOKE CONNECT ON DATABASE matrix_organization FROM PUBLIC;

CREATE ROLE matrix_hr LOGIN;
\password matrix_hr
CREATE DATABASE matrix_hr OWNER matrix_hr;
REVOKE CONNECT ON DATABASE matrix_hr FROM PUBLIC;

CREATE ROLE matrix_catalog LOGIN;
\password matrix_catalog
CREATE DATABASE matrix_catalog OWNER matrix_catalog;
REVOKE CONNECT ON DATABASE matrix_catalog FROM PUBLIC;

CREATE ROLE matrix_order LOGIN;
\password matrix_order
CREATE DATABASE matrix_order OWNER matrix_order;
REVOKE CONNECT ON DATABASE matrix_order FROM PUBLIC;

CREATE ROLE matrix_inventory LOGIN;
\password matrix_inventory
CREATE DATABASE matrix_inventory OWNER matrix_inventory;
REVOKE CONNECT ON DATABASE matrix_inventory FROM PUBLIC;

CREATE ROLE matrix_notification LOGIN;
\password matrix_notification
CREATE DATABASE matrix_notification OWNER matrix_notification;
REVOKE CONNECT ON DATABASE matrix_notification FROM PUBLIC;
