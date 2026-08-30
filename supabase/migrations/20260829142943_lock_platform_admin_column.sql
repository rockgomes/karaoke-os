-- A table-level UPDATE grant covers every column, and revoking a single
-- column does not remove it. So drop the table-level grant first, then
-- grant back only the columns a user may change about themselves.
revoke update on public.users from anon, authenticated;
grant  update (email, display_name) on public.users to authenticated;

-- Undo the promotion the failed test performed.
update public.users set is_platform_admin = false;
