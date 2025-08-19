# fitts-law-study
# Modified Fitts Law Implementation for MR Study

## Original Work
This project is based on the [UIT Fitts Law](https://github.com/SimonWallner/uit-fitts-law) implementation by **Simon Wallner** and **Jesper Tved**.

- **Original Authors:** Simon Wallner, Jesper Tved  
- **Original Repository:** https://github.com/SimonWallner/uit-fitts-law
- **Original License:** MIT

## Modifications
- Enhanced for multi-device experiments
- Added data logging for MR passthrough studies
- Modified UI for cross-platform compatibility

## Citation
If you use this code in your research, please cite both:
1. The original implementation: [BibTeX entry]
2. This modified version: [Your paper or repo]

---
# 피츠의 법칙(Fitts's Law) 인터랙티브 시각화 도구

이 프로젝트는 인간-컴퓨터 상호작용(HCI)의 핵심 원리인 **피츠의 법칙**을 시각적으로 실험하고 학습할 수 있는 웹 기반의 인터랙티브 도구입니다. 사용자는 직접 과업에 참여하고, 수행 데이터를 수집하며, 그 결과를 실시간으로 시각화하여 확인할 수 있습니다.

---

## ✨ 주요 기능

* **인터랙티브 실험 환경**: 다양한 너비와 거리에 있는 목표물을 클릭하는 피츠의 법칙 실험에 직접 참여할 수 있습니다.
* **실시간 데이터 시각화**: 과업을 수행하는 동안 사용자의 수행 데이터가 실시간으로 산점도 및 기타 차트에 표시됩니다.
* **사용자 설정 가능한 실험 조건**: 실험 시작 전, 슬라이더를 이용해 목표물의 거리와 너비를 조절하여 자신만의 실험 조건을 만들 수 있습니다.
* **여러 데이터 세트 관리**: 여러 번의 실험을 진행하고, 각 실험 결과를 별개의 데이터 세트(Data Set)로 저장할 수 있습니다. 각 데이터 세트는 색상으로 구분되어 쉽게 비교할 수 있습니다.
* **데이터 관리 기능**:
    * [cite_start]**전체 데이터 다운로드**: 수집된 모든 실험 데이터를 하나의 CSV 파일로 내려받을 수 있습니다[cite: 1].
    * **개별 데이터 다운로드**: 특정 실험 세트의 데이터만 별도의 CSV 파일로 받을 수 있습니다.
    * [cite_start]**데이터 삭제**: 개별 데이터 세트를 삭제하거나, 저장된 모든 데이터를 한 번에 삭제할 수 있습니다[cite: 1].
* **데이터 영속성**: 실험 데이터는 브라우저의 로컬 저장소(Local Storage)에 저장되어, 창을 닫았다가 다시 열어도 데이터가 유지됩니다.
* [cite_start]**전체 화면 모드**: 실험 영역을 전체 화면으로 확대하여 과업에 더 몰입할 수 있습니다[cite: 1].

---

## 🚀 사용 방법

1.  [cite_start]**index.html** 파일을 웹 브라우저에서 엽니다[cite: 1].
2.  화면 중앙의 검은색 **"Start"** 버튼을 클릭하여 실험을 시작합니다.
3.  화면에 나타나는 빨간색 목표물을 최대한 빠르고 정확하게 클릭합니다.
4.  세션의 모든 시행을 완료합니다.
5.  실험이 한 라운드 끝나면, 데이터는 오른쪽 패널에 새로운 "Data Set"으로 저장됩니다.
6.  [cite_start]패널의 버튼들을 사용하여 저장된 데이터를 관리할 수 있습니다[cite: 1].

---

## 🛠️ 사용된 기술

* [cite_start]**HTML5** [cite: 1]
* **CSS3**: 스타일링은 [960 그리드 시스템](http://960.gs/)을 기반으로 합니다.
* **JavaScript (ES6)**
* [cite_start]**D3.js (v2)**: 데이터 시각화와 상호작용을 위한 핵심 라이브러리입니다[cite: 1].
* [cite_start]**jQuery & jQuery UI**: 슬라이더와 같은 UI 요소 및 DOM 조작을 위해 사용되었습니다[cite: 1].



## 📁 파일 구조

.
├── index.html          \# 애플리케이션의 메인 HTML 파일
├── fitts-law.js        \# 실험 로직 및 D3 시각화를 위한 핵심 JavaScript 파일
├── style.css           \# 커스텀 스타일 시트
├── 960\_12\_col.css      \# 960 그리드 시스템을 위한 CSS
├── reset.css           \# 브라우저 간 스타일 일관성을 위한 CSS 리셋
└── d3/                 \# D3.js 라이브러리를 위한 Git 서브모듈


* [cite_start] index.html: 애플리케이션의 메인 HTML 파일입니다[cite: 1].
* fitts-law.js: 실험 로직 및 D3 시각화를 위한 핵심 JavaScript 파일입니다.
* style.css: 커스텀 스타일 시트입니다.
* 960_12_col.css: 960 그리드 시스템을 위한 CSS입니다.
* reset.css: 브라우저 간 스타일 일관성을 위한 CSS 리셋 파일입니다.
* .gitmodules: D3.js 라이브러리를 위한 Git 서브모듈 정보를 포함합니다.
