# Git Branch Manager 배포 가이드

## 🎉 VSIX 파일 생성 완료!

`git-branch-manager-1.0.0.vsix` 파일이 생성되었습니다.

## 배포 방법

### 방법 1: 직접 공유 (가장 간단)

1. **VSIX 파일 공유**
   - `git-branch-manager-1.0.0.vsix` 파일을 다른 사용자에게 전달
   - 이메일, 클라우드 스토리지, GitHub Releases 등 이용 가능

2. **설치 방법 (사용자)**
   
   **VS Code GUI에서 설치:**
   - VS Code 열기
   - Extensions 사이드바 열기 (Ctrl/Cmd + Shift + X)
   - 상단의 `...` 메뉴 클릭
   - `Install from VSIX...` 선택
   - 다운로드 받은 `.vsix` 파일 선택
   
   **명령 팔레트에서 설치:**
   - VS Code에서 Ctrl/Cmd + Shift + P
   - "Extensions: Install from VSIX..." 입력
   - 파일 선택
   
   **터미널에서 설치:**
   ```bash
   code --install-extension git-branch-manager-1.0.0.vsix
   ```

### 방법 2: GitHub Releases 통한 배포

1. **GitHub 저장소 생성**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/git-branch-manager.git
   git push -u origin main
   ```

2. **Release 생성**
   - GitHub 저장소에서 "Releases" 탭 클릭
   - "Create a new release" 클릭
   - Tag: v1.0.0
   - Release title: Git Branch Manager v1.0.0
   - `.vsix` 파일을 Assets에 업로드

3. **사용자 설치**
   - Releases 페이지에서 `.vsix` 파일 다운로드
   - 위의 설치 방법으로 설치

### 방법 3: VS Code Marketplace 게시 (공식 배포)

#### 사전 준비
1. **Azure DevOps 계정 생성**
   - https://dev.azure.com 에서 계정 생성
   
2. **Personal Access Token 발급**
   - Azure DevOps에서 User Settings > Personal Access Tokens
   - New Token 생성 (Marketplace > Manage 권한 필요)
   
3. **Publisher 생성**
   - https://marketplace.visualstudio.com/manage 에서 publisher 생성
   - package.json의 publisher 필드를 생성한 ID로 변경

#### Marketplace 게시
```bash
# Publisher 로그인
npx vsce login [your-publisher-name]

# 확장 프로그램 게시
npx vsce publish

# 또는 버전 자동 증가와 함께 게시
npx vsce publish minor  # 1.0.0 -> 1.1.0
npx vsce publish patch  # 1.0.0 -> 1.0.1
```

#### Marketplace URL
게시 후 확장 프로그램은 다음 URL에서 확인 가능:
```
https://marketplace.visualstudio.com/items?itemName=[publisher-name].git-branch-manager
```

### 방법 4: 회사 내부 배포

1. **내부 파일 서버**
   - `.vsix` 파일을 내부 파일 서버에 업로드
   - 설치 가이드와 함께 공유

2. **Private Extension Registry**
   - Open VSX Registry 등 사용
   - 회사 전용 extension registry 구축

## 버전 업데이트

새 버전 배포 시:

1. **package.json의 version 수정**
   ```json
   "version": "1.1.0"
   ```

2. **VSIX 재생성**
   ```bash
   npm run package
   ```

3. **배포**
   - 선택한 방법으로 재배포

## 현재 상태

✅ **VSIX 파일 생성 완료**: `git-branch-manager-1.0.0.vsix`
📁 **파일 위치**: `/Users/herren/Desktop/jigiyeok/project/clean-local-branch/`

이제 위의 방법 중 하나를 선택하여 다른 사용자와 공유할 수 있습니다!