alter table public.accounts
add column if not exists total_trading_days integer not null default 0,
add column if not exists total_trades_count integer not null default 0;

alter table public.daily_checkins
add column if not exists trades_target integer not null default 0,
add column if not exists trades_completed integer not null default 0;

alter table public.daily_checkins
drop constraint if exists daily_checkins_trades_target_check,
add constraint daily_checkins_trades_target_check
check (trades_target >= 0 and trades_target <= 5);

alter table public.daily_checkins
drop constraint if exists daily_checkins_trades_completed_check,
add constraint daily_checkins_trades_completed_check
check (trades_completed >= 0 and trades_completed <= trades_target);

update public.daily_checkins
set trades_target = 3
where trades_target = 0
  and status in ('planned', 'in_progress', 'done');

create or replace function public.mark_daily_checkin_done(
  p_account_id uuid,
  p_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.checkin_status;
  v_completed integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_owner() and not public.worker_can_access_account(p_account_id) then
    raise exception 'Not allowed';
  end if;

  select status, trades_completed
  into v_status, v_completed
  from public.daily_checkins
  where account_id = p_account_id
    and date = p_date
  for update;

  if not found then
    raise exception 'Check-in not found';
  end if;

  if v_completed <= 0 then
    raise exception 'Complete at least one trade first';
  end if;

  if v_status = 'done' then
    return jsonb_build_object('ok', true, 'already_done', true);
  end if;

  update public.daily_checkins
  set status = 'done',
      completed_by = auth.uid(),
      completed_at = now()
  where account_id = p_account_id
    and date = p_date;

  update public.accounts
  set total_trading_days = total_trading_days + 1,
      total_trades_count = total_trades_count + v_completed
  where id = p_account_id;

  return jsonb_build_object('ok', true, 'already_done', false);
end;
$$;

create or replace function public.skip_daily_checkin(
  p_account_id uuid,
  p_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.checkin_status;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_owner() and not public.worker_can_access_account(p_account_id) then
    raise exception 'Not allowed';
  end if;

  select status
  into v_status
  from public.daily_checkins
  where account_id = p_account_id
    and date = p_date
  for update;

  if not found then
    raise exception 'Check-in not found';
  end if;

  if v_status = 'done' then
    raise exception 'Completed check-in cannot be skipped';
  end if;

  update public.daily_checkins
  set status = 'skipped',
      completed_by = auth.uid(),
      completed_at = now()
  where account_id = p_account_id
    and date = p_date;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.mark_daily_checkin_done(uuid, date) to authenticated;
grant execute on function public.skip_daily_checkin(uuid, date) to authenticated;
