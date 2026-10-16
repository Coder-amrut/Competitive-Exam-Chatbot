/**
 * AI स्पर्धा परीक्षा स्टुडिओ - Exam Session & Engine
 * रिअल-टाईम टायमर, प्रश्न तक्ता (Palette), मार्क/अनमार्क, आणि स्कोरिंग
 */

class ExamSession {
    constructor() {
        this.questions = [];
        this.currentIndex = 0;
        this.answers = {}; // { [qId]: optionIndex }
        this.visited = new Set();
        this.markedForReview = new Set();
        
        // Timer
        this.durationMinutes = 10;
        this.timeRemainingSeconds = 600;
        this.timerInterval = null;
        this.isPaused = false;
        this.hasTimer = true;
        this.startTime = null;
        this.endTime = null;

        // Callback hooks
        this.onTick = null;
        this.onTimeUp = null;
        this.onQuestionChange = null;
    }

    /**
     * नवीन परीक्षा सत्र सुरू करा
     */
    init(questions, durationMinutes = 10) {
        this.questions = questions;
        this.currentIndex = 0;
        this.answers = {};
        this.visited = new Set([0]); // पहिला प्रश्न पाहिला
        this.markedForReview = new Set();
        this.durationMinutes = durationMinutes;
        this.hasTimer = durationMinutes > 0;
        this.timeRemainingSeconds = durationMinutes * 60;
        this.isPaused = false;
        this.startTime = new Date();
        this.endTime = null;

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        if (this.hasTimer) {
            this.startTimer();
        }
    }

    /**
     * टायमर चालू करा
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.isPaused) return;

            this.timeRemainingSeconds--;

            if (this.onTick) {
                this.onTick(this.timeRemainingSeconds);
            }

            if (this.timeRemainingSeconds <= 0) {
                clearInterval(this.timerInterval);
                if (this.onTimeUp) {
                    this.onTimeUp();
                }
            }
        }, 1000);
    }

    pauseTimer() {
        this.isPaused = true;
    }

    resumeTimer() {
        this.isPaused = false;
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    getCurrentQuestion() {
        return this.questions[this.currentIndex];
    }

    goToQuestion(index) {
        if (index >= 0 && index < this.questions.length) {
            this.currentIndex = index;
            this.visited.add(index);
            if (this.onQuestionChange) {
                this.onQuestionChange(this.currentIndex);
            }
        }
    }

    next() {
        if (this.currentIndex < this.questions.length - 1) {
            this.goToQuestion(this.currentIndex + 1);
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.goToQuestion(this.currentIndex - 1);
        }
    }

    selectAnswer(optionIndex) {
        const currentQ = this.getCurrentQuestion();
        if (!currentQ) return;
        this.answers[currentQ.id] = optionIndex;
    }

    clearCurrentAnswer() {
        const currentQ = this.getCurrentQuestion();
        if (!currentQ) return;
        delete this.answers[currentQ.id];
    }

    toggleFlagReview() {
        const currentQ = this.getCurrentQuestion();
        if (!currentQ) return;
        if (this.markedForReview.has(currentQ.id)) {
            this.markedForReview.delete(currentQ.id);
        } else {
            this.markedForReview.add(currentQ.id);
        }
    }

    isCurrentMarked() {
        const currentQ = this.getCurrentQuestion();
        return currentQ ? this.markedForReview.has(currentQ.id) : false;
    }

    /**
     * प्रश्न तक्त्यातील (Palette) स्थिती तपासणे
     * States: 'answered', 'marked', 'unanswered', 'not-visited'
     */
    getQuestionStatus(index) {
        const q = this.questions[index];
        if (!q) return 'not-visited';

        const hasAnswer = this.answers[q.id] !== undefined;
        const isMarked = this.markedForReview.has(q.id);
        const isVisited = this.visited.has(index);

        if (isMarked) {
            return 'marked';
        }
        if (hasAnswer) {
            return 'answered';
        }
        if (isVisited) {
            return 'unanswered';
        }
        return 'not-visited';
    }

    /**
     * थेट सारांश आकडेवारी
     */
    getSummary() {
        const total = this.questions.length;
        let answered = 0;
        let marked = 0;
        let unanswered = 0;
        let notVisited = 0;

        this.questions.forEach((q, idx) => {
            const status = this.getQuestionStatus(idx);
            if (this.answers[q.id] !== undefined) answered++;
            if (this.markedForReview.has(q.id)) marked++;
            if (status === 'unanswered') unanswered++;
            if (status === 'not-visited') notVisited++;
        });

        return {
            total,
            answered,
            marked,
            unanswered,
            notVisited
        };
    }

    /**
     * परीक्षेचा निकाल व गुण मोजणी (स्पर्धा परीक्षा ०.२५ ऋण गुण पॅटर्न)
     */
    calculateResults() {
        this.endTime = new Date();
        this.stopTimer();

        let correct = 0;
        let incorrect = 0;
        let unattempted = 0;
        const total = this.questions.length;
        const detailedAnswers = [];

        this.questions.forEach((q, idx) => {
            const userAnswer = this.answers[q.id];
            const isAttempted = userAnswer !== undefined;
            const isCorrect = isAttempted && userAnswer === q.correct;

            if (!isAttempted) {
                unattempted++;
            } else if (isCorrect) {
                correct++;
            } else {
                incorrect++;
            }

            detailedAnswers.push({
                question: q,
                qIndex: idx + 1,
                userAnswer: userAnswer,
                correctAnswer: q.correct,
                isCorrect: isCorrect,
                isAttempted: isAttempted,
                explanation: q.explanation
            });
        });

        // ०.२५ नकारात्मक गुण (Negative Marking standard MPSC pattern)
        const rawScore = correct * 1;
        const negativeMarks = incorrect * 0.25;
        const finalScore = Math.max(0, +(rawScore - negativeMarks).toFixed(2));
        const percentage = +((correct / total) * 100).toFixed(1);

        // वेळेची मोजणी
        const timeSpentSec = this.hasTimer 
            ? (this.durationMinutes * 60) - Math.max(0, this.timeRemainingSeconds)
            : Math.floor((this.endTime - this.startTime) / 1000);

        const avgTimePerQuestion = total > 0 ? Math.round(timeSpentSec / total) : 0;

        return {
            total,
            correct,
            incorrect,
            unattempted,
            rawScore,
            negativeMarks,
            finalScore,
            percentage,
            timeSpentSec,
            avgTimePerQuestion,
            detailedAnswers
        };
    }
}
