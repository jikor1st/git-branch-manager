# Git Branch Manager - VS Code Extension

로컬 Git 브랜치를 효율적으로 관리하는 VS Code 확장 프로그램입니다.

## 개발 환경에서 테스트하기

### 방법 1: VS Code에서 직접 실행 (권장)

1. **VS Code에서 프로젝트 열기**
   ```bash
   cd /Users/herren/Desktop/jigiyeok/project/clean-local-branch
   code .
   ```

2. **의존성 설치 및 컴파일**
   ```bash
   npm install
   npm run compile
   ```

3. **확장 프로그램 실행**
   - VS Code에서 `F5` 키를 누르거나
   - 메뉴에서 `Run > Start Debugging` 선택
   - 또는 왼쪽 사이드바의 Run and Debug 아이콘 클릭 후 ▶️ 버튼 클릭

4. **새로운 VS Code 창이 열립니다**
   - 제목 표시줄에 `[Extension Development Host]`라고 표시됨
   - 이 창에서 Git 저장소가 있는 폴더를 열면 확장 프로그램을 사용할 수 있습니다

### 방법 2: 터미널에서 실행

```bash
# 프로젝트 디렉토리에서
npm install
npm run compile

# VS Code Extension Development Host 실행
code --extensionDevelopmentPath=/Users/herren/Desktop/jigiyeok/project/clean-local-branch
```

## 확장 프로그램 사용하기

1. **Git 저장소 열기**
   - Extension Development Host 창에서 Git 저장소가 있는 폴더를 엽니다

2. **Git Branches 뷰 확인**
   - 왼쪽 Explorer 사이드바에 "Git Branches" 섹션이 표시됩니다
   - 로컬 브랜치 목록이 자동으로 표시됩니다

3. **주요 기능**
   - **브랜치 선택**: 브랜치 이름을 클릭하여 선택/해제
   - **전체 선택**: 상단 툴바의 "Select All" 버튼 클릭
   - **전체 해제**: 상단 툴바의 "Deselect All" 버튼 클릭
   - **선택된 브랜치 삭제**: 상단 툴바의 "Delete Selected" 버튼 클릭
   - **브랜치 체크아웃**: 브랜치 오른쪽의 화살표 아이콘 클릭
   - **목록 새로고침**: 상단 툴바의 새로고침 버튼 클릭

## 주의사항

- 현재 활성 브랜치는 선택할 수 없으며 별표 아이콘으로 표시됩니다
- 브랜치 삭제 전 확인 다이얼로그가 표시됩니다
- 체크아웃 시 커밋되지 않은 변경사항이 있으면 stash 옵션을 제공합니다

## 설정

VS Code 설정에서 다음 옵션을 변경할 수 있습니다:

- `gitBranchManager.confirmBeforeDelete`: 삭제 전 확인 (기본값: true)
- `gitBranchManager.sortBy`: 브랜치 정렬 방식 - "name" 또는 "date" (기본값: "name")

## 문제 해결

### 확장 프로그램이 보이지 않는 경우
1. Git 저장소인지 확인하세요
2. Explorer 사이드바를 확인하세요
3. 개발자 도구 (Help > Toggle Developer Tools)에서 에러를 확인하세요

### 디버깅
- 개발 중 console.log 출력은 Debug Console에서 확인할 수 있습니다
- VS Code 메뉴: View > Debug Console