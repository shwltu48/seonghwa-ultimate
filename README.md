# 빈 공간을 찾아라! · 성화중학교 얼티미트

청주 성화중학교 1학년을 위한 45분 교실 전략 수업입니다. 기본 패스·캐치 학습 이후, 교사 화면과 학생 종이 활동지를 함께 사용합니다.

## 수업 사용

1. 사이트의 **학생 활동지 PDF**를 학생당 2쪽씩 인쇄합니다.
2. ‘작전 시작하기’를 누르고 5개 단계(5·8·12·12·8분)를 진행합니다.
3. 퀴즈 답과 패스 대상은 선택 전 학생의 근거를 먼저 듣습니다.
4. 해설은 단계별 ‘교사 진행 안내’ 또는 교사용 PDF를 참고합니다.

PDF: 학습자료 2쪽, 학생 활동지 2쪽, 교사용 해설 2쪽, 전체 세트 6쪽. 전체 세트에는 답안이 포함되므로 학생 배부용과 구분하세요.

## 개발 및 검증

정적 HTML/CSS/JS이며 런타임 외부 패키지·API·계정이 필요 없습니다. 입력이나 학생 개인정보를 서버에 저장하지 않습니다. 퀴즈·선택 상태는 현재 탭 메모리에만 유지됩니다.

- `lesson.json`: 성취기준·목표·규칙·문항·해설의 공통 원본
- `site/`: GitHub Pages 배포 파일만 포함
- `scripts/build.py`: 공통 데이터 및 인쇄 HTML을 갱신하고 PDF 4종 생성

Python 3.13 및 Google Chrome 설치 후:

```sh
python -m pip install -r requirements.txt
python scripts/build.py
python scripts/check.py
python scripts/qa.py
```

로컬 미리보기: `python -m http.server 8765 --directory site`

`main`에 푸시하면 GitHub Actions가 내용·경로를 검사한 후 `site/`만 Pages에 배포합니다. PDF는 사전 생성한 정적 파일을 제공하여 브라우저별 PDF 생성 실패를 줄입니다. ‘활동지 인쇄’는 별도의 인쇄 전용 HTML을 엽니다.

## 교육 내용

2022 개정 체육과 교육과정 [9체02-12]·[9체02-26] 중심, [9체02-11] 복습 연결. 중학교 1~3학년군 성취기준이며 1학년용으로 재구성했습니다. 교실 수업만으로 경기 기능이나 실제 경기 수행을 평가하지 않습니다.

규칙 출처: [WFDF 2025–2028 Basic Rules](https://rules.wfdf.sport/wp-content/uploads/2025/03/WFDF-Rules-of-Ultimate-2025-2028-Basic-Version.pdf). 4 대 2 배치와 세 번의 패스는 탐구 과제 조건이며 공식 경기 규칙이 아닙니다.

학교명·학년·교과는 수업 대상 정보입니다. 확인되지 않은 학교 로고·교훈·직원 정보를 사용하지 않습니다. 학교 공식 홈페이지를 대체하지 않습니다.

## 글꼴

Noto Sans KR: SIL Open Font License, `site/assets/OFL.txt`. 글꼴은 로컬 제공하며 PDF에 포함됩니다. 도형과 코트 그림은 이 수업용으로 제작했습니다.
