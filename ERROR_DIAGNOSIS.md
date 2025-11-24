# 🔍 Vercel 배포 오류 진단

## 오류 메시지를 알려주세요

터미널에 나타나는 오류 메시지를 복사해서 알려주세요.

---

## 일반적인 오류 및 해결 방법

### 1. 빌드 오류
```
Error: Build failed
npm ERR! 
```
**해결:** TypeScript 또는 의존성 문제

### 2. 파일 크기 오류
```
Error: File size limit exceeded (50MB)
```
**해결:** ending focast.xlsx를 JSON으로 변환

### 3. 메모리 오류
```
Error: Out of memory
```
**해결:** vercel.json에서 메모리 증가 (이미 설정됨)

### 4. 타임아웃 오류
```
Error: Function execution timeout
```
**해결:** 데이터 최적화 필요

### 5. 의존성 오류
```
Error: Cannot find module
```
**해결:** package.json 의존성 확인

---

## 즉시 진단

다음 정보를 알려주세요:

1. **오류 메시지**
   - 터미널의 빨간색 오류 메시지
   - "Error:" 로 시작하는 줄

2. **오류 발생 시점**
   - 파일 업로드 중?
   - 빌드 중?
   - 배포 중?

3. **전체 로그**
   - 가능하면 터미널 전체 내용 복사

---

## 빠른 확인

터미널에서:

```cmd
vercel logs
```

또는 Vercel 대시보드에서:
https://vercel.com/dashboard

