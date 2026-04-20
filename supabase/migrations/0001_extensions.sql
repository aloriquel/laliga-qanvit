-- Extensions required by La Liga Qanvit
-- uuid-ossp not needed: using gen_random_uuid() (built-in since Postgres 13)
create extension if not exists "vector";
create extension if not exists "pg_trgm";
create extension if not exists "pg_net";     -- triggers → edge functions
