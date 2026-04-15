with randomized as (
  select
    id,
    2 + floor(random() * 4)::integer as next_target
  from public.daily_checkins
  where status = 'planned'
    and trades_completed = 0
)
update public.daily_checkins checkins
set trades_target = randomized.next_target
from randomized
where checkins.id = randomized.id;
