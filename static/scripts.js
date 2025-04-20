document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('speech-form');
    const recordBtn = document.getElementById('record-btn');
    const stopBtn = document.getElementById('stop-btn');
    const recognizedText = document.getElementById('recognized-text');
    const translatedText = document.getElementById('translated-text');
    const translatedAudio = document.getElementById('translated-audio');
    const fileInput = document.getElementById('audio');
    const fileInputLabel = document.querySelector('.file-input-label');
    const recordingIndicator = document.querySelector('.recording-indicator');

    // Handle file input change to show selected filename
    if (fileInput && fileInputLabel) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const fileName = this.files[0].name;
                fileInputLabel.textContent = fileName;
                fileInputLabel.classList.add('file-selected');
            } else {
                fileInputLabel.textContent = 'Choose audio file';
                fileInputLabel.classList.remove('file-selected');
            }
        });
    }

    // Initialize speech recognition
    let recognition;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false; // Stop after one phrase
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.addEventListener('start', () => {
            recordBtn.disabled = true;
            stopBtn.disabled = false;
            recognizedText.textContent = "Listening... Speak now";
            recordBtn.classList.add('recording');
            
            // Show recording indicator
            if (recordingIndicator) {
                recordingIndicator.classList.add('active');
            }
        });

        recognition.addEventListener('end', () => {
            recordBtn.disabled = false;
            stopBtn.disabled = true;
            recordBtn.classList.remove('recording');
            
            // Hide recording indicator
            if (recordingIndicator) {
                recordingIndicator.classList.remove('active');
            }
        });

        recognition.addEventListener('error', (event) => {
            console.error("Speech Recognition Error:", event);
            recognizedText.textContent = `Error: ${event.error}. Please try again.`;
            showToast(`Speech recognition error: ${event.error}`);
        });
        
    } else {
        if (recordBtn) {
            recordBtn.disabled = true;
            showToast("Your browser does not support speech recognition");
        }
    }

    // Record button click handler
    if (recordBtn) {
        recordBtn.addEventListener('click', () => {
            if (recognition) {
                recognition.start();
            }
        });
    }

    // Stop button click handler
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if (recognition) {
                recognition.stop();
            }
        });
    }

    // Handle speech recognition result
    if (recognition) {
        recognition.addEventListener('result', (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                finalTranscript += event.results[i][0].transcript;
            }

            if (!finalTranscript.trim()) {
                recognizedText.textContent = "No speech detected. Please try again.";
                showToast("No speech detected");
                return;
            }

            recognizedText.textContent = finalTranscript;
            showLoading(true);

            const formData = new FormData();
            formData.append('language', document.getElementById('language').value);
            formData.append('recognized_text', finalTranscript);

            fetch('/process_voice', {
                method: 'POST',
                body: formData,
            })
            .then(response => {
                if (!response.ok) throw new Error(`Server Error: ${response.status}`);
                return response.json();
            })
            .then(data => {
                showLoading(false);
                
                if (data.error) {
                    recognizedText.textContent = `Error: ${data.error}`;
                    showToast(`Error: ${data.error}`);
                } else {
                    translatedText.textContent = data.translated_text;
                    
                    const audioFile = data.audio_file ? data.audio_file.split('/').pop() : null;
                    if (audioFile) {
                        translatedAudio.src = `/outputs/${audioFile}?t=${new Date().getTime()}`;
                        translatedAudio.style.display = "block";
                        translatedAudio.load();
                        translatedAudio.play();
                        showToast("Translation complete!");
                    } else {
                        translatedText.textContent = "Error: Audio file not found!";
                        showToast("Error: Audio file not found");
                    }
                }
            })
            .catch(err => {
                showLoading(false);
                recognizedText.textContent = `Network Error: ${err.message}`;
                showToast(`Network Error: ${err.message}`);
            });
        });
    }

    // Form submit handler
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            showLoading(true);

            const formData = new FormData(form);
            try {
                const response = await fetch('/process', { method: 'POST', body: formData });

                if (!response.ok) throw new Error(`Server Error: ${response.status}`);

                const data = await response.json();
                showLoading(false);

                if (data.error) {
                    recognizedText.textContent = `Error: ${data.error}`;
                    showToast(`Error: ${data.error}`);
                } else {
                    recognizedText.textContent = data.recognized_text;
                    translatedText.textContent = data.translated_text;

                    const audioFile = data.audio_file ? data.audio_file.split('/').pop() : null;
                    if (audioFile) {
                        translatedAudio.src = `/outputs/${audioFile}?t=${new Date().getTime()}`;
                        translatedAudio.style.display = "block";
                        translatedAudio.load();
                        translatedAudio.play();
                        showToast("Translation complete!");
                    } else {
                        translatedText.textContent = "Error: Audio file not found!";
                        showToast("Error: Audio file not found");
                    }
                }
            } catch (error) {
                showLoading(false);
                recognizedText.textContent = `Network Error: ${error.message}`;
                showToast(`Network Error: ${error.message}`);
            }
        });
    }

    // Video looping fix
    const video = document.getElementById("bg-video");
    if (video) {
        video.addEventListener("timeupdate", function () {
            if (video.currentTime >= video.duration - 0.1) {
                video.currentTime = 0.01; // Skip to the beginning slightly before end
                video.play();
            }
        });
    }
    
    // Copy translated text
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const text = document.getElementById('translated-text').textContent;
            navigator.clipboard.writeText(text).then(() => {
                showToast('Text copied to clipboard!');
                copyBtn.classList.add('clicked');
                setTimeout(() => copyBtn.classList.remove('clicked'), 500);
            }).catch(err => {
                showToast('Failed to copy text');
                console.error('Copy failed: ', err);
            });
        });
    }
    
    // Download audio button
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const audio = document.getElementById('translated-audio');
            if (audio.src && audio.src !== window.location.href) {
                const link = document.createElement('a');
                link.href = audio.src;
                link.download = 'translated_audio.mp3';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                downloadBtn.classList.add('clicked');
                setTimeout(() => downloadBtn.classList.remove('clicked'), 500);
                showToast('Audio file downloaded');
            } else {
                showToast('No audio available to download');
            }
        });
    }
    
    // Share button
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            const text = document.getElementById('translated-text').textContent;
            
            if (navigator.share && text !== 'Translation will appear here') {
                navigator.share({
                    title: 'IndiSpeech Translation',
                    text: text
                })
                .then(() => {
                    shareBtn.classList.add('clicked');
                    setTimeout(() => shareBtn.classList.remove('clicked'), 500);
                })
                .catch(err => {
                    showToast('Sharing failed');
                    console.error('Share failed: ', err);
                });
            } else {
                showToast('Sharing not supported or no translation available');
            }
            
            shareBtn.classList.add('clicked');
            setTimeout(() => shareBtn.classList.remove('clicked'), 500);
        });
    }
    
    // Show loading indicator
    function showLoading(isLoading) {
        const result = document.getElementById('result');
        if (result) {
            if (isLoading) {
                result.classList.add('loading');
            } else {
                result.classList.remove('loading');
            }
        }
    }
    
    // Toast notification helper
    function showToast(message) {
        // Remove any existing toasts first
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => document.body.removeChild(toast));
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Show toast with a slight delay
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Hide and remove toast after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
});
