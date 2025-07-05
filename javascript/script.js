// Global Navigation Function 
function navigateTo(page) {
    window.location.href = page;
}

// mock db manager
const entryManager = {
    getTodayDate: () => new Date(),
    getTodayDateString: function() {
        const today = this.getTodayDate();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    getEntries: function() { const e = localStorage.getItem('moodJournalEntries'); return e ? JSON.parse(e) : []; },
    saveEntry: function(entryData) {
        const entries = this.getEntries();
        const existingIndex = entries.findIndex(e => e.date === entryData.date);
        if (existingIndex > -1) { entries[existingIndex] = entryData; } else { entries.push(entryData); }
        entries.sort((a, b) => new Date(a.date) - new Date(b.date));
        localStorage.setItem('moodJournalEntries', JSON.stringify(entries));
    },
    getEntryByDate: function(dateString) { return this.getEntries().find(e => e.date === dateString); },
    getMostRecentEntryDate: function() {
        const entries = this.getEntries();
        if (entries.length === 0) return this.getTodayDate();
        return new Date(entries[entries.length - 1].date + 'T12:00:00Z');
    },
    seedMockData: function() {
        if (localStorage.getItem('moodJournalEntries')) return;
        const mockEntries = [
            { date: '2025-07-01', mood: '🙂', context: 'Amicizia', reflectionType: 'free', reflectionContent: 'Bella serata con gli amici. Ci voleva.' },
            { date: '2025-07-02', mood: '😕', context: 'Lavoro', reflectionType: 'free', reflectionContent: 'Un sacco di scadenze, mi sento sopraffatto.' },
            { date: '2025-07-04', mood: '😁', context: 'Amore', reflectionType: 'guided', reflectionContent: [
                { question: 'Se la tua energia di oggi fosse un colore, quale sarebbe e perché?', answer: 'Rosso brillante! Pieno di passione e felicità.' }
            ]}
        ];
        mockEntries.forEach(entry => this.saveEntry(entry));
    }
};

// Page Initializers
document.addEventListener('DOMContentLoaded', () => {
    entryManager.seedMockData();
    const pageId = document.querySelector('.main-content')?.id;
    switch (pageId) {
        case 'loginPageContent': initLoginPage(); break;
        case 'registerPageContent': initRegisterPage(); break;
        case 'homePage': initHomePage(); break;
        // initSavedHomePage is removed
        case 'freeReflectionPage': initFreeReflectionPage(); break;
        case 'guidedReflectionPage': initGuidedReflectionPage(); break;
        case 'historyPage': initHistoryPage(); break;
        case 'calendarPage': initCalendarPage(); break;
        case 'viewGuidedReflectionPage': initViewGuidedReflectionPage(); break;
    }
});

// Login & Register
function initLoginPage() { if (document.getElementById('loginButton')) document.getElementById('loginButton').addEventListener('click', () => navigateTo('./home.html')); }
function initRegisterPage() { if (document.getElementById('registerButton')) document.getElementById('registerButton').addEventListener('click', () => navigateTo('./home.html')); }

// Home Page 
function initHomePage() {
    const entryView = document.getElementById('entryView');
    const savedView = document.getElementById('savedView');
    const savedMoodEmoji = document.getElementById('savedMoodEmoji');
    
    const todayString = entryManager.getTodayDateString();
    let existingEntry = entryManager.getEntryByDate(todayString);

    // Function to switch views
    function updateView() {
        if (existingEntry) {
            entryView.style.display = 'none';
            savedView.style.display = 'flex';
            savedMoodEmoji.textContent = existingEntry.mood;
        } else {
            entryView.style.display = 'block';
            savedView.style.display = 'none';
        }
    }

    // Initial check
    updateView();

    // Entry View Logic (only runs if entryView is visible) 
    const moodEmojis = document.querySelectorAll('.mood-emoji');
    const contextBtns = document.querySelectorAll('.context-btn');
    const writeReflectionBtn = document.getElementById('writeReflectionBtn');
    const saveMoodBtn = document.getElementById('saveMoodBtn');
    const reflectionModal = document.getElementById('reflectionModal');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const freeWriteBtn = reflectionModal.querySelector('.btn-primary:nth-of-type(1)');
    const guidedWriteBtn = reflectionModal.querySelector('.btn-primary:nth-of-type(2)');

    if (localStorage.getItem('session_freeReflection') || localStorage.getItem('session_guidedReflection')) {
        writeReflectionBtn.textContent = 'Modifica riflessione';
    }

    moodEmojis.forEach(emoji => {
        emoji.addEventListener('click', () => {
            moodEmojis.forEach(e => e.classList.remove('selected'));
            emoji.classList.add('selected');
        });
    });

    contextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            contextBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    writeReflectionBtn.addEventListener('click', () => reflectionModal.style.display = 'flex');
    cancelModalBtn.addEventListener('click', () => reflectionModal.style.display = 'none');
    freeWriteBtn.addEventListener('click', () => navigateTo('./free-reflection.html'));
    guidedWriteBtn.addEventListener('click', () => navigateTo('./guided-reflection.html'));

    saveMoodBtn.addEventListener('click', () => {
        const selectedMood = document.querySelector('.mood-emoji.selected');
        const selectedContext = document.querySelector('.context-btn.selected');
        
        if (!selectedMood) {
            alert('Per favore, seleziona un mood prima di salvare.');
            return;
        }

        const newEntry = {
            date: todayString,
            mood: selectedMood.textContent,
            context: selectedContext ? selectedContext.textContent : '',
            reflectionType: '',
            reflectionContent: ''
        };
        
        const freeText = localStorage.getItem('session_freeReflection');
        const guidedText = localStorage.getItem('session_guidedReflection');
        
        if (freeText) {
            newEntry.reflectionType = 'free';
            newEntry.reflectionContent = freeText;
        } else if (guidedText) {
            newEntry.reflectionType = 'guided';
            newEntry.reflectionContent = JSON.parse(guidedText);
        }
        
        entryManager.saveEntry(newEntry);
        existingEntry = newEntry; // Update the local state

        // Clean up session storage
        localStorage.removeItem('session_freeReflection');
        localStorage.removeItem('session_guidedReflection');
        
        // Update the view instantly instead of navigating
        updateView();
    });
}


// ... (Rest of the functions from initFreeReflectionPage to initViewGuidedReflectionPage)
function initFreeReflectionPage() { const saveReflectionBtn = document.getElementById('saveReflectionBtn'); const textarea = document.getElementById('reflectionTextarea'); const savedText = localStorage.getItem('session_freeReflection'); if(savedText) textarea.value = savedText; saveReflectionBtn.addEventListener('click', () => { localStorage.setItem('session_freeReflection', textarea.value); alert('Riflessione salvata!'); navigateTo('./home.html'); }); }
function initGuidedReflectionPage() { const allQuestions=["Se il tuo umore di oggi fosse un tempo meteorologico, che tempo farebbe dentro di te?","Se la tua energia di oggi fosse un colore, quale sarebbe e perché?","Cosa stai portando sulle spalle oggi? Un peso o una spinta?","Se la tua mente oggi fosse una stanza, che rumore ci sarebbe dentro?","Qual è una piccola cosa che ti ha dato gioia oggi, anche se per un solo istante?","C'è qualcosa che la tua versione futura ti direbbe di fare (o non fare) oggi?","Descrivi un sentimento che provi in questo momento usando tre parole non correlate."]; let availableQuestions=[...allQuestions]; let userAnswers=[]; let currentQuestionIndex=0; const questionEl=document.getElementById('guidedQuestion'); const textareaEl=document.getElementById('guidedTextarea'); const prevBtn=document.getElementById('prevQuestionBtn'); const nextBtn=document.getElementById('nextQuestionBtn'); const saveBtn=document.getElementById('saveGuidedAnswersBtn'); function loadQuestion(index){if(index>=userAnswers.length){if(availableQuestions.length===0)availableQuestions=[...allQuestions];const randomIndex=Math.floor(Math.random()*availableQuestions.length);const newQuestion=availableQuestions.splice(randomIndex,1)[0];userAnswers.push({question:newQuestion,answer:''});} const currentData=userAnswers[index]; questionEl.textContent=currentData.question; textareaEl.value=currentData.answer; updateButtons(); validateTextarea();} function updateButtons(){prevBtn.style.display=currentQuestionIndex>0?'inline-block':'none';const isLastQuestion=currentQuestionIndex===userAnswers.length-1&&userAnswers.length===allQuestions.length; nextBtn.style.display=isLastQuestion?'none':'inline-block';} function validateTextarea(){const minChars=5; nextBtn.disabled=textareaEl.value.trim().length<minChars;} textareaEl.addEventListener('input',()=>{userAnswers[currentQuestionIndex].answer=textareaEl.value; validateTextarea();}); nextBtn.addEventListener('click',()=>{if(nextBtn.disabled)return;currentQuestionIndex++;loadQuestion(currentQuestionIndex);}); prevBtn.addEventListener('click',()=>{if(currentQuestionIndex>0){currentQuestionIndex--;loadQuestion(currentQuestionIndex);}}); saveBtn.addEventListener('click',()=>{const finalAnswers=userAnswers.filter(a=>a.answer.trim()!=='');if(finalAnswers.length===0){alert("Non hai risposto a nessuna domanda.");return;} localStorage.setItem('session_guidedReflection',JSON.stringify(finalAnswers));alert('Risposte salvate!');navigateTo('./home.html');}); const savedSession=localStorage.getItem('session_guidedReflection');if(savedSession){userAnswers=JSON.parse(savedSession);const answeredTexts=userAnswers.map(a=>a.question);availableQuestions=allQuestions.filter(q=>!answeredTexts.includes(q));} loadQuestion(0); }
function initHistoryPage() {
    if (!localStorage.getItem('hasVisitedHistory')) { document.getElementById('calendarIcon').classList.add('discover-glow'); localStorage.setItem('hasVisitedHistory', 'true'); }
    const dateDisplay = document.getElementById('currentDateDisplay');
    const entryContent = document.getElementById('entryContent');
    const noEntryMessage = document.getElementById('noEntryMessage');
    const prevDayBtn = document.getElementById('prevDayBtn');
    const nextDayBtn = document.getElementById('nextDayBtn');
    let current_date_string = new URLSearchParams(window.location.search).get('date') || entryManager.getTodayDateString();
    function renderEntry(dateString) {
        const todayString = entryManager.getTodayDateString();
        const entry = entryManager.getEntryByDate(dateString);
        const displayDate = new Date(dateString + 'T12:00:00Z');
        if (dateString === todayString) { dateDisplay.textContent = 'Oggi'; } 
        else { dateDisplay.textContent = displayDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }); }
        nextDayBtn.style.visibility = (dateString >= todayString) ? 'hidden' : 'visible';
        if (entry) {
            entryContent.style.display = 'block';
            noEntryMessage.style.display = 'none';
            let reflectionHTML = '';
            if (entry.reflectionType === 'free') { reflectionHTML = `<div class="reflection-display"><h3>Nota:</h3><p>${entry.reflectionContent.replace(/\n/g, '<br>')}</p></div>`; } 
            else if (entry.reflectionType === 'guided') { reflectionHTML = `<a href="./view-guided-reflection.html?date=${entry.date}" class="btn-primary view-guided-btn">Visualizza scrittura guidata</a>`; }
            entryContent.innerHTML = `<div class="large-mood-emoji-container"><span class="large-mood-emoji">${entry.mood}</span></div><p class="context-display">${entry.context || 'Nessun contesto'}</p>${reflectionHTML}`;
        } else {
            entryContent.style.display = 'none';
            noEntryMessage.style.display = 'flex';
        }
    }
    function updateDay(offset) {
        let dateObj = new Date(current_date_string + 'T12:00:00Z');
        dateObj.setDate(dateObj.getDate() + offset);
        current_date_string = dateObj.toISOString().split('T')[0];
        renderEntry(current_date_string);
        const newUrl = `${window.location.pathname}?date=${current_date_string}`;
        history.pushState({ path: newUrl }, '', newUrl);
    }
    prevDayBtn.addEventListener('click', (e) => { e.preventDefault(); updateDay(-1); });
    nextDayBtn.addEventListener('click', (e) => { e.preventDefault(); updateDay(1); });
    renderEntry(current_date_string);
}
function initCalendarPage() {
    const monthDisplay = document.getElementById('currentMonthDisplay');
    const grid = document.querySelector('.calendar-grid');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    document.getElementById('todayLink').textContent = entryManager.getTodayDate().getDate();
    let date = entryManager.getMostRecentEntryDate();
    function renderCalendar(year, month) {
        grid.innerHTML = `<div class="day-name">Lun</div><div class="day-name">Mar</div><div class="day-name">Mer</div><div class="day-name">Gio</div><div class="day-name">Ven</div><div class="day-name">Sab</div><div class="day-name">Dom</div>`;
        date.setFullYear(year, month, 1);
        monthDisplay.textContent = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
        const firstDayOfMonth = (date.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const allEntries = entryManager.getEntries();
        const todayString = entryManager.getTodayDateString();
        for (let i = 0; i < firstDayOfMonth; i++) { grid.innerHTML += `<div class="day-cell other-month"></div>`; }
        for (let i = 1; i <= daysInMonth; i++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const entry = allEntries.find(e => e.date === dateString);
            const isToday = dateString === todayString;
            const isFuture = dateString > todayString;
            let classList = 'day-cell';
            if (isToday) classList += ' today';
            if (isFuture) classList += ' future-date';
            let cellHTML = `<div class="${classList}">`;
            if (entry) { cellHTML += `<a href="./history.html?date=${dateString}"><span>${i}</span><span class="mood-icon">${entry.mood}</span></a>`; }
            else { cellHTML += `<a href="./history.html?date=${dateString}"><span>${i}</span></a>`; }
            cellHTML += `</div>`;
            grid.innerHTML += cellHTML;
        }
    }
    prevMonthBtn.addEventListener('click', (e) => { e.preventDefault(); date.setMonth(date.getMonth() - 1); renderCalendar(date.getFullYear(), date.getMonth()); });
    nextMonthBtn.addEventListener('click', (e) => { e.preventDefault(); date.setMonth(date.getMonth() + 1); renderCalendar(date.getFullYear(), date.getMonth()); });
    renderCalendar(date.getFullYear(), date.getMonth());
}
function initViewGuidedReflectionPage() {
    const questionEl = document.getElementById('guidedQuestionView');
    const answerEl = document.getElementById('guidedAnswerView');
    const prevBtn = document.getElementById('viewPrevBtn');
    const nextBtn = document.getElementById('viewNextBtn');
    const backBtn = document.getElementById('backToHistoryBtn');
    const params = new URLSearchParams(window.location.search);
    const date = params.get('date');
    if (!date) return;
    backBtn.href = `./history.html?date=${date}`;
    const entry = entryManager.getEntryByDate(date);
    if (!entry || entry.reflectionType !== 'guided') return;
    const answers = entry.reflectionContent;
    let currentIndex = 0;
    function loadAnswer(index) {
        const item = answers[index];
        questionEl.textContent = item.question;
        answerEl.textContent = item.answer;
        prevBtn.style.display = index > 0 ? 'inline-block' : 'none';
        nextBtn.style.display = index < answers.length - 1 ? 'inline-block' : 'none';
    }
    prevBtn.addEventListener('click', () => { if(currentIndex > 0) { currentIndex--; loadAnswer(currentIndex); }});
    nextBtn.addEventListener('click', () => { if(currentIndex < answers.length - 1) { currentIndex++; loadAnswer(currentIndex); }});
    loadAnswer(0);
}