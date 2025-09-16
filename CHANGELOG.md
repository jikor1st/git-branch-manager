# 변경 기록

Git Branch Manager 확장 프로그램의 모든 주요 변경사항이 이 파일에 기록됩니다.

이 형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)를 기반으로 하며,
이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 준수합니다.

## [미출시]

## [1.1.0] - 2025-09-05

### 추가된 기능
- **현재 브랜치 Pull**: 트리뷰 헤더에 현재 브랜치의 변경사항을 가져오는 액션 버튼 추가
- **브랜치별 Pull**: 개별 브랜치의 컨텍스트 메뉴에 Pull 옵션 추가
- **원격 추적 브랜치 감지**: 브랜치가 원격 추적 브랜치를 가지고 있는지 자동 감지
- **모든 원격 Fetch**: Pull 전에 모든 원격 저장소를 fetch하여 최신 정보 확인
- **Behind/Ahead 카운트**: 브랜치가 원격보다 몇 커밋 뒤처지거나 앞서있는지 확인하는 메서드
- **향상된 Git 감시자**: FETCH_HEAD 파일 모니터링으로 pull/fetch 작업 감지
- **진행 상태 표시**: Pull 작업 중 상세한 진행 상황 표시 (Fetching, Pulling, 원래 브랜치로 복귀)

### 변경된 사항
- 일반적인 Pull 시나리오에 대한 구체적인 에러 메시지로 에러 처리 개선:
  - 추적 브랜치가 설정되지 않음
  - 수동 병합이 필요한 분기된 브랜치
  - Pull을 차단하는 커밋되지 않은 변경사항
- Pull 버튼을 포함하도록 트리뷰 내비게이션 순서 업데이트
- Pull 작업에 대한 실시간 업데이트 감지 향상

### 기술적 변경사항
- `GitCommands.pullBranch(branchName?: string)` 메서드 추가
- `GitCommands.fetchAll()` 메서드 추가
- `GitCommands.getRemoteTrackingBranch(branchName: string)` 메서드 추가
- `GitCommands.hasRemoteTrackingBranch(branchName: string)` 메서드 추가
- `GitCommands.getBehindAheadCount(branchName: string)` 메서드 추가
- FETCH_HEAD 모니터링으로 `GitWatcher` 향상

## [1.0.0] - 2025-09-04

### 추가된 기능
- **브랜치 관리**: VS Code 사이드바에서 모든 로컬 Git 브랜치 표시
- **시각적 표시**: 현재 브랜치를 별 아이콘과 "(current)" 레이블로 강조
- **다중 선택**: 일괄 작업을 위한 체크박스로 여러 브랜치 선택
- **일괄 삭제**: 확인 다이얼로그와 함께 선택된 브랜치를 한 번에 삭제
- **브랜치 체크아웃**: 커밋되지 않은 변경사항 자동 스태시 처리와 함께 브랜치 전환
- **전체 선택/해제**: 모든 브랜치를 선택하거나 해제하는 빠른 액션
- **실시간 업데이트**: CLI를 통해 브랜치가 생성/삭제/전환될 때 자동 새로고침
- **정렬 옵션**: 이름 또는 마지막 커밋 날짜로 브랜치 정렬
- **확인 다이얼로그**: 브랜치 삭제 전 선택적 확인 (설정 가능)

### 기술적 구현
- Git 작업을 위한 `BranchManager` 클래스 구현
- Git CLI 명령어를 위한 `GitCommands` 래퍼 생성
- 실시간 파일 시스템 모니터링을 위한 `GitWatcher` 추가
- VS Code 트리뷰를 위한 `BranchTreeDataProvider` 구현
- 효율적인 변경 감지를 위한 디바운싱 (500ms) 추가

### 설정
- `gitBranchManager.confirmBeforeDelete`: 삭제 전 확인 다이얼로그 표시 (기본값: true)
- `gitBranchManager.sortBy`: "name" 또는 "date"로 브랜치 정렬 (기본값: "name")

## 설치 방법

### VSIX 파일로 설치
```bash
code --install-extension builds/v1.1.0/git-branch-manager-1.1.0.vsix
```

### 소스에서 빌드
```bash
npm install
npm run compile
npx vsce package
```

## 링크

- [저장소](https://github.com/yourusername/git-branch-manager)
- [이슈](https://github.com/yourusername/git-branch-manager/issues)
- [VS Code 마켓플레이스](#) (준비 중)

---

자세한 버전 비교 및 마이그레이션 가이드는 [릴리즈 페이지](https://github.com/yourusername/git-branch-manager/releases)를 참조하세요.