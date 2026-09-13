# Data Annotation Using Python — MCQ Examination Preparation Platform

A self-contained, interactive MCQ examination and learning platform built specifically for your **Data Annotation Using Python** examination tomorrow.

It integrates the complete curriculum and verified question banks across **Chapters 3, 4, 5, 6, 7, and 8** with **240 total MCQs** (40 questions per chapter), zero external dependencies, and instant browser readiness.

---

## 🚀 How to Run the Website

1. Navigate to the project directory:
   ```text
   E:\data annotation prep app\
   ```
2. Double-click **`index.html`** or open it in any web browser (Chrome, Edge, Firefox, Brave, Safari).
3. The platform runs completely offline with all 240 verified MCQs, chapter revision memory sheets, and concept inspection panels!

---

## 📁 Project Structure

```text
data annotation prep app/
├── index.html       # Complete application interface with accessible semantic layout
├── style.css        # Responsive, modern design with Light/Dark mode themes
├── app.js           # Exam engine, practice mode, timer, palette, scoring & LocalStorage
├── questions.js     # 240 verified MCQs, chapter metadata, and revision memory sheets
├── prep.md          # Primary source document
├── DOC-20260913-WA0007.pdf # Official syllabus & question course book
└── README.md        # Documentation and exam prep guide
```

---

## 📊 Complete 240 MCQ Question Bank Breakdown

| Chapter | Topic Focus | Question Count | Format & Status |
| :--- | :--- | :---: | :--- |
| **Chapter 3** | Fundamentals of Data Annotation, Learning Types, Methods, Modalities, Tools, Active Learning | **40 MCQs** | Complete with 4 options, verified answers & concept explanations |
| **Chapter 4** | Text Annotation, NER, BILOU schema, POS tagging, Sentiment Analysis, spaCy, Prodigy | **40 MCQs** | Complete with 4 options, verified answers & concept explanations |
| **Chapter 5** | Image & Video Annotation, Bounding Boxes, Segmentation, Object Tracking, Keyframes, CVAT | **40 MCQs** | Complete with 4 options, verified answers & concept explanations |
| **Chapter 6** | Audio Annotation, STT, Diarization, Emotion, Spectrograms, MFCCs, VAD, Praat, DER | **40 MCQs** | Complete with 4 options, verified answers & concept explanations |
| **Chapter 7** | AI-Assisted Annotation, HITL, Active Learning, 3D LiDAR, Synthetic Data, AR/VR, Ethics | **40 MCQs** | Complete with 4 options, verified answers & concept explanations |
| **Chapter 8** | Real-World Application, Industry Collaboration, Quality Assurance, Teamwork & Feedback | **40 MCQs** | Complete with 4 options, verified answers & concept explanations |
| **Total** | **All Practical & Theoretical Core Annotation Modules** | **240 MCQs** | **100% Verified, 4 Options Each** |

---

## 🌟 Key Features Built

### 1. Dashboard & Progress Tracking
- **Live Statistics**: Real-time tracking of chapters, total questions (240), attempted questions, correct answers, incorrect answers, unanswered questions, and overall accuracy.
- **Chapter Cards**: Cards for each of the 8 syllabus chapters in their original sequence, indicating priority level, question count, and individual chapter accuracy.
- **LocalStorage Persistence**: All your test attempts, scores, marked questions, and mistake lists are automatically preserved across browser refreshes.
- **Reset Progress**: Safe reset option with confirmation modal.

### 2. Dual Study Modes
- **🎯 Examination Mode**: Simulates real test conditions. Answers and explanations are concealed until you submit. Features an optional configurable countdown timer, question palette, and comprehensive final score report.
- **💡 Practice / Learning Mode**: Ideal for rapid learning. Selecting an option immediately evaluates the answer, highlights the correct choice, and provides immediate access to the concept explanation.

### 3. One-Question-at-a-Time Test Interface
- Large, distinct answer cards for options **A, B, C, and D** on individual lines (no crowded rows).
- Full **Keyboard Navigation**: Press <kbd>A</kbd>, <kbd>B</kbd>, <kbd>C</kbd>, or <kbd>D</kbd> to select; <kbd>Enter</kbd> to submit; <kbd>→</kbd> or <kbd>PageDown</kbd> for next; <kbd>←</kbd> or <kbd>PageUp</kbd> for previous; <kbd>M</kbd> to mark for review.
- **Question Palette**: Live sidebar grid displaying state indicators (Unanswered, Answered, Correct, Incorrect, Marked for Review, and Current).

### 4. Deep Concept Inspection Panel
- Every question includes an **"Inspect Concept & Exam Notes"** button.
- Displays the relevant chapter, topic name, why the correct answer is correct directly according to `prep.md`, full syllabus concept notes, and key memory tips.

### 5. Review Incorrect Answers & Retest Engine
- Dedicated mistake review view displaying only questions answered incorrectly.
- Direct **"🔁 Retest All Mistakes Now"** button and individual **"Try Again"** / **"Mark as Mastered"** workflows.

### 6. Search & Question Bank Browser
- Real-time search across question stems, topics, concepts, explanations, and options.
- Filter by chapter (*Chapter 3, 4, 5, 6, 7, 8*) or by attempt status (*Passed*, *Incorrect*, *Unattempted*, *Marked*).

### 7. Last-Minute Memory Sheets
- Quick revision popups for Chapters 3, 4, 5, 6, 7, and 8 memory tables and the **"Top 10 Exam Traps"** directly from `prep.md`.
