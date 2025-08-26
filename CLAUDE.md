# Git Branch Manager - VS Code Extension

## Product & Technical Requirements Document (PRD/TRD)

### 1. 제품 개요

#### 1.1 제품명

**Git Branch Manager** - VS Code Extension

#### 1.2 목적

Git CLI를 사용하는 개발자들을 위한 로컬 브랜치 관리 도구로, VS Code 내에서 직관적인 UI를 통해 로컬 브랜치를 효율적으로 정리할 수 있도록 지원

#### 1.3 대상 사용자

- VS Code를 주 에디터로 사용하는 개발자
- Git CLI에 익숙한 개발자
- 로컬 브랜치 정리가 필요한 개발자

### 2. 핵심 기능 요구사항

#### 2.1 로컬 브랜치 목록 표시

- **기능**: 현재 Git 저장소의 모든 로컬 브랜치를 목록으로 표시
- **요구사항**:
  - 브랜치명 표시
  - 현재 활성 브랜치 시각적 구분 (다른 색상/아이콘)
  - 브랜치별 체크박스 제공

#### 2.2 브랜치 선택 및 삭제

- **기능**: 체크된 브랜치들을 일괄 삭제
- **요구사항**:
  - 개별 브랜치 체크/언체크
  - 전체 선택/해제 기능
  - 현재 브랜치는 선택 불가 (비활성화)
  - 삭제 전 확인 다이얼로그
  - 삭제 후 목록 자동 갱신

#### 2.3 브랜치 체크아웃

- **기능**: 다른 브랜치로 전환
- **요구사항**:
  - 각 브랜치 우측에 팝오버 메뉴 버튼
  - 팝오버 내 "체크아웃" 옵션
  - 체크아웃 성공 시 UI 갱신
  - 체크아웃 실패 시 에러 메시지 표시

#### 2.4 실시간 브랜치 감지 (v1.1.0 추가)

- **기능**: CLI 명령어로 인한 브랜치 변경 실시간 감지
- **요구사항**:
  - Git 파일 시스템 변경 감지 (FileSystemWatcher)
  - 브랜치 생성/삭제/전환 자동 감지
  - 500ms 디바운싱으로 연속 변경 처리
  - 외부 변경 시 브랜치 목록 자동 갱신

#### 2.5 사용자 경험

- **기능**: 직관적이고 안전한 사용자 인터페이스
- **요구사항**:
  - 명확한 버튼 레이블 및 아이콘
  - 위험한 작업(삭제) 전 확인 절차
  - 작업 진행 상태 표시
  - 에러 상황에 대한 명확한 피드백

### 3. 기술 요구사항

#### 3.1 개발 환경

- **플랫폼**: VS Code Extension
- **언어**: TypeScript
- **프레임워크**: VS Code Extension API
- **패키지 매니저**: npm

#### 3.2 필수 의존성

```json
{
  "devDependencies": {
    "@types/vscode": "^1.74.0",
    "@types/node": "16.x",
    "typescript": "^4.9.4",
    "@vscode/test-electron": "^2.2.0"
  },
  "dependencies": {
    "child_process": "built-in"
  }
}
```

#### 3.3 확장 프로그램 구조

```
src/
├── extension.ts          # 확장 프로그램 진입점
├── branchManager.ts      # 브랜치 관리 로직
├── gitCommands.ts        # Git CLI 명령어 래퍼
├── gitWatcher.ts         # Git 파일 시스템 감지 (v1.1.0)
├── treeDataProvider.ts   # 트리뷰 데이터 제공자
├── branchItem.ts         # 브랜치 아이템 모델
└── utils/
    ├── gitUtils.ts       # Git 유틸리티 함수
    └── uiUtils.ts        # UI 유틸리티 함수
```

#### 3.4 핵심 클래스 설계

##### 3.4.1 BranchManager 클래스

```typescript
class BranchManager {
  - getCurrentBranch(): Promise<string>
  - getLocalBranches(): Promise<string[]>
  - deleteBranches(branches: string[]): Promise<void>
  - checkoutBranch(branch: string): Promise<void>
  - refreshBranches(): Promise<void>
}
```

##### 3.4.2 BranchTreeDataProvider 클래스

```typescript
class BranchTreeDataProvider implements vscode.TreeDataProvider<BranchItem> {
  - getTreeItem(element: BranchItem): vscode.TreeItem
  - getChildren(element?: BranchItem): Promise<BranchItem[]>
  - refresh(): void
}
```

##### 3.4.3 BranchItem 클래스

```typescript
class BranchItem extends vscode.TreeItem {
  constructor(
    public readonly branchName: string,
    public readonly isCurrentBranch: boolean
  );
}
```

##### 3.4.4 GitWatcher 클래스 (v1.1.0 추가)

```typescript
class GitWatcher {
  constructor(
    private workspaceRoot: string,
    private onBranchChange: () => void
  );
  - start(): void                    # 파일 감시 시작
  - handleGitChange(reason: string): void  # Git 변경 처리
  - dispose(): void                   # 리소스 정리
}
```

#### 3.5 Git 명령어 매핑

- **브랜치 목록**: `git branch`
- **현재 브랜치**: `git branch --show-current`
- **브랜치 삭제**: `git branch -D <branch-name>`
- **브랜치 체크아웃**: `git checkout <branch-name>`

#### 3.6 VS Code API 활용

- **TreeView**: 브랜치 목록 표시
- **Commands**: 사용자 액션 처리
- **QuickPick**: 확인 다이얼로그
- **StatusBar**: 작업 상태 표시
- **Notifications**: 성공/에러 메시지
- **FileSystemWatcher**: Git 파일 변경 감지 (v1.1.0)

### 4. UI/UX 설계

#### 4.1 트리뷰 레이아웃

```
🌳 Git Branches
├── [✓] feature/login-page
├── [✓] feature/user-profile
├── [×] main (current) ⭐     ⋮ (팝오버 메뉴)
├── [✓] hotfix/bug-fix        ⋮
└── [✓] develop               ⋮
```

#### 4.2 팝오버 메뉴

```
⋮ 클릭 시:
┌─────────────────┐
│ 🔄 Checkout     │
│ 📊 Show History │ (확장 기능)
└─────────────────┘
```

#### 4.3 액션 버튼

- **Select All/None**: 전체 선택/해제 토글
- **Delete Selected**: 선택된 브랜치 삭제
- **Refresh**: 브랜치 목록 새로고침

### 5. 에러 처리

#### 5.1 Git 명령어 실행 실패

- 명령어 실행 전 Git 저장소 유효성 검증
- 실행 중 에러 발생 시 사용자에게 명확한 메시지 제공
- 네트워크 연결 없이도 로컬 작업은 정상 동작

#### 5.2 브랜치 삭제 실패

- 병합되지 않은 브랜치 삭제 시 경고
- 원격에 푸시된 브랜치 삭제 시 안내
- 권한 부족 시 적절한 에러 메시지

#### 5.3 체크아웃 실패

- Uncommitted changes 있을 시 stash 권유
- 존재하지 않는 브랜치 체크아웃 시도 시 에러 처리

### 6. 성능 요구사항

#### 6.1 응답 시간

- 브랜치 목록 로딩: 1초 이내
- 브랜치 체크아웃: 2초 이내
- 브랜치 삭제: 브랜치당 1초 이내

#### 6.2 메모리 사용량

- 확장 프로그램 활성화 시 추가 메모리: 10MB 이내
- 대용량 저장소(100+ 브랜치)에서도 안정적 동작

### 7. 확장성 고려사항

#### 7.1 향후 추가 기능

- 원격 브랜치 관리
- 브랜치 히스토리 보기
- 브랜치 비교 기능
- 브랜치 이름 변경
- 브랜치 생성 기능

#### 7.2 설정 옵션

- 삭제 전 확인 다이얼로그 on/off
- 브랜치 정렬 방식 (이름순/수정일순)
- 숨김 브랜치 표시 여부

### 8. 테스트 요구사항

#### 8.1 단위 테스트

- Git 명령어 실행 함수
- 브랜치 목록 파싱 함수
- 에러 처리 로직

#### 8.2 통합 테스트

- 실제 Git 저장소에서의 전체 워크플로우
- 다양한 Git 상태에서의 동작 확인

#### 8.3 사용성 테스트

- 실제 개발 환경에서의 사용성 검증
- 다양한 OS 환경에서의 호환성 테스트

### 9. 배포 요구사항

#### 9.1 VS Code Marketplace

- 확장 프로그램 패키징
- README 및 사용 가이드 작성
- 스크린샷 및 데모 영상 제작

#### 9.2 버전 관리

- Semantic Versioning 적용
- CHANGELOG 문서 유지
- GitHub 릴리스 노트 작성

### 10. 버전 히스토리

#### v1.0.0 (초기 릴리스)
- 기본 브랜치 관리 기능
- 브랜치 목록 표시
- 브랜치 선택 및 삭제
- 브랜치 체크아웃
- 전체 선택/해제 기능

#### v1.1.0 (실시간 업데이트)
- **GitWatcher 클래스 추가**: Git 파일 시스템 실시간 감지
- **자동 새로고침**: CLI 명령어 감지 시 브랜치 목록 자동 갱신
- **감지 대상 파일**:
  - `.git/HEAD`: 브랜치 전환 감지
  - `.git/refs/heads/**`: 브랜치 생성/삭제 감지
  - `.git/packed-refs`: 압축된 브랜치 감지
  - `.git/ORIG_HEAD`: merge/rebase 작업 감지
- **성능 최적화**: 500ms 디바운싱으로 연속 변경 효율적 처리
- **초기 로드 개선**: 확장 프로그램 활성화 시 자동 브랜치 목록 로드

### 11. 개발 일정 (완료)

#### Phase 1 (완료)
- 기본 구조 및 Git 명령어 래퍼 구현
- 브랜치 목록 표시 기능

#### Phase 2 (완료)
- 브랜치 선택 및 삭제 기능
- 현재 브랜치 제외 로직

#### Phase 3 (완료)
- 팝오버 메뉴 및 체크아웃 기능
- UI/UX 개선

#### Phase 4 (완료)
- 실시간 브랜치 감지 기능
- 자동 새로고침 구현
- 문서화 및 배포 준비

---

이 문서는 Claude Code를 사용한 개발 진행 시 참조 자료로 활용하시면 됩니다.
