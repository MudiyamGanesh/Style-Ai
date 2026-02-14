// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const preview = document.getElementById('image-preview');
const analyzeBtn = document.getElementById('analyze-btn');
const newAnalysisBtn = document.getElementById('new-analysis-btn');

// Views
const inputView = document.getElementById('input-view');
const loadingView = document.getElementById('loading');
const resultsView = document.getElementById('results-view');

// 1. DRAG & DROP VISUALS
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
});

function handleFile(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            
            // THE FIX: Remove the hidden class so the image can show
            preview.classList.remove('hidden');
            preview.classList.add('visible'); 
            
            // Hide the placeholder text and icon
            document.querySelector('.drop-zone p').style.display = 'none';
            document.querySelector('.drop-icon').style.display = 'none';
            document.querySelector('.drop-zone button').innerText = "Change Photo";
        };
        reader.readAsDataURL(file);
        
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
    }
}

// 2. VIEW MANAGEMENT
function showView(view) {
    inputView.classList.add('hidden');
    loadingView.classList.add('hidden');
    resultsView.classList.add('hidden');
    view.classList.remove('hidden');
}

newAnalysisBtn.addEventListener('click', () => {
    showView(inputView);
    // Reset form
    preview.classList.remove('visible');
    document.querySelector('.drop-zone p').style.display = 'block';
    document.querySelector('.drop-icon').style.display = 'block';
    document.querySelector('.drop-zone button').innerText = "Browse Files";
    fileInput.value = '';
    
    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('active');
});

// Mobile Sidebar Toggle
document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
});

// 3. ANALYZE LOGIC
analyzeBtn.addEventListener('click', async () => {
    if (!fileInput.files[0]) {
        alert("Please upload an image first!");
        return;
    }

    showView(loadingView);

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('gender', document.getElementById('gender-select').value);

    try {
        const response = await fetch('/predict', { method: 'POST', body: formData });
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        const advice = JSON.parse(data.advice);
        
        // Save to History
        const historyData = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            gender: document.getElementById('gender-select').value,
            skin_tone: data.skin_tone,
            advice: advice
        };
        saveToHistory(historyData);
        
        // Render
        renderResults(historyData);

    } catch (error) {
        console.error(error);
        alert("Something went wrong! Check console.");
        showView(inputView);
    }
    preview.classList.remove('visible');
    preview.classList.add('hidden'); // Put the hidden class back
    
    document.querySelector('.drop-zone p').style.display = 'block';
    document.querySelector('.drop-icon').style.display = 'block';
    document.querySelector('.drop-zone button').innerText = "Browse Files";
    fileInput.value = '';
    
    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('active');
    
});

// 4. RENDERING & HISTORY
function renderResults(data) {
    document.getElementById('res-skin-tone').innerText = data.skin_tone;
    document.getElementById('res-date').innerText = data.date;
    document.getElementById('res-casual').innerText = data.advice.outfit_casual;
    document.getElementById('res-formal').innerText = data.advice.outfit_formal;

    // Chips
    const avoidContainer = document.getElementById('res-avoid');
    avoidContainer.innerHTML = ''; 
    data.advice.colors_to_avoid.forEach(colorName => {
        const chip = document.createElement('div');
        chip.className = 'avoid-chip';
        chip.innerText = colorName;
        avoidContainer.appendChild(chip);
    });

    // Swatches
    const swatchContainer = document.getElementById('color-swatches');
    swatchContainer.innerHTML = '';
    data.advice.colors_to_wear.forEach(color => {
        const div = document.createElement('div');
        div.className = 'swatch';
        div.style.backgroundColor = color;
        div.title = color;
        swatchContainer.appendChild(div);
    });

    // Links
    const linkContainer = document.getElementById('shopping-links');
    linkContainer.innerHTML = '';
    if (data.advice.shopping_list) {
        data.advice.shopping_list.forEach(itemTerm => {
            const a = document.createElement('a');
            a.href = `https://www.amazon.com/s?k=${encodeURIComponent(itemTerm)}`;
            a.target = "_blank";
            a.className = "shop-btn";
            const displayText = itemTerm.replace(/(Male|Female|Men|Women)/gi, '').trim();
            a.innerHTML = `<i class="fas fa-search"></i> ${displayText}`;
            linkContainer.appendChild(a);
        });
    }

    showView(resultsView);
}

// Local Storage Management
function saveToHistory(data) {
    let history = JSON.parse(localStorage.getItem('styleHistory')) || [];
    history.unshift(data); // Add to beginning
    localStorage.setItem('styleHistory', JSON.stringify(history));
    loadHistoryList();
}

function loadHistoryList() {
    const historyContainer = document.getElementById('history-container');
    historyContainer.innerHTML = '';
    let history = JSON.parse(localStorage.getItem('styleHistory')) || [];

    history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `<i class="far fa-user-circle"></i> ${item.skin_tone} Profile`;
        
        li.addEventListener('click', () => {
            renderResults(item);
            document.getElementById('sidebar').classList.remove('active'); // Close on mobile
        });
        
        historyContainer.appendChild(li);
    });
}

// Load history on startup
loadHistoryList();

// --- CHATBOT LOGIC ---
const chatToggleBtn = document.getElementById('chat-toggle-btn');
const closeChatBtn = document.getElementById('close-chat-btn');
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');
const chatBody = document.getElementById('chat-body');

// Toggle chat window
// True toggle for the chat window
chatToggleBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
});

async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to UI
    appendMessage(message, 'user-message');
    chatInput.value = '';

    // Try to get current context if they already analyzed a photo
    let currentTone = 'Unknown';
    const toneElement = document.getElementById('res-skin-tone');
    if (toneElement && toneElement.innerText !== 'Loading...') {
        currentTone = toneElement.innerText;
    }
    const currentGender = document.getElementById('gender-select').value;
    
    // Add loading indicator
    const loadingId = appendMessage('Thinking...', 'bot-message');

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                gender: currentGender,
                skin_tone: currentTone
            })
        });

        const data = await response.json();
        
        // Remove loading indicator and add real response
        document.getElementById(loadingId).remove();
        
        if (data.error) throw new Error(data.error);
        appendMessage(data.response, 'bot-message');

    } catch (error) {
        document.getElementById(loadingId).remove();
        appendMessage('Sorry, my connection to the fashion grid is weak right now.', 'bot-message');
    }
}

function appendMessage(text, className) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${className}`;
    msgDiv.innerText = text;
    msgDiv.id = 'msg-' + Date.now(); // Unique ID for loading removal
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight; // Auto-scroll to bottom
    return msgDiv.id;
}

// Event Listeners for clicking send or hitting enter
sendChatBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});