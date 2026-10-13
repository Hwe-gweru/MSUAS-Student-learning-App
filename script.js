const facultySelect = document.querySelector("#faculty-select");
const programmeSelect = document.querySelector("#programme-select");
const levelSelect = document.querySelector("#level-select");
const moduleList = document.querySelector("#module-list");
const moduleMessage = document.querySelector("#module-message");
const lessonContent = document.querySelector("#lesson-content");
const quizContent = document.querySelector("#quiz-content");
const quizResult = document.querySelector("#quiz-result");

function addOption(dropdown, value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  dropdown.appendChild(option);
}

function resetDropdown(dropdown, instruction) {
  dropdown.replaceChildren();
  addOption(dropdown, "", instruction);
  dropdown.disabled = true;
}

function getProgrammesForFaculty(facultyName) {
  return courseCatalog.filter(entry => entry.faculty === facultyName).flatMap(entry => entry.programmes);
}

function getSelectedProgramme() {
  return getProgrammesForFaculty(facultySelect.value).find(programme => programme.name === programmeSelect.value);
}

function addText(parent, tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  parent.appendChild(element);
  return element;
}

function clearLearningArea() {
  lessonContent.replaceChildren();
  quizContent.replaceChildren();
  quizResult.textContent = "";
}

function showQuiz(quiz) {
  quizContent.replaceChildren();
  quizResult.textContent = "";
  if (!quiz || quiz.length === 0) {
    addText(quizContent, "p", "Questions for this module are being prepared.");
    return;
  }
  const form = document.createElement("form");
  form.id = "module-quiz";
  quiz.forEach((item, questionIndex) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "quiz-question";
    addText(fieldset, "legend", String(questionIndex + 1) + ". " + item.question);
    item.choices.forEach((choice, choiceIndex) => {
      const label = document.createElement("label");
      label.className = "quiz-choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "question-" + questionIndex;
      input.value = String(choiceIndex);
      input.required = true;
      label.append(input, document.createTextNode(" " + choice));
      fieldset.appendChild(label);
    });
    form.appendChild(fieldset);
  });
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Check my answers";
  form.appendChild(submit);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const answers = new FormData(form);
    let score = 0;
    const feedback = document.createElement("ol");
    quiz.forEach((item, index) => {
      const chosen = Number(answers.get("question-" + index));
      const correct = chosen === item.answer;
      if (correct) score += 1;
      const row = document.createElement("li");
      row.className = correct ? "correct-answer" : "incorrect-answer";
      row.textContent = (correct ? "Correct: " : "Review: ") + item.explanation;
      feedback.appendChild(row);
    });
    quizResult.textContent = "Your score: " + score + " out of " + quiz.length + ". " + (score === quiz.length ? "Excellent work!" : "Read the explanations, revisit the notes, and try again.");
    const oldFeedback = quizContent.querySelector(".quiz-feedback");
    if (oldFeedback) oldFeedback.remove();
    feedback.className = "quiz-feedback";
    quizContent.appendChild(feedback);
  });
  quizContent.appendChild(form);
}

function showLesson(moduleName) {
  clearLearningArea();
  const lesson = lessonCatalog[moduleName];
  addText(lessonContent, "h3", moduleName);
  if (!lesson) {
    addText(lessonContent, "p", "Detailed lesson notes for this module are being prepared. We are adding them in the order shown in the course list.");
    showQuiz([]);
    return;
  }
  addText(lessonContent, "p", lesson.introduction, "lesson-introduction");
  lesson.sections.forEach(section => {
    const article = document.createElement("article");
    article.className = "lesson-topic";
    addText(article, "h4", section.title);
    addText(article, "p", section.summary);
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Explore the detailed notes";
    details.appendChild(summary);
    section.detail.forEach(part => {
      addText(details, "h5", part.heading);
      addText(details, "p", part.text);
    });
    article.appendChild(details);
    lessonContent.appendChild(article);
  });
  showQuiz(lesson.quiz);
}

[...new Set(courseCatalog.map(entry => entry.faculty))].forEach(faculty => addOption(facultySelect, faculty, faculty));

facultySelect.addEventListener("change", () => {
  resetDropdown(programmeSelect, "Choose a programme");
  resetDropdown(levelSelect, "Choose a level and semester");
  moduleList.replaceChildren();
  moduleMessage.textContent = "Choose a programme and level to see its modules.";
  clearLearningArea();
  if (!facultySelect.value) return;
  getProgrammesForFaculty(facultySelect.value).forEach(programme => addOption(programmeSelect, programme.name, programme.name));
  programmeSelect.disabled = false;
});

programmeSelect.addEventListener("change", () => {
  resetDropdown(levelSelect, "Choose a level and semester");
  moduleList.replaceChildren();
  moduleMessage.textContent = "Choose a level and semester to see its modules.";
  clearLearningArea();
  if (!programmeSelect.value) return;
  getSelectedProgramme().levels.forEach(level => addOption(levelSelect, level.name, level.name));
  levelSelect.disabled = false;
});

levelSelect.addEventListener("change", () => {
  moduleList.replaceChildren();
  clearLearningArea();
  if (!levelSelect.value) {
    moduleMessage.textContent = "Choose a level and semester to see its modules.";
    return;
  }
  const programme = getSelectedProgramme();
  const level = programme.levels.find(item => item.name === levelSelect.value);
  moduleMessage.textContent = "Select a module to open its lesson and quiz.";
  level.modules.forEach(moduleName => {
    const moduleButton = document.createElement("button");
    moduleButton.type = "button";
    moduleButton.className = "module-button";
    moduleButton.textContent = moduleName;
    moduleButton.addEventListener("click", () => showLesson(moduleName));
    moduleList.appendChild(moduleButton);
  });
});
