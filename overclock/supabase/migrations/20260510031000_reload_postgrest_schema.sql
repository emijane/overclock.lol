-- Force PostgREST to reload schema cache after stack RPC repairs.
-- This helps when historical migrations were edited after initial apply and
-- the API layer still serves stale RPC metadata.

do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception
  when others then null;
end;
$$;
