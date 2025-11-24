# 🔧 Vercel 프로젝트 삭제 및 재생성 가이드

## 현재 문제
로컬 `.vercel` 폴더와 Vercel 대시보드의 프로젝트 설정이 동기화되지 않아 오류 발생

---

## ✅ 해결 방법 (2가지)

### 방법 1: 기존 프로젝트 삭제 후 새로 만들기 (추천)

**장점:**
- ✅ 깔끔하게 시작
- ✅ 설정 충돌 없음
- ✅ 가장 확실한 방법

**단계:**

#### 1단계: Vercel 대시보드에서 프로젝트 삭제
1. https://vercel.com/dashboard 접속
2. 프로젝트 클릭
3. Settings 탭 클릭
4. 맨 아래로 스크롤
5. **"Delete Project"** 클릭
6. 프로젝트 이름 입력하여 확인

#### 2단계: 로컬 .vercel 폴더 삭제
```cmd
if exist .vercel rmdir /s /q .vercel
```

#### 3단계: 새 프로젝트로 배포
```cmd
vercel --token v1wibOwakOLEXIzvDcTaKypl --prod --yes
```

---

### 방법 2: 기존 프로젝트 유지 (데이터 보존)

**장점:**
- ✅ 기존 배포 기록 유지
- ✅ 도메인 설정 유지

**단계:**

#### 1단계: 로컬 설정만 초기화
```cmd
REM .vercel 폴더 삭제
if exist .vercel rmdir /s /q .vercel

REM 기존 링크 해제
vercel unlink
```

#### 2단계: 기존 프로젝트에 다시 연결
1. Vercel 대시보드에서 프로젝트 이름 확인
2. 터미널에서:
```cmd
vercel link
```
3. 프로젝트 선택
4. 배포:
```cmd
vercel --prod --yes
```

---

## 🎯 추천 방법

### 방법 1 (기존 프로젝트 삭제) - 가장 확실

**이유:**
- 설정 충돌 완전 제거
- 깔끔하게 새로 시작
- 오류 가능성 최소화

**단계 요약:**
1. Vercel 대시보드 → 프로젝트 → Settings → Delete Project
2. 로컬에서: `if exist .vercel rmdir /s /q .vercel`
3. `vercel --token v1wibOwakOLEXIzvDcTaKypl --prod --yes`

---

## 📋 단계별 가이드

### 1. Vercel 대시보드에서 삭제

1. **https://vercel.com/dashboard** 접속
2. **프로젝트 클릭** (sales-dashboard 또는 다른 이름)
3. **Settings** 탭 클릭
4. 맨 아래로 스크롤
5. **"Delete Project"** 버튼 클릭
6. 프로젝트 이름 입력하여 확인

### 2. 로컬 정리

터미널에서:
```cmd
if exist .vercel rmdir /s /q .vercel
```

### 3. 새로 배포

```cmd
vercel --token v1wibOwakOLEXIzvDcTaKypl --prod --yes
```

질문이 나오면:
- **Set up and deploy?** → Y
- **Which scope?** → 본인 계정
- **Link to existing project?** → N (새로 만들기)
- **Project name?** → Enter (기본값) 또는 원하는 이름
- **Directory?** → Enter

---

## ⚠️ 주의사항

### 삭제 전 확인
- ✅ 기존 URL이 필요 없다면 삭제 OK
- ✅ 도메인 설정이 중요하다면 방법 2 사용
- ✅ 배포 기록이 중요하다면 방법 2 사용

### 삭제 후
- 새 프로젝트는 새로운 URL을 받습니다
- 기존 URL은 더 이상 작동하지 않습니다

---

## 🚀 빠른 실행

### 한 번에 실행

```cmd
REM 1. .vercel 삭제
if exist .vercel rmdir /s /q .vercel

REM 2. 새로 배포
vercel --token v1wibOwakOLEXIzvDcTaKypl --prod --yes
```

**단, 먼저 Vercel 대시보드에서 프로젝트를 삭제하세요!**

---

## 💡 추천 순서

1. **Vercel 대시보드에서 프로젝트 삭제** (중요!)
2. **로컬 .vercel 폴더 삭제**
3. **새로 배포**

이 순서로 진행하면 오류 없이 배포됩니다!

