# Portfolio Thumbnails — Auto-load System

이 폴더에 이미지를 넣으면 `portfolio/index.html`의 카드 썸네일로 **자동 등록**됩니다.

## 파일명 규칙

```
{project-id}.{png|jpg|jpeg|webp}
```

`project-id`는 카드의 `<div class="project-thumb" data-project-id="...">` 값과 일치해야 합니다.

## 현재 project-id 목록 (23개)

| Week | Project | Project ID | 학생 |
|---|---|---|---|
| 3 | MAKEOVER | `week03-makeover` | 이OO |
| 3 | Will Smith Chat | `week03-will-smith-chat` | 박OO |
| 3 | Card News | `week03-card-news` | 박OO |
| 4 | Seafood Master | `week04-seafood-master` | 김OO |
| 4 | Cook Helper | `week04-cook-helper` | 신OO |
| 5 | Global Grammar Traveler | `week05-grammar-traveler` | 정OO |
| 5 | AI Travel Planner | `week05-travel-planner` | 김OO |
| 6 | Clean Up | `week06-clean-up` | 강OO |
| 6 | Room Quest | `week06-room-quest` | 김OO |
| 6 | Hotel Chaos Rescue | `week06-hotel-chaos-rescue` | 이OO |
| 7 | English Festival Quiz | `week07-english-festival-quiz` | 조OO |
| 7 | World Festival Explorer | `week07-world-festival-explorer` | 이OO |
| 7 | Green Car Assistant | `week07-green-car-assistant` | 조OO |
| 9 | Guess Your Future | `week09-guess-future` | 최OO |
| 9 | Discover Your Future Career | `week09-future-career` | 전OO |
| 11 | Asia Master | `week11-asia-master` | 이OO |
| 11 | World Elite Guide | `week11-world-elite-guide` | 최OO |
| 11 | EURO Stadium Scout | `week11-euro-stadium` | 박OO |
| 12 | The Mansion Mystery | `week12-mansion-mystery` | 심OO |
| 12 | My Own Library | `week12-my-own-library` | 한OO |
| 14 | Emoji Space Generator | `week14-emoji-space-generator` | 오OO |
| 14 | Emoji 3D Room Curator | `week14-emoji-3d-room` | 이OO |
| 14 | Interactive Grammar Tool | `week14-grammar-tool` | 양OO |

## 사용 예시

### 새 썸네일 추가
1. 프로젝트의 스크린샷을 캡처/제작 (권장 비율 **2:1 이상, 480×220px 권장**)
2. 파일명을 위 표의 `project-id`와 일치시켜 저장 (예: `week06-room-quest.png`)
3. 이 폴더에 파일을 드롭
4. 강의 허브에서 포트폴리오 페이지 새로고침 → 자동 적용

### 확장자 우선순위
시스템이 다음 순서로 파일을 탐색합니다:
1. `.png`
2. `.jpg`
3. `.jpeg`
4. `.webp`

첫 번째로 발견되는 파일이 사용됩니다.

### 이미지 제거
파일을 폴더에서 삭제 (또는 다른 이름으로 변경) → 자동으로 이모지+그라데이션 fallback으로 복귀

## 기술 동작

`portfolio/index.html` 끝부분의 인라인 스크립트가 각 `.project-thumb[data-project-id]` 요소에 대해:
1. `thumbnails/{project-id}.{ext}` 파일을 4개 확장자로 순차 탐색
2. 발견 시 `<img class="auto-thumb">`를 동적 추가 + `.has-image` 클래스로 이모지 숨김
3. 없으면 기본 이모지+그라데이션 유지

서버 디렉토리 인덱싱이나 manifest 파일 불필요 — **순수 클라이언트 사이드**.

## 새 학생 프로젝트 추가 시

새 학생 작품을 포트폴리오에 추가하려면:
1. `portfolio/index.html`의 해당 주차 섹션에 `<a class="project-card">` 블록 추가
2. `data-project-id="weekXX-slug"` 형식의 새 ID 부여
3. (선택) 동일 이름의 이미지를 이 폴더에 드롭
