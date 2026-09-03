-- ============================================================
-- Practical English 3 — 학습 활동 기록 스키마
-- Supabase Dashboard → SQL Editor → New query → 이 파일 전체 붙여넣기 → Run
-- (여러 번 실행해도 안전합니다)
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. 활동 기록: 학생이 연습 문제를 Check 할 때마다 1행
-- ------------------------------------------------------------
create table if not exists public.activities (
  id            bigserial primary key,
  student_id    text        not null,   -- 학번 (브라우저에 저장된 값)
  device_id     text,                   -- 기기 익명 ID (동일 학번 다중 기기 감지용)
  semester      text        not null,   -- 예: 2026-2
  week          smallint    not null,   -- 1~16
  question_id   text        not null,   -- 예: w05-s11-q2
  question_text text,                   -- 문항 앞부분 (대시보드 표시용)
  correct       boolean     not null,
  attempt_no    smallint    not null default 1,
  user_answer   text,
  created_at    timestamptz not null default now()
);

create index if not exists activities_sem_week_idx    on public.activities (semester, week);
create index if not exists activities_sem_student_idx on public.activities (semester, student_id);
create index if not exists activities_created_idx     on public.activities (created_at desc);

-- ------------------------------------------------------------
-- 2. 수강생 명단 (선택): 등록하면 미참여 학생이 대시보드에 표시됨
-- ------------------------------------------------------------
create table if not exists public.roster (
  semester   text not null,
  student_id text not null,
  note       text,
  primary key (semester, student_id)
);

-- ------------------------------------------------------------
-- 3. 설정: 대시보드 비밀번호 해시
-- ------------------------------------------------------------
create table if not exists public.settings (
  key   text primary key,
  value text not null
);

-- ------------------------------------------------------------
-- 4. RLS
--    학생(anon 키): activities INSERT 만 가능. SELECT/UPDATE/DELETE 불가.
--    roster / settings: anon 접근 완전 차단 (아래 RPC 함수 내부에서만 사용)
-- ------------------------------------------------------------
alter table public.activities enable row level security;
alter table public.roster     enable row level security;
alter table public.settings   enable row level security;

drop policy if exists "anon_insert_activities" on public.activities;
create policy "anon_insert_activities"
  on public.activities for insert
  to anon
  with check (
    char_length(student_id) between 4 and 20
    and week between 1 and 16
    and char_length(question_id) <= 40
    and char_length(coalesce(user_answer, '')) <= 500
  );

-- ------------------------------------------------------------
-- 5. 대시보드 비밀번호 설정 — 교수가 SQL Editor 에서 직접 실행
--    예:  select public.set_dashboard_password('내비밀번호');
-- ------------------------------------------------------------
create or replace function public.set_dashboard_password(new_pw text)
returns void
language sql security definer set search_path = public
as $$
  insert into public.settings (key, value)
  values ('dashboard_pw_hash', crypt(new_pw, gen_salt('bf')))
  on conflict (key) do update set value = excluded.value;
$$;
revoke all on function public.set_dashboard_password(text) from public, anon, authenticated;

-- 내부 검증 헬퍼 (외부에서 직접 호출 불가)
create or replace function public._require_dashboard_pw(pw text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if pw is null or not exists (
    select 1 from public.settings
    where key = 'dashboard_pw_hash' and value = crypt(pw, value)
  ) then
    raise exception 'unauthorized';
  end if;
end;
$$;
revoke all on function public._require_dashboard_pw(text) from public, anon, authenticated;

-- ------------------------------------------------------------
-- 6. 대시보드 RPC — 개요 (명단 · 히트맵 · 문항 통계 · 최근 활동 · 합계)
-- ------------------------------------------------------------
create or replace function public.dashboard_overview(pw text, sem text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  perform public._require_dashboard_pw(pw);

  return jsonb_build_object(
    'roster', (
      select coalesce(jsonb_agg(student_id order by student_id), '[]'::jsonb)
      from public.roster where semester = sem
    ),
    'heatmap', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select student_id, week,
               count(distinct question_id)                        as attempted,
               count(distinct question_id) filter (where correct) as solved,
               count(*)                                           as checks,
               count(distinct device_id)                          as devices,
               max(created_at)                                    as last_at
        from public.activities
        where semester = sem
        group by student_id, week
      ) t
    ),
    'questions', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select week, question_id,
               max(question_text)                                 as question_text,
               count(distinct student_id)                         as students,
               count(distinct student_id) filter (where correct)  as students_correct,
               count(*)                                           as attempts
        from public.activities
        where semester = sem
        group by week, question_id
      ) t
    ),
    'recent', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select student_id, week, question_id, correct, attempt_no, created_at
        from public.activities
        where semester = sem
        order by created_at desc
        limit 60
      ) t
    ),
    'totals', (
      select jsonb_build_object(
        'students', count(distinct student_id),
        'checks',   count(*),
        'first_at', min(created_at),
        'last_at',  max(created_at)
      ) from public.activities where semester = sem
    )
  );
end;
$$;
grant execute on function public.dashboard_overview(text, text) to anon;

-- ------------------------------------------------------------
-- 7. 대시보드 RPC — 주차 상세 (학생 × 문항)
-- ------------------------------------------------------------
create or replace function public.dashboard_week(pw text, sem text, wk int)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  perform public._require_dashboard_pw(pw);
  return (
    select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
      select student_id, question_id,
             bool_or(correct) as ever_correct,
             count(*)         as attempts,
             max(created_at)  as last_at
      from public.activities
      where semester = sem and week = wk
      group by student_id, question_id
    ) t
  );
end;
$$;
grant execute on function public.dashboard_week(text, text, int) to anon;

-- ------------------------------------------------------------
-- 8. 대시보드 RPC — CSV 내보내기용 원본
-- ------------------------------------------------------------
create or replace function public.dashboard_export(pw text, sem text)
returns setof public.activities
language plpgsql security definer set search_path = public
as $$
begin
  perform public._require_dashboard_pw(pw);
  return query
    select * from public.activities where semester = sem order by created_at;
end;
$$;
grant execute on function public.dashboard_export(text, text) to anon;

-- ------------------------------------------------------------
-- 9. 대시보드 RPC — 학기 목록 (셀렉터용)
-- ------------------------------------------------------------
create or replace function public.dashboard_semesters(pw text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  perform public._require_dashboard_pw(pw);
  return (
    select coalesce(jsonb_agg(distinct semester order by semester desc), '[]'::jsonb)
    from public.activities
  );
end;
$$;
grant execute on function public.dashboard_semesters(text) to anon;
