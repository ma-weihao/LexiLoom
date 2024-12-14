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

function displayDictionaryResult(data) {
    console.log('Rendering dictionary result');
    document.getElementById('inputArea').classList.add('hidden');
    
    // Set the title to the word
    document.querySelector('h1').textContent = data.word;

    // Add speaker icon next to the word
    document.querySelector('h1').innerHTML = `
        ${data.word} 
        <img src="icons/ic_speaker.png" id="speakerIcon" style="cursor: pointer; width: 20px; vertical-align: middle;" />
    `;

    // Add event listener to the speaker icon
    document.getElementById('speakerIcon').addEventListener('click', () => {
        playPronunciation(data.word);
    });

    // Function to play pronunciation
    async function playPronunciation(word) {
        console.log('Fetching pronunciation for word:', word);
        try {
            const response = await fetch('https://burn.hair/v1/audio/speech', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-pWTPhl8aeh1lvvM1F8462970E7Aa4c0b8bBa110c8c521c67'
                },
                body: JSON.stringify({
                    model: 'tts-1',
                    input: word,
                    voice: 'shimmer'
                })
            });

            console.log('Pronunciation API response received');

            // Convert response to a blob
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
            console.log('Playing pronunciation audio');
        } catch (error) {
            console.error('Error fetching pronunciation:', error);
            displayError('Failed to fetch pronunciation. Please try again later.');
        }
    }

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
    const result = `
        <h2>Translation</h2>
        <p>${data.translationCN}</p>
    `;
    document.getElementById('resultContent').innerHTML = result;
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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('inputText').focus();
});

document.getElementById('inputText').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevents adding a new line
        document.getElementById('translateBtn').click();
    }
}); 