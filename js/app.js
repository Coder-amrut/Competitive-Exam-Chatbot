/**
 * AI स्पर्धा परीक्षा स्टुडिओ - Main Application Controller
 * सर्व UI इव्हेंट्स, व्ह्यू स्विचर, ऑडिओ इफेक्ट्स, आणि कीबोर्ड शॉर्टकट्स
 */

document.addEventListener('DOMContentLoaded', () => {
    // Session & State
    const examSession = new ExamSession();
    let currentResults = null;
    let isSoundEnabled = true;

    // ==========================================
    // DOM Element References
    // ==========================================
    // Views
    const viewStudio = document.getElementById('viewStudio');
    const viewExam = document.getElementById('viewExam');
    const viewResult = document.getElementById('viewResult');
    const examStatusBadge = document.getElementById('examStatusBadge');

    // Studio Elements
    const presetChips = document.querySelectorAll('#presetChips .chip');
    const customSyllabusGroup = document.getElementById('customSyllabusGroup');
    const customSyllabusInput = document.getElementById('customSyllabusInput');
    const questionCountSelect = document.getElementById('questionCountSelect');
    const difficultySelect = document.getElementById('difficultySelect');
    const questionStyleSelect = document.getElementById('questionStyleSelect');
    const timerChips = document.querySelectorAll('#timerChips .chip');
    const customTimerRow = document.getElementById('customTimerRow');
    const customTimeInput = document.getElementById('customTimeInput');
    const toggleApiSettingsBtn = document.getElementById('toggleApiSettingsBtn');
    const apiSettingsDrawer = document.getElementById('apiSettingsDrawer');
    const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
    const startExamBtn = document.getElementById('startExamBtn');

    // Live Exam Room Elements
    const examSubjectTag = document.getElementById('examSubjectTag');
    const examDifficultyTag = document.getElementById('examDifficultyTag');
    const timerDisplay = document.getElementById('timerDisplay');
    const examTimerContainer = document.getElementById('examTimerContainer');
    const submitExamBtn = document.getElementById('submitExamBtn');
    const currentQNumBadge = document.getElementById('currentQNumBadge');
    const qCategoryTag = document.getElementById('qCategoryTag');
    const flagReviewBtn = document.getElementById('flagReviewBtn');
    const flagReviewText = document.getElementById('flagReviewText');
    const questionText = document.getElementById('questionText');
    const questionContext = document.getElementById('questionContext');
    const optionsContainer = document.getElementById('optionsContainer');
    const clearResponseBtn = document.getElementById('clearResponseBtn');
    const prevQuestionBtn = document.getElementById('prevQuestionBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const questionPaletteGrid = document.getElementById('questionPaletteGrid');
    const examProgressBar = document.getElementById('examProgressBar');
    const progressPercentText = document.getElementById('progressPercentText');
    const answeredRatioText = document.getElementById('answeredRatioText');
    const pauseExamBtn = document.getElementById('pauseExamBtn');

    // Palette Counts
    const legendAnsweredCount = document.getElementById('legendAnsweredCount');
    const legendMarkedCount = document.getElementById('legendMarkedCount');
    const legendUnansweredCount = document.getElementById('legendUnansweredCount');
    const legendNotVisitedCount = document.getElementById('legendNotVisitedCount');

    // Result Elements
    const resultHeading = document.getElementById('resultHeading');
    const resultSubheading = document.getElementById('resultSubheading');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const scorePercentDisplay = document.getElementById('scorePercentDisplay');
    const correctCountDisplay = document.getElementById('correctCountDisplay');
    const incorrectCountDisplay = document.getElementById('incorrectCountDisplay');
    const timeTakenDisplay = document.getElementById('timeTakenDisplay');
    const avgTimeDisplay = document.getElementById('avgTimeDisplay');
    const solutionsList = document.getElementById('solutionsList');
    const printReportBtn = document.getElementById('printReportBtn');
    const newExamBtn = document.getElementById('newExamBtn');
    const solutionFilterBtns = document.querySelectorAll('.solution-filters .chip');
    const filterAllCount = document.getElementById('filterAllCount');
    const filterIncorrectCount = document.getElementById('filterIncorrectCount');
    const filterCorrectCount = document.getElementById('filterCorrectCount');
    const filterUnansweredCount = document.getElementById('filterUnansweredCount');

    // Modals
    const confirmModal = document.getElementById('confirmModal');
    const modalTotalQ = document.getElementById('modalTotalQ');
    const modalAnsweredQ = document.getElementById('modalAnsweredQ');
    const modalUnansweredQ = document.getElementById('modalUnansweredQ');
    const modalMarkedQ = document.getElementById('modalMarkedQ');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalConfirmSubmitBtn = document.getElementById('modalConfirmSubmitBtn');
    const pauseModal = document.getElementById('pauseModal');
    const resumeExamBtn = document.getElementById('resumeExamBtn');

    // Sound toggle
    const soundToggleBtn = document.getElementById('soundToggleBtn');

    // Selected Studio Config State
    let selectedSubject = 'all';
    let selectedDurationMinutes = 10;

    // Gemini API Key State
    const DEFAULT_API_KEY = "";
    const savedApiKey = localStorage.getItem('marathi_ai_exam_api_key') || DEFAULT_API_KEY;
    if (savedApiKey) {
        geminiApiKeyInput.value = savedApiKey;
    }

    // ==========================================
    // Device-Free Universal PWA & Service Worker
    // ==========================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(() => {
                console.log('AI Exam Studio: ServiceWorker active for offline/device-free use');
            }).catch(err => {
                console.warn('ServiceWorker registration error:', err);
            });
        });
    }

    // PWA Install Prompt (Add to Home Screen / Desktop App)
    let deferredPrompt = null;
    const installAppBtn = document.getElementById('installAppBtn');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installAppBtn) installAppBtn.style.display = 'inline-flex';
    });
    if (installAppBtn) {
        installAppBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                if (choice.outcome === 'accepted') {
                    installAppBtn.style.display = 'none';
                }
                deferredPrompt = null;
            } else {
                alert("ॲप आधीच इन्स्टॉल केले आहे किंवा आपल्या ब्राउझर मेन्यूमधून 'Add to Home Screen' वर टॅप करा.");
            }
        });
    }

    // Mobile Palette Controls & Backdrop
    const mobilePaletteBtn = document.getElementById('mobilePaletteBtn');
    const mobilePaletteCloseBtn = document.getElementById('mobilePaletteCloseBtn');
    const paletteSidebar = document.getElementById('paletteSidebar');
    const paletteBackdrop = document.getElementById('paletteBackdrop');

    const closeMobilePalette = () => {
        if (paletteSidebar) paletteSidebar.classList.remove('mobile-open');
        if (paletteBackdrop) paletteBackdrop.classList.remove('active');
    };
    const openMobilePalette = () => {
        if (paletteSidebar) paletteSidebar.classList.add('mobile-open');
        if (paletteBackdrop) paletteBackdrop.classList.add('active');
    };

    if (mobilePaletteBtn) mobilePaletteBtn.addEventListener('click', openMobilePalette);
    if (mobilePaletteCloseBtn) mobilePaletteCloseBtn.addEventListener('click', closeMobilePalette);
    if (paletteBackdrop) paletteBackdrop.addEventListener('click', closeMobilePalette);

    // ==========================================
    // Web Audio Synthesizer (No external mp3 needed)
    // ==========================================
    const playTone = (freq, type = 'sine', duration = 0.1, gainVal = 0.08) => {
        if (!isSoundEnabled) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            // Ignore audio unlock restrictions
        }
    };

    const soundEffects = {
        click: () => playTone(600, 'triangle', 0.05, 0.05),
        select: () => playTone(880, 'sine', 0.08, 0.08),
        nav: () => playTone(520, 'sine', 0.06, 0.05),
        flag: () => playTone(740, 'triangle', 0.1, 0.07),
        warning: () => {
            playTone(440, 'sawtooth', 0.15, 0.1);
            setTimeout(() => playTone(440, 'sawtooth', 0.15, 0.1), 180);
        },
        fanfare: () => {
            setTimeout(() => playTone(523.25, 'triangle', 0.15, 0.1), 0);
            setTimeout(() => playTone(659.25, 'triangle', 0.15, 0.1), 150);
            setTimeout(() => playTone(783.99, 'triangle', 0.15, 0.1), 300);
            setTimeout(() => playTone(1046.50, 'triangle', 0.35, 0.15), 450);
        }
    };

    // Sound toggle event
    soundToggleBtn.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        soundToggleBtn.innerHTML = isSoundEnabled
            ? '<i class="fa-solid fa-volume-high"></i>'
            : '<i class="fa-solid fa-volume-xmark"></i>';
        if (isSoundEnabled) soundEffects.click();
    });

    // ==========================================
    // Studio Config Interactions
    // ==========================================
    // Preset subject selection
    presetChips.forEach(chip => {
        chip.addEventListener('click', () => {
            presetChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedSubject = chip.getAttribute('data-subject');
            soundEffects.click();

            if (selectedSubject === 'custom') {
                customSyllabusGroup.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                customSyllabusInput.focus();
            }
        });
    });

    // Timer chips selection
    timerChips.forEach(chip => {
        chip.addEventListener('click', () => {
            timerChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const timeVal = chip.getAttribute('data-time');
            soundEffects.click();

            if (timeVal === 'custom') {
                customTimerRow.style.display = 'flex';
                customTimeInput.focus();
                selectedDurationMinutes = parseInt(customTimeInput.value) || 15;
            } else {
                customTimerRow.style.display = 'none';
                selectedDurationMinutes = parseInt(timeVal);
            }
        });
    });

    customTimeInput.addEventListener('input', () => {
        const val = parseInt(customTimeInput.value);
        if (val && val > 0) {
            selectedDurationMinutes = val;
        }
    });

    // Toggle Live API Settings Drawer
    toggleApiSettingsBtn.addEventListener('click', () => {
        const isHidden = apiSettingsDrawer.style.display === 'none';
        apiSettingsDrawer.style.display = isHidden ? 'block' : 'none';
        soundEffects.click();
    });

    geminiApiKeyInput.addEventListener('change', () => {
        const key = geminiApiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('marathi_ai_exam_api_key', key);
        } else {
            localStorage.removeItem('marathi_ai_exam_api_key');
        }
    });

    // ==========================================
    // Start Exam Handler
    // ==========================================
    startExamBtn.addEventListener('click', async () => {
        const count = parseInt(questionCountSelect.value) || 10;
        const difficulty = difficultySelect.value;
        const style = questionStyleSelect.value;
        const customSyllabus = customSyllabusInput.value.trim();
        const apiKey = geminiApiKeyInput.value.trim();

        // Loading state
        startExamBtn.disabled = true;
        startExamBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> प्रश्न तयार करत आहे... (Generating Exam)';

        try {
            const questions = await AIEngine.generateExam({
                subject: selectedSubject,
                difficulty,
                style,
                count,
                customSyllabus,
                apiKey
            });

            if (!questions || questions.length === 0) {
                alert("क्षमस्व! प्रश्न तयार करता आले नाहीत. कृपया पर्याय तपासून पुन्हा प्रयत्न करा.");
                startExamBtn.disabled = false;
                startExamBtn.innerHTML = '<i class="fa-solid fa-play"></i> परीक्षा सुरू करा (Start Exam Now)';
                return;
            }

            // Launch Exam Session
            initiateExamUI(questions, selectedDurationMinutes);

        } catch (error) {
            console.error("Exam generation error:", error);
            alert("त्रुटी आली: " + (error.message || "प्रश्न लोड करता आले नाहीत."));
        } finally {
            startExamBtn.disabled = false;
            startExamBtn.innerHTML = '<i class="fa-solid fa-play"></i> परीक्षा सुरू करा (Start Exam Now)';
        }
    });

    /**
     * परीक्षा सुरू करणे व व्ह्यू बदलणे
     */
    function initiateExamUI(questions, durationMinutes) {
        examSession.init(questions, durationMinutes);

        // Update Exam Header Badges
        const subjectMeta = SUBJECT_MAP[selectedSubject] || { name: "स्पर्धा परीक्षा मॉक टेस्ट" };
        examSubjectTag.textContent = subjectMeta.name;
        examDifficultyTag.textContent = `पातळी: ${difficultySelect.options[difficultySelect.selectedIndex].text.split('(')[0].trim()}`;

        // Switch to Exam View
        switchView('exam');
        examStatusBadge.style.display = 'flex';

        // Timer Callbacks
        if (examSession.hasTimer) {
            examTimerContainer.style.display = 'flex';
            updateTimerDisplay(examSession.timeRemainingSeconds);

            examSession.onTick = (remainingSec) => {
                updateTimerDisplay(remainingSec);
            };

            examSession.onTimeUp = () => {
                soundEffects.warning();
                alert("वेळ संपली आहे! तुमची परीक्षा स्वयंचलित सबमिट केली जात आहे.");
                finishExam();
            };
        } else {
            examTimerContainer.style.display = 'none';
        }

        // Question Change Callback
        examSession.onQuestionChange = (index) => {
            renderCurrentQuestion();
            renderPalette();
            updateProgress();
        };

        // Render First Question & Palette
        renderCurrentQuestion();
        renderPalette();
        updateProgress();
    }

    /**
     * टायमर डिस्प्ले अद्ययावत करणे (mm:ss)
     */
    function updateTimerDisplay(totalSeconds) {
        if (totalSeconds < 0) totalSeconds = 0;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        timerDisplay.textContent = formatted;

        // Alerts under 5 mins and 2 mins
        examTimerContainer.classList.remove('timer-warning', 'timer-danger');
        if (totalSeconds <= 120) {
            examTimerContainer.classList.add('timer-danger');
            if (totalSeconds === 120 || totalSeconds === 60) {
                soundEffects.warning();
            }
        } else if (totalSeconds <= 300) {
            examTimerContainer.classList.add('timer-warning');
        }
    }

    /**
     * चालू प्रश्न रेंडर करणे
     */
    function renderCurrentQuestion() {
        const q = examSession.getCurrentQuestion();
        if (!q) return;

        const currentIdx = examSession.currentIndex;
        const totalQ = examSession.questions.length;

        // Header info
        currentQNumBadge.textContent = `प्रश्न क्रमांक ${currentIdx + 1} / ${totalQ}`;
        qCategoryTag.textContent = q.category || "सामान्य ज्ञान";

        // Review flag button state
        const isFlagged = examSession.isCurrentMarked();
        if (isFlagged) {
            flagReviewBtn.classList.add('active');
            flagReviewBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> खूण केली (Marked)';
        } else {
            flagReviewBtn.classList.remove('active');
            flagReviewBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i> खूण करा (Review)';
        }

        // Question text
        questionText.textContent = q.question;

        // Options rendering
        optionsContainer.innerHTML = '';
        const optionKeys = ['अ', 'ब', 'क', 'ड'];
        const selectedOpt = examSession.answers[q.id];

        q.options.forEach((optText, optIdx) => {
            const card = document.createElement('div');
            card.className = `option-card ${selectedOpt === optIdx ? 'selected' : ''}`;
            card.innerHTML = `
                <div class="option-key">${optionKeys[optIdx]}</div>
                <div class="option-text">${optText}</div>
            `;

            card.addEventListener('click', () => {
                examSession.selectAnswer(optIdx);
                soundEffects.select();
                if (navigator.vibrate) navigator.vibrate(20);
                renderCurrentQuestion();
                renderPalette();
                updateProgress();
            });

            optionsContainer.appendChild(card);
        });

        // Prev / Next button states
        prevQuestionBtn.disabled = currentIdx === 0;
        if (currentIdx === totalQ - 1) {
            nextQuestionBtn.innerHTML = 'शेवटचा प्रश्न <i class="fa-solid fa-check"></i>';
        } else {
            nextQuestionBtn.innerHTML = 'पुढील (Next) <i class="fa-solid fa-chevron-right"></i>';
        }
    }

    /**
     * प्रश्न तक्ता (Palette) रेंडर करणे
     */
    function renderPalette() {
        questionPaletteGrid.innerHTML = '';
        const total = examSession.questions.length;

        for (let i = 0; i < total; i++) {
            const btn = document.createElement('button');
            const status = examSession.getQuestionStatus(i);
            const isCurrent = i === examSession.currentIndex;

            btn.className = `palette-btn ${status} ${isCurrent ? 'current' : ''}`;
            btn.textContent = i + 1;
            btn.title = `प्रश्न क्र. ${i + 1}`;

            btn.addEventListener('click', () => {
                examSession.goToQuestion(i);
                soundEffects.nav();
                closeMobilePalette();
            });

            questionPaletteGrid.appendChild(btn);
        }

        // Update Legend Counts
        const summary = examSession.getSummary();
        legendAnsweredCount.textContent = summary.answered;
        legendMarkedCount.textContent = summary.marked;
        legendUnansweredCount.textContent = summary.unanswered;
        legendNotVisitedCount.textContent = summary.notVisited;
    }

    /**
     * प्रगती बार आणि प्रमाण अद्ययावत करणे
     */
    function updateProgress() {
        const summary = examSession.getSummary();
        const pct = Math.round((summary.answered / summary.total) * 100);

        examProgressBar.style.width = `${pct}%`;
        progressPercentText.textContent = `${pct}%`;
        answeredRatioText.textContent = `${summary.answered}/${summary.total} पूर्ण`;
    }

    // ==========================================
    // Question Navigation & Response Events
    // ==========================================
    nextQuestionBtn.addEventListener('click', () => {
        if (examSession.currentIndex < examSession.questions.length - 1) {
            examSession.next();
            soundEffects.nav();
        } else {
            openSubmitModal();
        }
    });

    prevQuestionBtn.addEventListener('click', () => {
        examSession.prev();
        soundEffects.nav();
    });

    clearResponseBtn.addEventListener('click', () => {
        examSession.clearCurrentAnswer();
        soundEffects.click();
        renderCurrentQuestion();
        renderPalette();
        updateProgress();
    });

    flagReviewBtn.addEventListener('click', () => {
        examSession.toggleFlagReview();
        soundEffects.flag();
        renderCurrentQuestion();
        renderPalette();
    });

    // ==========================================
    // Pause & Resume Handlers
    // ==========================================
    pauseExamBtn.addEventListener('click', () => {
        examSession.pauseTimer();
        pauseModal.style.display = 'flex';
        soundEffects.click();
    });

    resumeExamBtn.addEventListener('click', () => {
        examSession.resumeTimer();
        pauseModal.style.display = 'none';
        soundEffects.click();
    });

    // ==========================================
    // Submit Exam & Confirmation Modal
    // ==========================================
    function openSubmitModal() {
        const summary = examSession.getSummary();
        modalTotalQ.textContent = summary.total;
        modalAnsweredQ.textContent = summary.answered;
        modalUnansweredQ.textContent = summary.total - summary.answered;
        modalMarkedQ.textContent = summary.marked;

        confirmModal.style.display = 'flex';
        soundEffects.click();
    }

    submitExamBtn.addEventListener('click', openSubmitModal);

    modalCancelBtn.addEventListener('click', () => {
        confirmModal.style.display = 'none';
        soundEffects.click();
    });

    modalConfirmSubmitBtn.addEventListener('click', () => {
        confirmModal.style.display = 'none';
        finishExam();
    });

    /**
     * परीक्षा समाप्त करून निकाल तयार करणे
     */
    function finishExam() {
        currentResults = examSession.calculateResults();
        examStatusBadge.style.display = 'none';
        soundEffects.fanfare();

        renderResultView(currentResults);
        switchView('result');
    }

    /**
     * निकाल स्क्रीन (Result View) रेंडर करणे
     */
    function renderResultView(res) {
        // Heading & Performance feedback
        if (res.percentage >= 80) {
            resultHeading.textContent = "अत्यंत उत्कृष्ट कामगिरी! (Distinction)";
            resultSubheading.textContent = `अभिनंदन! आपण ${res.percentage}% गुणांसह स्पर्धा परीक्षेसाठी सज्ज आहात.`;
        } else if (res.percentage >= 60) {
            resultHeading.textContent = "छान प्रयत्न! (First Class)";
            resultSubheading.textContent = `आपली तयारी चांगली आहे. चुकलेल्या प्रश्नांचे स्पष्टीकरण वाचून अधिक सराव करा.`;
        } else {
            resultHeading.textContent = "अधिक सरावाची आवश्यकता! (Keep Practicing)";
            resultSubheading.textContent = `निराश होऊ नका! खालील सर्व प्रश्नांची अचूक उत्तरे व मराठी स्पष्टीकरण लक्षपूर्वक वाचा.`;
        }

        // Metrics
        scoreDisplay.textContent = `${res.finalScore} / ${res.total}`;
        scorePercentDisplay.textContent = `${res.percentage}% एकूण अचूकता`;
        correctCountDisplay.textContent = res.correct;
        incorrectCountDisplay.textContent = res.incorrect;

        // Time calculations
        const timeSec = res.timeSpentSec;
        const mins = Math.floor(timeSec / 60);
        const secs = timeSec % 60;
        timeTakenDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        avgTimeDisplay.textContent = `सरासरी ${res.avgTimePerQuestion} सेकंद / प्रश्न`;

        // Update Filter Badge Counts
        filterAllCount.textContent = res.total;
        filterCorrectCount.textContent = res.correct;
        filterIncorrectCount.textContent = res.incorrect;
        filterUnansweredCount.textContent = res.unattempted;

        // Render Detailed Solutions
        renderSolutionsList(res.detailedAnswers, 'all');
    }

    /**
     * प्रश्न व मराठी स्पष्टीकरणांची यादी (Detailed Answer Key)
     */
    function renderSolutionsList(answers, filter = 'all') {
        solutionsList.innerHTML = '';
        const optionKeys = ['(अ)', '(ब)', '(क)', '(ड)'];

        const filtered = answers.filter(item => {
            if (filter === 'correct') return item.isCorrect;
            if (filter === 'incorrect') return item.isAttempted && !item.isCorrect;
            if (filter === 'unanswered') return !item.isAttempted;
            return true;
        });

        if (filtered.length === 0) {
            solutionsList.innerHTML = `
                <div class="text-center" style="padding: 40px; color: var(--text-secondary);">
                    <i class="fa-solid fa-filter" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    या फिल्टरमध्ये कोणतेही प्रश्न उपलब्ध नाहीत.
                </div>
            `;
            return;
        }

        filtered.forEach(item => {
            const card = document.createElement('div');
            let itemClass = 'unanswered-item';
            let badgeText = 'सोडवले नाही';
            let badgeClass = 'badge-unanswered';

            if (item.isAttempted) {
                if (item.isCorrect) {
                    itemClass = 'correct-item';
                    badgeText = 'बरोबर (+१ गुण)';
                    badgeClass = 'badge-correct';
                } else {
                    itemClass = 'incorrect-item';
                    badgeText = 'चूक (-०.२५ ऋण)';
                    badgeClass = 'badge-incorrect';
                }
            }

            card.className = `solution-card ${itemClass}`;

            // Options HTML
            const optionsHtml = item.question.options.map((optText, optIdx) => {
                const isUserPicked = item.userAnswer === optIdx;
                const isCorrect = item.correctAnswer === optIdx;

                let optClass = '';
                let statusIcon = '';

                if (isCorrect && isUserPicked) {
                    optClass = 'is-both';
                    statusIcon = '<i class="fa-solid fa-circle-check text-emerald"></i> (तुमचे योग्य उत्तर)';
                } else if (isCorrect) {
                    optClass = 'is-correct-answer';
                    statusIcon = '<i class="fa-solid fa-circle-check text-emerald"></i> (योग्य उत्तर)';
                } else if (isUserPicked) {
                    optClass = 'is-user-picked';
                    statusIcon = '<i class="fa-solid fa-circle-xmark text-rose"></i> (तुम्ही निवडलेले)';
                }

                return `
                    <div class="sol-opt ${optClass}">
                        <strong>${optionKeys[optIdx]}</strong> ${optText} ${statusIcon}
                    </div>
                `;
            }).join('');

            card.innerHTML = `
                <div class="sol-header">
                    <span class="sol-badge ${badgeClass}">${badgeText}</span>
                    <span style="font-size: 0.85rem; color: var(--text-secondary);">प्रश्न क्र. ${item.qIndex} • ${item.question.category || 'स्पर्धा परीक्षा'}</span>
                </div>
                <div class="sol-question">${item.question.question}</div>
                <div class="sol-options-grid">${optionsHtml}</div>
                <div class="sol-explanation-box">
                    <div class="sol-explanation-title">
                        <i class="fa-solid fa-lightbulb"></i> मराठीत सविस्तर स्पष्टीकरण व नियम:
                    </div>
                    <div class="sol-explanation-text">${item.explanation || "या प्रश्नाचे उत्तर अधिकृत उत्तरतालिकेनुसार प्रमाणित आहे."}</div>
                </div>
            `;

            solutionsList.appendChild(card);
        });
    }

    // Filter clicks
    solutionFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            solutionFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            soundEffects.click();
            if (currentResults) {
                renderSolutionsList(currentResults.detailedAnswers, filter);
            }
        });
    });

    // Print / PDF Button
    printReportBtn.addEventListener('click', () => {
        window.print();
    });

    // Take New Exam
    newExamBtn.addEventListener('click', () => {
        switchView('studio');
        soundEffects.click();
    });

    // ==========================================
    // Keyboard Shortcuts (1-4, A-D, Arrows, F)
    // ==========================================
    document.addEventListener('keydown', (e) => {
        if (!viewExam.classList.contains('active')) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Keys 1, 2, 3, 4
        if (['1', '2', '3', '4'].includes(e.key)) {
            const optIdx = parseInt(e.key) - 1;
            examSession.selectAnswer(optIdx);
            soundEffects.select();
            renderCurrentQuestion();
            renderPalette();
            updateProgress();
        }
        // Right arrow or N for Next
        else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
            if (examSession.currentIndex < examSession.questions.length - 1) {
                examSession.next();
                soundEffects.nav();
            }
        }
        // Left arrow or P for Prev
        else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
            examSession.prev();
            soundEffects.nav();
        }
        // F for Flag
        else if (e.key.toLowerCase() === 'f') {
            examSession.toggleFlagReview();
            soundEffects.flag();
            renderCurrentQuestion();
            renderPalette();
        }
    });

    // ==========================================
    // View Switcher Helper
    // ==========================================
    function switchView(viewName) {
        viewStudio.classList.remove('active');
        viewExam.classList.remove('active');
        viewResult.classList.remove('active');

        if (viewName === 'studio') {
            viewStudio.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (viewName === 'exam') {
            viewExam.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (viewName === 'result') {
            viewResult.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
});
