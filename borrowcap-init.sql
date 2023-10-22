\echo 'Delete and recreate borrowcap_dev db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE borrowcap_dev;
CREATE DATABASE borrowcap_dev;
\connect borrowcap_dev

\i borrowcap-schema.sql
\i borrowcap-seed.sql

\echo 'Delete and recreate borrowcap_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE borrowcap_test;
CREATE DATABASE borrowcap_test;
\connect borrowcap_test

\i borrowcap-schema.sql