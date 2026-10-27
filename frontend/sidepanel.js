
document.addEventListener("DOMContentLoaded", () => {
    const notes = document.getElementById("notes");
    const results = document.getElementById("results");
    const resultSubtitle = document.getElementById("resultSubtitle");
    const notesStatus = document.getElementById("notesStatus");

    let currentQuiz = null;

    // Restore saved notes.
    chrome.storage.local.get(
        ["researchNotes", "quizHistory"],
        (data) => {
            notes.value = data.researchNotes || "";
        }
    );

    document.getElementById("summarizeBtn")
        .addEventListener("click", () => processSelectedText("summarize"));

    document.getElementById("analyzeBtn")
        .addEventListener("click", () => processSelectedText("analyzeGaps"));

    document.getElementById("quizBtn")
        .addEventListener("click", () => processSelectedText("generateQuiz"));

    document.getElementById("saveNotesBtn")
        .addEventListener("click", saveNotes);

    document.getElementById("clearNotesBtn")
        .addEventListener("click", clearNotes);

    async function getSelectedText() {
        const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (!tabs.length || !tabs[0].id) {
            throw new Error("No active browser tab was found.");
        }

        const response = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => window.getSelection()?.toString().trim() || ""
        });

        return response?.[0]?.result || "";
    }

    async function processSelectedText(operation) {
        setLoading("Processing your selected text...");

        try {
            const selectedText = await getSelectedText();

            if (!selectedText) {
                showError(
                    "No text selected. Select text on a webpage first, then try again."
                );
                return;
            }

            const response = await fetch(
                "https://research-assistant-api-6iym.onrender.com/api/research/process",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        content: selectedText,
                        operation: operation
                    })
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Backend returned HTTP " + response.status
                );
            }

            const responseText = await response.text();

            if (operation === "generateQuiz") {
                let quiz;

                try {
                    quiz = JSON.parse(responseText);
                } catch {
                    throw new Error(
                        "The AI did not return valid quiz JSON. Please try again."
                    );
                }

                if (!Array.isArray(quiz.questions) ||
                    quiz.questions.length === 0) {
                    throw new Error(
                        "The generated quiz contains no questions."
                    );
                }

                currentQuiz = quiz;
                renderQuiz(quiz);
            } else {
                showTextResult(
                    operation === "summarize"
                        ? "Summary"
                        : "Research Gaps & Limitations",
                    responseText
                );
            }
        } catch (error) {
            showError(
                error.message ||
                "Something went wrong. Check that the backend is running."
            );
        }
    }

    function setLoading(message) {
        resultSubtitle.textContent = message;
        results.replaceChildren();

        const loading = document.createElement("p");
        loading.className = "empty-state";
        loading.textContent = "⏳ " + message;
        results.appendChild(loading);
    }

    // Format basic Markdown safely.
    function appendFormattedText(parent, value) {
        const parts = value.split(/(\*\*.*?\*\*)/g);

        parts.forEach(part => {
            if (part.startsWith("**") && part.endsWith("**")) {
                const strong = document.createElement("strong");
                strong.textContent = part.slice(2, -2);
                parent.appendChild(strong);
            } else {
                parent.appendChild(document.createTextNode(part));
            }
        });
    }

    function showTextResult(title, text) {
        resultSubtitle.textContent = title;
        results.replaceChildren();

        const block = document.createElement("div");
        block.className = "result-block formatted-result";

        const heading = document.createElement("h3");
        heading.className = "result-title";
        heading.textContent = title;
        block.appendChild(heading);

        // Normalize common Markdown headings and inline sections.
        const normalized = text
            .replace(/\r\n/g, "\n")
            .replace(/[ \t]+(#{1,3}\s+)/g, "\n$1")
            .replace(
                /[ \t]+(\d+\.\s+\*?\*?[^*\n]+:\*?\*?)/g,
                "\n$1"
            );

        const lines = normalized.split("\n");
        let list = null;
        let listType = null;

        function closeList() {
            if (list) {
                block.appendChild(list);
                list = null;
                listType = null;
            }
        }

        lines.forEach(rawLine => {
            const line = rawLine.trim();

            if (!line) {
                closeList();
                return;
            }

            // Markdown headings: #, ##, ###
            const headingMatch = line.match(/^#{1,3}\s+(.+)/);

            if (headingMatch) {
                closeList();

                const subheading = document.createElement("h4");
                appendFormattedText(subheading, headingMatch[1]);
                block.appendChild(subheading);
                return;
            }

            // Bulleted list.
            const bulletMatch = line.match(/^[-*•]\s+(.+)/);

            if (bulletMatch) {
                if (!list || listType !== "ul") {
                    closeList();
                    list = document.createElement("ul");
                    listType = "ul";
                }

                const item = document.createElement("li");
                appendFormattedText(item, bulletMatch[1]);
                list.appendChild(item);
                return;
            }

            // Numbered list.
            const numberedMatch = line.match(/^\d+[.)]\s+(.+)/);

            if (numberedMatch) {
                if (!list || listType !== "ol") {
                    closeList();
                    list = document.createElement("ol");
                    listType = "ol";
                }

                const item = document.createElement("li");
                appendFormattedText(item, numberedMatch[1]);
                list.appendChild(item);
                return;
            }

            closeList();

            const paragraph = document.createElement("p");
            appendFormattedText(paragraph, line);
            block.appendChild(paragraph);
        });

        closeList();
        results.appendChild(block);
    }

    function showError(message) {
        resultSubtitle.textContent = "Unable to complete the request";
        results.replaceChildren();

        const error = document.createElement("div");
        error.className = "error-message";
        error.textContent = message;

        results.appendChild(error);
    }

    function renderQuiz(quiz) {
        resultSubtitle.textContent = quiz.title || "Active Recall Quiz";
        results.replaceChildren();

        const form = document.createElement("form");
        form.id = "quizForm";

        quiz.questions.forEach((question, index) => {
            const card = document.createElement("div");
            card.className = "quiz-question";

            const heading = document.createElement("h3");
            heading.textContent = `${index + 1}. ${question.question}`;
            card.appendChild(heading);

            if (!Array.isArray(question.options)) {
                return;
            }

            question.options.forEach((option, optionIndex) => {
                const label = document.createElement("label");
                label.className = "quiz-option";

                const radio = document.createElement("input");
                radio.type = "radio";
                radio.name = `question-${index}`;
                radio.value = String(optionIndex);
                radio.required = true;

                const optionText = document.createElement("span");
                optionText.textContent = option;

                label.append(radio, optionText);
                card.appendChild(label);
            });

            const feedback = document.createElement("div");
            feedback.className = "quiz-feedback";
            feedback.hidden = true;
            feedback.id = `feedback-${index}`;
            card.appendChild(feedback);

            form.appendChild(card);
        });

        const submit = document.createElement("button");
        submit.type = "submit";
        submit.className = "check-answers-button";
        submit.textContent = "Check Answers";

        form.appendChild(submit);

        form.addEventListener("submit", event => {
            event.preventDefault();
            gradeQuiz(form, quiz);
        });

        results.appendChild(form);
    }

    function gradeQuiz(form, quiz) {
        let score = 0;
        const incorrectTopics = [];

        quiz.questions.forEach((question, index) => {
            const selected = form.querySelector(
                `input[name="question-${index}"]:checked`
            );

            const feedback = document.getElementById(`feedback-${index}`);
            const selectedIndex = selected ? Number(selected.value) : -1;
            const correct = Number(question.correctAnswer);
            const isCorrect = selectedIndex === correct;

            if (isCorrect) {
                score++;
            } else {
                incorrectTopics.push(question.topic || question.question);
            }

            feedback.hidden = false;
            feedback.textContent =
                (isCorrect ? "Correct! " : "Incorrect. ") +
                "Answer: " +
                (question.options?.[correct] ?? "Unavailable") +
                ". " +
                (question.explanation || "");

            form.querySelectorAll(`input[name="question-${index}"]`)
                .forEach(input => {
                    input.disabled = true;
                });
        });

        const submit = form.querySelector("button[type='submit']");
        submit.disabled = true;
        submit.textContent = `Score: ${score} / ${quiz.questions.length}`;

        chrome.storage.local.get(["quizHistory"], data => {
            const history = Array.isArray(data.quizHistory)
                ? data.quizHistory
                : [];

            history.push({
                date: new Date().toISOString(),
                score,
                total: quiz.questions.length,
                incorrectTopics
            });

            chrome.storage.local.set({ quizHistory: history });
        });
    }

    function saveNotes() {
        chrome.storage.local.set(
            { researchNotes: notes.value },
            () => {
                notesStatus.textContent = "Notes saved successfully!";

                setTimeout(() => {
                    notesStatus.textContent = "";
                }, 2500);
            }
        );
    }

    function clearNotes() {
        notes.value = "";

        chrome.storage.local.set(
            { researchNotes: "" },
            () => {
                notesStatus.textContent = "Notes cleared.";

                setTimeout(() => {
                    notesStatus.textContent = "";
                }, 2500);
            }
        );
    }
});
