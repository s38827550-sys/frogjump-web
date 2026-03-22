# 🐸 Frog Jump Web - Real-time Leaderboard

![React](https://img.shields.io/badge/React-19-blue.svg)
![Supabase](https://img.shields.io/badge/Backend-Supabase-green.svg)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg)

`FrogJumpGame`의 점수를 전 세계 사용자들과 공유하고 경쟁할 수 있는 공식 웹 플랫폼입니다.

## ✨ 주요 기능
- **실시간 리더보드**: 게임에서 업로드된 점수를 실시간으로 확인하고 랭킹 경쟁.
- **Supabase 인증 연동**: 회원가입 및 로그인을 통해 사용자별 데이터를 안전하게 관리.
- **세련된 UI/UX**: 동적 배경과 반응형 레이아웃으로 PC와 모바일 완벽 지원.
- **최신 기술 스택**: React 19와 React Router v7을 활용한 고성능 웹 서비스.

## 🛠️ 기술 스택
- **Frontend**: React 19, React Router v7
- **Backend**: Supabase (Database, Authentication)
- **Styling**: Vanilla CSS (Custom Designs)
- **Deployment**: Vercel

## 🚀 시작하기

### 1. 환경 변수 설정
`.env` 파일을 생성하고 Supabase 프로젝트 정보를 입력하세요.
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 패키지 설치 및 실행
```bash
npm install
npm start
```

## 📁 프로젝트 구조
- **`src/pages/`**: 주요 서비스 페이지 (Login.jsx, Register.jsx, Main.jsx).
- **`src/assets/`**: 웹용 이미지 리소스 및 아이콘.
- **`src/supabaseClient.js`**: Supabase 연결 설정.

## 🔗 관련 프로젝트
- **[FrogJumpGame](https://github.com/your-repo/FrogJumpGame)**: 파이썬 기반 아케이드 게임 본체.
- **[FrogJump Server](https://github.com/your-repo/frogjump-leaderboard)**: 백엔드 API 서비스.
