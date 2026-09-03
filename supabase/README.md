# 학습 활동 대시보드 — 세팅 가이드

강의 슬라이드의 연습 문제 풀이 기록을 Supabase에 저장하고 `dashboard/`에서 확인합니다.
**한 번만** 하면 되는 세팅이며 약 5분 걸립니다. Google 로그인 등 외부 인증 설정은 없습니다.

## 1. Supabase 프로젝트 만들기 (3분)

1. https://supabase.com 접속 → GitHub 또는 이메일로 가입
2. **New project** 클릭
   - Name: `practical-english-3` (자유)
   - Database Password: 아무 값 (이후 쓸 일 없음)
   - Region: **Northeast Asia (Seoul)**
3. 생성 완료까지 1~2분 대기

## 2. 스키마 실행 (1분)

1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. `supabase/schema.sql` 파일 내용 **전체** 복사 → 붙여넣기 → **Run**
3. 하단에 "Success. No rows returned" 표시되면 완료

## 3. 대시보드 비밀번호 설정 (30초)

SQL Editor 에서 아래 한 줄 실행 (따옴표 안을 원하는 비밀번호로):

```sql
select public.set_dashboard_password('여기에비밀번호');
```

나중에 바꾸려면 같은 문장을 새 비밀번호로 다시 실행하면 됩니다.

## 4. 키 복사 → 파일에 붙여넣기 (1분)

1. 왼쪽 메뉴 **Project Settings**(톱니) → **API**
2. 두 값을 복사
   - **Project URL** — 예: `https://abcdefgh.supabase.co`
   - **anon public** 키 — `eyJ...` 로 시작하는 긴 문자열
3. 아래 두 파일 상단 `CONFIG` 에 붙여넣기
   - `assets/js/tracking.js` → `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SEMESTER`
   - `dashboard/index.html` → `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DEFAULT_SEMESTER`
4. 커밋 · 푸시

> **anon 키는 공개해도 되는 키입니다.** 브라우저에 노출되도록 설계된 키이며 GitHub에 올려도 됩니다.
> 보안은 DB 쪽 RLS(행 수준 보안)가 담당합니다. 이 키로 할 수 있는 일은 **활동 1행 추가**뿐이고,
> 조회·수정·삭제는 불가능합니다. 대시보드 조회는 비밀번호가 DB 안에서 검증된 경우에만 허용됩니다.

## 5. (선택) 수강생 명단 등록

명단을 넣어두면 **한 번도 참여하지 않은 학생**이 대시보드 히트맵에 회색 행으로 나타납니다.

```sql
insert into public.roster (semester, student_id) values
  ('2026-2', '20261001'),
  ('2026-2', '20261002'),
  ('2026-2', '20261003');
-- 필요한 만큼 추가. 이미 있는 학번은 무시하려면 맨 끝에  on conflict do nothing  추가
```

## 6. 동작 확인

1. 강의 페이지(예: `weeks/week02-unit01-02/`) 접속 → **학번 입력 모달**이 뜨는지 확인
2. 연습 문제 하나 **Check** → 우상단 배지가 잠깐 초록으로 반짝이면 저장 성공
3. `dashboard/index.html` 접속 → 비밀번호 입력 → 방금 기록이 보이는지 확인

## 학기가 바뀔 때

- `assets/js/tracking.js` 의 `SEMESTER` 와 `dashboard/index.html` 의 `DEFAULT_SEMESTER` 값만 변경 (예: `2027-1`)
- 이전 학기 데이터는 그대로 남고, 대시보드 상단 학기 선택에서 볼 수 있습니다
- 명단(roster)도 새 학기 값으로 다시 등록

## ⚠ 방학 중 자동 일시정지 (중요)

Supabase 무료 플랜은 **1주일간 접속이 없으면 프로젝트가 일시정지**됩니다.

- 데이터는 보존됩니다
- **개강 1주 전** supabase.com 에 로그인 → 프로젝트 → **Restore** 버튼 클릭 (1분 내 복구)
- 정지 상태에서는 학생 활동이 저장되지 않고 대시보드도 열리지 않습니다
- 강의 페이지 자체는 정상 작동합니다 (기록만 안 됨)

## 동작 원리 (참고)

```
학생 브라우저                                     Supabase
강의 페이지 ── Check 클릭 ──▶ interactive.js
                               └─ 'answer-checked' 이벤트 발생
                                    └─ tracking.js ── INSERT ──▶ activities 테이블
                                        (학번은 브라우저 localStorage 에 저장, 최초 1회 입력)

교수 브라우저
dashboard/ ── 비밀번호 ──▶ RPC (dashboard_overview 등)
                             └─ DB 안에서 비밀번호 검증 → 통과 시 집계 결과만 반환
```

문항 ID 는 `w05-s11-q2` 형식(주차-슬라이드-문항 순번)으로 자동 생성됩니다.
슬라이드에 `data-qid="..."` 속성을 직접 붙이면 그 값을 우선 사용합니다.

## 개인정보

- **수집**: 학번, 기기 익명 ID, 문항 ID, 입력 답안, 정오, 시각
- **미수집**: 이름, 이메일, IP, 위치
- 학번 입력 모달에 "수업 참여 확인 및 강의 개선 자료로 활용" 문구가 표시됩니다
- 첫 수업 때 구두 안내를 권장합니다
- 학생이 "나중에"를 누르면 기록되지 않으며, 우상단 배지에서 언제든 입력할 수 있습니다

## 문제 해결

| 증상 | 확인할 것 |
|---|---|
| 학번 모달이 안 뜸 | `tracking.js` 의 `SUPABASE_URL`/`ANON_KEY` 가 비어 있지 않은지. 해당 페이지에 연습 문제가 없으면 정상(모달 안 뜸) |
| Check 해도 배지가 안 반짝임 | 브라우저 콘솔(F12)에 `[tracking]` 경고 확인. 프로젝트가 일시정지 상태일 수 있음 |
| 대시보드 "비밀번호가 올바르지 않습니다" | 3번 단계 재실행 |
| 대시보드 "설정 필요" | `dashboard/index.html` 의 CONFIG 확인 |
| 히트맵 총 문항 수가 `…` 로 남음 | 강의 HTML 을 불러오지 못한 것. 로컬 파일로 열면 그럴 수 있음 → 서버(GitHub Pages)에서 열기 |
