# Habit Tracker 🎀

목표 → 시스템 → 습관 계층 구조로 일일 습관을 추적하는 웹 앱입니다.  
데이터는 브라우저 `localStorage`에 저장되며, 서버가 필요 없습니다.

## 기능

- **대시보드**: 분기 목표·시스템·습관 계층 구조, 오늘 달성률, 14일 강도 히트맵
- **통계**: 일별 / 주별 / 월별 / 연별 완료율 차트, 마찰(미완료 사유) 분석
- **Year Wrapped**: 연말 요약 모달

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

## GitHub Pages 배포

### 1. GitHub에 저장소 만들기

1. GitHub에서 새 저장소를 만듭니다 (예: `habit-tracker`).
2. 이 폴더에서 Git을 초기화하고 푸시합니다:

```bash
git init
git add .
git commit -m "Add habit tracker web app"
git branch -M main
git remote add origin https://github.com/<사용자명>/<저장소명>.git
git push -u origin main
```

### 2. GitHub Pages 설정

1. 저장소 **Settings → Pages**
2. **Build and deployment → Source** 를 **GitHub Actions** 로 선택
3. `main` 브랜치에 푸시하면 `.github/workflows/deploy.yml` 이 자동으로 빌드·배포합니다

배포 URL: `https://<사용자명>.github.io/<저장소명>/`

### 3. 사용자 페이지(`username.github.io`)로 배포하는 경우

저장소 이름이 `username.github.io` 이면 `next.config.mjs` 의 `basePath` 가 필요 없습니다.  
워크플로우에서 `NEXT_PUBLIC_BASE_PATH` 를 빈 문자열로 바꿔 주세요:

```yaml
env:
  NEXT_PUBLIC_BASE_PATH: ""
```

## 기술 스택

- [Next.js 14](https://nextjs.org/) (App Router, static export)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [Lucide React](https://lucide.dev/)

## 프로젝트 구조

```
app/           # 페이지 (대시보드, 통계)
components/    # UI 컴포넌트
context/       # TrackerContext (상태 관리)
lib/           # 타입, storage, 유틸
```

## 참고

- `mobile/` 폴더는 이전 Expo 모바일 버전입니다. 웹 앱은 루트의 Next.js 프로젝트를 사용합니다.
- 데이터는 이 브라우저·이 기기에만 저장됩니다. 다른 기기와 동기화되지 않습니다.
