const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const preview = document.getElementById('image-preview');
const analyzeBtn = document.getElementById('analyze-btn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');

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
    const file = e.dataTransfer.files[0];
    handleFile(file);
});

fileInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
});

// Inside static/script.js

function handleFile(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('image-preview');
            const dropText = document.querySelector('.drop-zone p');
            const uploadBtn = document.querySelector('.drop-zone button');

            // 1. Set the image source
            preview.src = e.target.result;
            
            // 2. THE FIX: Force remove 'hidden' and force display block
            preview.classList.remove('hidden'); 
            preview.style.display = 'block'; 

            // 3. Hide the text ("Drag & Drop...")
            if(dropText) dropText.style.display = 'none';
            
            // 4. Update button text
            if(uploadBtn) uploadBtn.innerText = "Change Photo";
        };
        reader.readAsDataURL(file);
        
        // Update the actual input file (so the form can submit it)
        fileInput.files = createFileList(file);
    }
}

// Helper to manually set file input files (required for Drag & Drop)
function createFileList(file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    return dt.files;
}

// 2. ANALYZE BUTTON LOGIC
analyzeBtn.addEventListener('click', async () => {
    if (!fileInput.files[0]) {
        alert("Please upload an image first!");
        return;
    }

    // Show Loading, Hide Results
    loading.classList.remove('hidden');
    results.classList.add('hidden');

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('gender', document.getElementById('gender-select').value);

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        // 3. PARSE & DISPLAY DATA
        if (data.error) throw new Error(data.error);

        // Update Skin Tone
        document.getElementById('res-skin-tone').innerText = data.skin_tone;

        // Parse Groq JSON Advice
        // Note: app.py returns advice as a stringified JSON, so we parse it here
        const advice = JSON.parse(data.advice);

        document.getElementById('res-casual').innerText = advice.outfit_casual;
        document.getElementById('res-formal').innerText = advice.outfit_formal;

        const avoidContainer = document.getElementById('res-avoid');
        avoidContainer.innerHTML = ''; // Clear previous results
        
        advice.colors_to_avoid.forEach(colorName => {
            const chip = document.createElement('div');
            chip.className = 'avoid-chip';
            chip.innerText = colorName;
            avoidContainer.appendChild(chip);
        });

        // Render Color Swatches
        const swatchContainer = document.getElementById('color-swatches');
        swatchContainer.innerHTML = '';
        advice.colors_to_wear.forEach(color => {
            const div = document.createElement('div');
            div.className = 'swatch';
            div.style.backgroundColor = color;
            div.title = color;
            swatchContainer.appendChild(div);
        });

       // RENDER SMART SHOPPING LINKS (New Logic)
        const linkContainer = document.getElementById('shopping-links');
        linkContainer.innerHTML = '';
        
        // Use the clean 'shopping_list' from the AI instead of raw text
        if (advice.shopping_list && advice.shopping_list.length > 0) {
            advice.shopping_list.forEach(itemTerm => {
                const a = document.createElement('a');
                // Create a clean Amazon search URL
                a.href = `https://www.amazon.com/s?k=${encodeURIComponent(itemTerm)}`;
                a.target = "_blank";
                a.className = "shop-btn";
                
                // Remove the word 'Male/Female' from the button text for cleaner UI
                // (But keep it in the link for better search results!)
                const displayText = itemTerm.replace(/(Male|Female|Men|Women)/gi, '').trim();
                
                a.innerHTML = `<i class="fas fa-shopping-bag"></i> Buy ${displayText}`;
                linkContainer.appendChild(a);
            });
        } else {
            linkContainer.innerHTML = '<p style="color: #666;">No specific products found.</p>';
        }

        // Show Results
        loading.classList.add('hidden');
        results.classList.remove('hidden');

    } catch (error) {
        console.error(error);
        alert("Something went wrong! Check console.");
        loading.classList.add('hidden');
    }
});