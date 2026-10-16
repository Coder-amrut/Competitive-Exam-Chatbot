/**
 * AI स्पर्धा परीक्षा स्टुडिओ - AI Question Generator Engine
 * अंगभूत स्मार्ट जनरेटर + लाइव्ह Gemini API सपोर्ट
 */
const AIEngine = {
    DEFAULT_API_KEY: "",

    /**
     * मुख्य जनरेशन फंक्शन: विषयानुसार, काठिण्यपातळीनुसार व संख्येनुसार प्रश्न तयार करते
     */
    async generateExam({ subject, difficulty, style, count, customSyllabus, apiKey }) {
        let questions = [];
        const activeKey = (apiKey && apiKey.trim().length > 5) ? apiKey.trim() : this.DEFAULT_API_KEY;

        // १. जर Gemini API की उपलब्ध असेल तर लाइव्ह AI कॉल करा
        if (activeKey && (subject === 'custom' || (customSyllabus && customSyllabus.trim().length > 0))) {
            try {
                const liveQuestions = await this.callGeminiAPI({
                    apiKey: activeKey,
                    syllabus: customSyllabus || SUBJECT_MAP[subject]?.name || subject,
                    difficulty,
                    count
                });
                if (liveQuestions && liveQuestions.length > 0) {
                    return liveQuestions;
                }
            } catch (err) {
                console.warn("Live Gemini API call failed, falling back to smart built-in engine:", err);
            }
        }

        // २. जर 'custom' विषय निवडला असेल आणि API की नसेल, तरीही स्मार्ट टेक्स्ट विश्लेषणाने प्रश्न बनवा
        if (subject === 'custom' && customSyllabus && customSyllabus.trim().length > 0) {
            const customGenerated = this.synthesizeFromCustomText(customSyllabus, count, difficulty);
            questions = customGenerated;
        } else {
            // ३. अंगभूत प्रश्नसंचातून फिल्टर करा
            let pool = [...QUESTION_BANK];

            if (subject !== 'all') {
                pool = pool.filter(q => q.subject === subject);
            }

            if (difficulty !== 'all') {
                pool = pool.filter(q => q.difficulty === difficulty);
            }

            if (style !== 'all') {
                pool = pool.filter(q => q.style === style);
            }

            // जर फिल्टरनंतर पुरेसे प्रश्न नसतील, तर विषयातील इतर प्रश्नांनी पूर्तता करा
            if (pool.length < count) {
                const fallbackPool = QUESTION_BANK.filter(q => subject === 'all' || q.subject === subject);
                pool = [...new Set([...pool, ...fallbackPool])];
            }

            // ४. अंकगणित आणि बुद्धिमत्तेसाठी डायनॅमिक जनरेटर जोडून अमर्याद प्रश्न पुरवा
            if (pool.length < count || subject === 'maths_reasoning') {
                const proceduralQs = this.generateProceduralMathQuestions(count - pool.length);
                pool.push(...proceduralQs);
            }

            // ५. शफल करा आणि आवश्यक संख्येइतके निवडा
            this.shuffleArray(pool);
            questions = pool.slice(0, count);
        }

        // ६. प्रत्येक प्रश्नाचे पर्याय शफल करा जेणेकरून उत्तर नेहमी एकाच क्रमांकावर येणार नाही
        return questions.map((q, idx) => {
            const optionsWithMeta = q.options.map((opt, i) => ({ text: opt, isCorrect: i === q.correct }));
            this.shuffleArray(optionsWithMeta);

            const newCorrectIdx = optionsWithMeta.findIndex(o => o.isCorrect);
            return {
                ...q,
                displayId: idx + 1,
                options: optionsWithMeta.map(o => o.text),
                correct: newCorrectIdx
            };
        });
    },

    /**
     * सानुकूल मजकूर / नोट्समधून मराठी वस्तुनिष्ठ प्रश्न तयार करणारे अल्गोरिदम
     */
    synthesizeFromCustomText(text, count, difficulty) {
        const sentences = text.split(/[।\.\n\?\!]/).map(s => s.trim()).filter(s => s.length > 15);
        const generated = [];

        // जर युझरने दिलेल्या मजकुरात अनेक वाक्ये असतील:
        for (let i = 0; i < Math.min(sentences.length, count); i++) {
            const sentence = sentences[i];
            const words = sentence.split(/\s+/).filter(w => w.length > 3);
            
            if (words.length >= 3) {
                // वाक्यातील एक महत्त्वाचा शब्द निवडून गाळलेली जागा / प्रश्न बनवा
                const targetWord = words[Math.floor(words.length / 2)];
                const blankSentence = sentence.replace(targetWord, "________");

                // पर्यायी उत्तरे तयार करा
                const distractors = ["विधान १ व २", "सर्व पर्याय", "यापैकी नाही", "अतिरिक्त माहिती"];
                const options = [targetWord, ...distractors.slice(0, 3)];
                this.shuffleArray(options);

                generated.push({
                    id: `custom_${Date.now()}_${i}`,
                    subject: "custom",
                    difficulty: difficulty === 'all' ? 'medium' : difficulty,
                    style: "direct",
                    category: "दिलेल्या अभ्यासानुसार प्रश्न",
                    question: `खालील वाक्यातील रिकाम्या जागी योग्य पर्याय निवडा:\n"${blankSentence}"`,
                    options: options,
                    correct: options.indexOf(targetWord),
                    explanation: `दिलेल्या अभ्यासक्रमानुसार योग्य विधान असे आहे: "${sentence}"`
                });
            }
        }

        // जर पुरेसे प्रश्न तयार झाले नसतील तर जनरल स्पर्धा परीक्षा प्रश्न जोडून बॅकअप द्या
        if (generated.length < count) {
            const extraCount = count - generated.length;
            const extra = QUESTION_BANK.slice(0, extraCount);
            generated.push(...extra);
        }

        return generated;
    },

    /**
     * अंकगणित आणि बुद्धिमत्तेचे स्वयंचलित (Procedural) प्रश्न तयार करणारे इंजिन
     */
    generateProceduralMathQuestions(count) {
        const dynamicList = [];
        for (let i = 0; i < count; i++) {
            const type = i % 3;
            if (type === 0) {
                // नफा-तोटा प्रश्न
                const cp = (Math.floor(Math.random() * 8) + 2) * 100; // 200 - 900
                const profitPct = [10, 15, 20, 25, 30][Math.floor(Math.random() * 5)];
                const profit = (cp * profitPct) / 100;
                const sp = cp + profit;

                const correctAns = `₹${sp}`;
                const options = [
                    `₹${sp}`,
                    `₹${sp + 20}`,
                    `₹${sp - 30}`,
                    `₹${sp + 50}`
                ];
                this.shuffleArray(options);

                dynamicList.push({
                    id: `dyn_math_${Date.now()}_${i}`,
                    subject: "maths_reasoning",
                    difficulty: "medium",
                    style: "practical",
                    category: "अंकगणित - नफा तोटा",
                    question: `एका व्यापाऱ्याने एक वस्तू ₹${cp} ला खरेदी करून ती ${profitPct}% नफ्याने विकली, तर त्या वस्तूची विक्री किंमत किती?`,
                    options: options,
                    correct: options.indexOf(correctAns),
                    explanation: `विक्री किंमत = खरेदी किंमत + नफा = ${cp} + (${cp} × ${profitPct}/100) = ${cp} + ${profit} = ₹${sp}.`
                });
            } else if (type === 1) {
                // संख्या मालिका प्रश्न
                const start = Math.floor(Math.random() * 5) + 2;
                const diff = Math.floor(Math.random() * 4) + 3;
                const seq = [start, start + diff, start + (diff * 2), start + (diff * 3)];
                const nextVal = start + (diff * 4);

                const correctAns = `${nextVal}`;
                const options = [
                    `${nextVal}`,
                    `${nextVal + 2}`,
                    `${nextVal - 3}`,
                    `${nextVal + 5}`
                ];
                this.shuffleArray(options);

                dynamicList.push({
                    id: `dyn_reasoning_${Date.now()}_${i}`,
                    subject: "maths_reasoning",
                    difficulty: "easy",
                    style: "practical",
                    category: "बुद्धिमत्ता - मालिका",
                    question: `खालील संख्या मालिकेतील पुढील पद शोधा:\n${seq.join(', ')}, ?`,
                    options: options,
                    correct: options.indexOf(correctAns),
                    explanation: `या मालिकेत प्रत्येक संख्येत +${diff} ची वाढ होत आहे. म्हणून ${seq[seq.length - 1]} + ${diff} = ${nextVal}.`
                });
            } else {
                // सरासरी प्रश्न
                const a = Math.floor(Math.random() * 10) + 10;
                const b = a + 5;
                const c = b + 5;
                const avg = (a + b + c) / 3;

                const correctAns = `${avg}`;
                const options = [
                    `${avg}`,
                    `${avg + 2}`,
                    `${avg - 1}`,
                    `${avg + 4}`
                ];
                this.shuffleArray(options);

                dynamicList.push({
                    id: `dyn_avg_${Date.now()}_${i}`,
                    subject: "maths_reasoning",
                    difficulty: "easy",
                    style: "practical",
                    category: "अंकगणित - सरासरी",
                    question: `${a}, ${b} आणि ${c} या संख्यांची सरासरी किती असेल?`,
                    options: options,
                    correct: options.indexOf(correctAns),
                    explanation: `सरासरी = (घटकांची बेरीज) / एकूण संख्या = (${a} + ${b} + ${c}) / ३ = ${a + b + c} / ३ = ${avg}.`
                });
            }
        }
        return dynamicList;
    },

    /**
     * लाइव्ह Google Gemini API कॉल (API की द्वारे)
     */
    async callGeminiAPI({ apiKey, syllabus, difficulty, count }) {
        // Try multiple standard endpoints for Gemini
        const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
        let lastError = null;

        for (const model of models) {
            try {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const promptText = `You are a high-level exam paper setter for MPSC and Maharashtra State Competitive Exams (Police Bharti, Talathi, Zilla Parishad).
Create exactly ${count} multiple choice questions (MCQs) in pure Marathi based on the following syllabus/topic: "${syllabus}".
Difficulty level: ${difficulty}.

Return STRICTLY a JSON array matching this exact schema with no extra markdown or text:
[
  {
    "id": "gemini_1",
    "subject": "custom",
    "difficulty": "${difficulty}",
    "style": "direct",
    "category": "स्पर्धा परीक्षा प्रश्न",
    "question": "प्रश्न मराठीमध्ये येथे लिहा",
    "options": ["पर्याय १", "पर्याय २", "पर्याय ३", "पर्याय ४"],
    "correct": 0,
    "explanation": "या प्रश्नाचे उत्तर का बरोबर आहे याचे सविस्तर मराठी स्पष्टीकरण."
  }
]
Note: "correct" must be an integer index (0, 1, 2, or 3) indicating which option is correct.`;

                const headers = {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                };

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: promptText }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topP: 0.95
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (candidateText) {
                        let cleaned = candidateText.replace(/```json/gi, '').replace(/```/g, '').trim();
                        const parsed = JSON.parse(cleaned);

                        if (Array.isArray(parsed) && parsed.length > 0) {
                            return parsed;
                        }
                    }
                } else {
                    lastError = new Error(`Gemini ${model} returned HTTP ${response.status}`);
                }
            } catch (err) {
                lastError = err;
            }
        }

        throw lastError || new Error("Failed to generate questions with AI API");
    },

    /**
     * फिशर-येट्स अरे शफल
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};
