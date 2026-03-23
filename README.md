# 🐸 Frog Jump - Official Web Platform

> 🌐 **[frogjump-web.vercel.app](frogjump-web.vercel.app)**

FrogJump 게임의 공식 웹 플랫폼입니다.
회원가입 후 게임을 다운로드하고 전 세계 플레이어들과 랭킹을 경쟁해보세요!

# 🐸 Frog Jump - Official Web Platform

FrogJump 게임의 공식 웹 플랫폼입니다.
회원가입 후 게임을 다운로드하고 전 세계 플레이어들과 랭킹을 경쟁해보세요!

---

## ✨ 주요 기능

- **회원 시스템**: 회원가입/로그인, 닉네임 변경, 회원탈퇴 (30일 데이터 보관)
- **게임 다운로드**: 웹사이트 로그인 후 게임 exe 다운로드 및 계정 연동 플레이
- **실시간 랭킹**: 유저별 최고점수 기반 글로벌 랭킹보드
- **출석체크**: 매일 출석 시 포인트 +3 지급
- **포인트 시스템**: 출석/랭킹 보너스로 포인트 획득, 닉네임 변경에 사용
- **자유게시판**: 글쓰기/댓글/수정/삭제
- **패치노트**: 관리자 전용 작성, 유저 댓글 가능
- **접속유저**: 현재 접속 중인 유저 실시간 표시

---

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | React, React Router |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |
| Styling | Vanilla CSS, Jua 폰트 |
| Deployment | Vercel |

---

## 🔗 관련 프로젝트

- **[FrogJumpGame](https://github.com/s38827550-sys/FrogJumpGame)** - Python/Pygame 기반 아케이드 게임
- **[FrogJump Server](https://github.com/s38827550-sys/frogjump-leaderboard)** - FastAPI 백엔드 서버

---

## 🚀 로컬 실행

1. 환경 변수 설정 (`.env`)
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. 패키지 설치 및 실행
```
npm install
npm start
```

---

## 📁 프로젝트 구조
```
src/
├── pages/
│   ├── Login.jsx       # 로그인 (개구리 물리 애니메이션)
│   ├── Register.jsx    # 회원가입 (개인정보처리방침 동의)
│   └── Main.jsx        # 메인 (홈/랭킹/패치노트/게시판/접속유저)
├── assets/             # 이미지 리소스
└── supabaseClient.js   # Supabase 연결 설정
```

---

## 🔐 보안

- Supabase RLS (Row Level Security) 적용
- JWT 토큰 기반 인증
- 개인정보처리방침 동의 기록 보관
