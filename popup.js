const audioCache = new Map();

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup DOM loaded');
    
    try {
        const result = await chrome.storage.local.get(['selectedText']);
        console.log('Retrieved from storage:', result);
        
        if (result.selectedText) {
            const inputText = document.getElementById('inputText');
            inputText.value = result.selectedText;
            
            // Clear the storage
            await chrome.storage.local.remove('selectedText');
            
            // Automatically trigger translation
            document.getElementById('translateBtn').click();
        }
    } catch (error) {
        console.error('Error retrieving selected text:', error);
    }
    
    // Focus the input field
    document.getElementById('inputText').focus();
});

document.getElementById('translateBtn').addEventListener('click', () => {
    const text = document.getElementById('inputText').value.trim();
    console.log('Translate button clicked with text:', text);
    if (text) {
        if (text.split(' ').length === 1) {
            // Single word - dictionary mode
            fetchDictionary(text);
        } else {
            // Paragraph - translation mode
            fetchTranslation(text);
        }
    }
});

document.getElementById('editBtn').addEventListener('click', () => {
    console.log('Edit button clicked');
    document.getElementById('inputArea').classList.remove('hidden');
    document.getElementById('resultArea').classList.add('hidden');
    document.getElementById('inputText').value = '';
    
    // Change the title back to 'LexiLoom'
    document.querySelector('h1').textContent = 'LexiLoom';
});

async function fetchDictionary(word) {
    console.log('Fetching dictionary for word:', word);
    showLoader();
    try {
        const response = await fetch('https://writingtools-hk-jgvsuzcgqo.cn-hongkong.fcapp.run/dictionary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: word })
        });
        console.log('Dictionary API response received');
        const data = await response.json();
        console.log('Displaying dictionary result:', data);
        displayDictionaryResult(data);
    } catch (error) {
        console.error('Error fetching dictionary:', error);
        displayError('Failed to fetch dictionary data. Please try again later.');
    } finally {
        console.log('Hiding loader after dictionary fetch');
        hideLoader();
    }
}

async function fetchTranslation(text) {
    console.log('Fetching translation for text:', text);
    showLoader();
    try {
        const response = await fetch('https://writingtools-hk-jgvsuzcgqo.cn-hongkong.fcapp.run/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        console.log('Translate API response received');
        const data = await response.json();
        console.log('Displaying translation result:', data);
        displayTranslationResult(data);
    } catch (error) {
        console.error('Error fetching translation:', error);
        displayError('Failed to fetch translation data. Please try again later.');
    } finally {
        console.log('Hiding loader after translation fetch');
        hideLoader();
    }
}

async function playPronunciation(text, iconId) {
    console.log('Attempting to play pronunciation for text:', text);
    
    try {
        replaceSpeakerWithLoader(iconId);
        
        if (audioCache.has(text)) {
            console.log('Playing cached audio for:', text);
            const cachedAudio = audioCache.get(text);
            await cachedAudio.play();
            return;
        }

        console.log('No cache found, fetching pronunciation from API for:', text);
        
        const response = await fetch('https://burn.hair/v1/audio/speech', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-pWTPhl8aeh1lvvM1F8462970E7Aa4c0b8bBa110c8c521c67'
            },
            body: JSON.stringify({
                model: 'tts-1',
                input: text,
                voice: 'shimmer'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        for (const [key, value] of audioCache.entries()) {
            URL.revokeObjectURL(value.src);
            audioCache.delete(key);
        }
        
        audioCache.set(text, audio);
        
        audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            audioCache.delete(text);
        });

        await audio.play();
        
    } catch (error) {
        console.error('Error in playPronunciation:', error);
        displayError('Failed to fetch pronunciation. Please try again later.');
    } finally {
        restoreSpeakerIcon(iconId);
    }
}

function replaceSpeakerWithLoader(iconId) {
    const icon = document.getElementById(iconId);
    if (icon) {
        // Create spinner element
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.id = `${iconId}-spinner`;
        
        // Replace speaker icon with spinner
        icon.parentNode.replaceChild(spinner, icon);
    }
}

function restoreSpeakerIcon(iconId) {
    const spinner = document.getElementById(`${iconId}-spinner`);
    if (spinner) {
        // Create new speaker icon
        const icon = document.createElement('img');
        icon.src = "icons/ic_speaker.png";
        icon.id = iconId;
        icon.className = 'speaker-icon';
        
        // Replace spinner with speaker icon
        spinner.parentNode.replaceChild(icon, spinner);
        
        // Reattach click event listener
        icon.addEventListener('click', () => {
            const text = iconId === 'speakerIcon' 
                ? document.querySelector('h1').textContent.trim() 
                : document.getElementById('inputText').value.trim();
            playPronunciation(text, iconId);
        });
    }
}

function displayDictionaryResult(data) {
    console.log('Rendering dictionary result');
    document.getElementById('inputArea').classList.add('hidden');
    
    // Set the title to the word
    document.querySelector('h1').textContent = data.word;

    // Add speaker icon next to the word
    document.querySelector('h1').innerHTML = `
        ${data.word} 
        <img src="icons/ic_speaker.png" id="speakerIcon" class="speaker-icon" />
    `;

    // Check if the speaker icon exists and attach event listener
    setTimeout(() => {
        const speakerIcon = document.getElementById('speakerIcon');
        if (speakerIcon) {
            console.log('Speaker icon found, attaching event listener');
            speakerIcon.addEventListener('click', () => {
                console.log('Speaker icon clicked');
                playPronunciation(data.word, 'speakerIcon');
            });
        } else {
            console.error('Speaker icon not found');
        }
    }, 0);

    const result = `
        <hr>
        ${data.meanings.map((mean, index) => `
            <div>
                <p><strong>Definition (EN):</strong> ${mean.definitionEN}</p>
                <p><strong>Definition (CN):</strong> ${mean.definitionCN}</p>
                <ul>
                    ${mean.exampleSentences.map(ex => `<li>${ex.sentence} - ${ex.translationCN}</li>`).join('')}
                </ul>
            </div>
            ${index < data.meanings.length - 1 ? '<hr>' : ''}
        `).join('')}
    `;

    document.getElementById('resultContent').innerHTML = `
        <p><strong>Pronunciation:</strong> ${data.pronunciation || 'N/A'}</p>
        <p><strong>Part of Speech:</strong> ${data.partOfSpeech.join(', ')}</p>
        ${result}
    `;
    document.getElementById('resultArea').classList.remove('hidden');
}

function displayTranslationResult(data) {
    console.log('Rendering translation result');
    document.getElementById('inputArea').classList.add('hidden');

    const originalText = document.getElementById('inputText').value.trim();
    
    // Determine whether to show speaker icon based on text length (changed to 500)
    const showSpeakerIcon = originalText.length <= 500;
    const speakerIconHtml = showSpeakerIcon 
        ? `<img src="icons/ic_speaker.png" id="translationSpeakerIcon" class="speaker-icon" />`
        : '';
    
    // Combine both original text and translation HTML
    const completeHtml = `
        <h2>Original Text</h2>
        <p>
            ${originalText} 
            ${speakerIconHtml}
        </p>
        <h2>Translation</h2>
        <p>${data.translationCN}</p>
    `;

    // Set the complete HTML content at once
    document.getElementById('resultContent').innerHTML = completeHtml;
    
    // Only attach event listener if speaker icon is shown
    if (showSpeakerIcon) {
        setTimeout(() => {
            const translationSpeakerIcon = document.getElementById('translationSpeakerIcon');
            if (translationSpeakerIcon) {
                console.log('Translation speaker icon found, attaching event listener');
                translationSpeakerIcon.onclick = () => {
                    console.log('Translation speaker icon clicked!!!!');
                    playPronunciation(originalText, 'translationSpeakerIcon');
                };
            } else {
                console.error('Translation speaker icon not found');
            }
        }, 0);
    }

    document.getElementById('resultArea').classList.remove('hidden');
}

function showLoader() {
    console.log('Showing loader');
    document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
    console.log('Hiding loader');
    document.getElementById('loader').classList.add('hidden');
}

function displayError(message) {
    console.log('Displaying error:', message);
    const result = `
        <h2>Error</h2>
        <p>${message}</p>
    `;
    document.getElementById('resultContent').innerHTML = result;
    document.getElementById('resultArea').classList.remove('hidden');
}

document.getElementById('inputText').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevents adding a new line
        document.getElementById('translateBtn').click();
    }
}); 