// Enhanced AI Chatbot with Backend Integration
class AIAssistant {
    constructor() {
        this.backendUrl = '';
        this.sessionId = this.generateSessionId();
        this.mode = 'strict';
        this.voiceEnabled = false;
        this.voiceOutputEnabled = false;
        this.isRecording = false;
        this.recognition = null;
        this.conversations = [];
        this.currentLanguage = 'en-US';
        this.lastResponse = '';
        
        this.init();
    }
    
    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUI());
        } else {
            this.setupUI();
        }
        
        // Initialize speech recognition
        this.initSpeechRecognition();
        
        // Load conversation history from localStorage
        this.loadConversations();
        
        // Send welcome message
        setTimeout(() => {
            this.addMessage('bot', "👋 Hi! I'm Sai's AI assistant. I can tell you about his experience, skills, projects, and answer any questions. What would you like to know?");
            this.showSuggestions(['Tell me about Sai', 'What are his skills?', 'Why hire him?']);
        }, 500);
    }
    
    setupUI() {
        // Create or update chatbot HTML if it doesn't exist
        let chatContainer = document.getElementById('chatbot');
        if (!chatContainer) {
            chatContainer = document.createElement('div');
            chatContainer.id = 'chatbot';
            chatContainer.className = 'chatbot-container hidden';
            document.body.appendChild(chatContainer);
        }
        
        chatContainer.innerHTML = `
            <div class="chatbot-header">
                <h3>🤖 AI Assistant</h3>
                <div class="chatbot-controls">
                    <button onclick="aiAssistant.exportChat()" title="Export Chat">
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="aiAssistant.clearChat()" title="Clear Chat">
                        <i class="fas fa-trash"></i>
                    </button>
                    <div class="ios-toggle-container">
                        <span class="toggle-label" id="mode-label">Strict</span>
                        <label class="ios-toggle">
                            <input type="checkbox" id="mode-toggle" onchange="aiAssistant.toggleMode()">
                            <span class="ios-toggle-slider"></span>
                        </label>
                    </div>
                    <button onclick="aiAssistant.toggleMaximize()" title="Maximize">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button onclick="aiAssistant.close()" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="chatbot-body">
                <div id="chat-messages" class="chat-messages"></div>
                <div class="chat-suggestions" id="chat-suggestions"></div>
            </div>
            
            <div class="voice-settings">
                <div class="voice-toggle">
                    <span class="toggle-label">🎤 Voice Input</span>
                    <label class="ios-toggle">
                        <input type="checkbox" id="voice-input-toggle" onchange="aiAssistant.toggleVoiceInput()">
                        <span class="ios-toggle-slider"></span>
                    </label>
                </div>
                <div class="voice-toggle">
                    <span class="toggle-label">🔊 Voice Output</span>
                    <label class="ios-toggle">
                        <input type="checkbox" id="voice-output-toggle" onchange="aiAssistant.toggleVoiceOutput()">
                        <span class="ios-toggle-slider"></span>
                    </label>
                </div>
            </div>
            
            <div class="chatbot-footer">
                <div class="chat-input-container">
                    <button id="voice-btn" class="voice-btn" onclick="aiAssistant.toggleRecording()" title="Voice Input">
                        <i class="fas fa-microphone"></i>
                    </button>
                    <textarea id="chat-input" 
                            placeholder="Ask about experience, skills, projects..." 
                            rows="1"
                            onkeypress="aiAssistant.handleKeypress(event)"
                            oninput="aiAssistant.autoResize(this)"></textarea>
                    <button class="send-btn" onclick="aiAssistant.sendMessage()" title="Send Message">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Get references to elements
        this.messagesEl = document.getElementById('chat-messages');
        this.suggestionsEl = document.getElementById('chat-suggestions');
        this.inputEl = document.getElementById('chat-input');
        this.voiceBtn = document.getElementById('voice-btn');
        this.modeToggle = document.getElementById('mode-toggle');
        this.modeLabel = document.getElementById('mode-label');
    }
    
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = this.currentLanguage;
            
            this.recognition.onstart = () => {
                this.isRecording = true;
                this.voiceBtn.classList.add('recording');
                this.voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
            };
            
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                if (finalTranscript) {
                    this.inputEl.value = finalTranscript;
                } else {
                    this.inputEl.value = interimTranscript;
                }
                
                this.autoResize(this.inputEl);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopRecording();
            };
            
            this.recognition.onend = () => {
                this.stopRecording();
                if (this.inputEl.value.trim()) {
                    this.sendMessage();
                }
            };
        }
    }
    
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    startRecording() {
        // Stop any ongoing speech
        this.stopSpeaking();
        
        if (this.recognition && !this.isRecording) {
            this.recognition.start();
            if (window.audioManager) {
                window.audioManager.playSound('voiceStart');
            }
        }
    }
    
    stopRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
            this.voiceBtn.classList.remove('recording');
            this.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            if (window.audioManager) {
                window.audioManager.playSound('voiceStop');
            }
        }
    }
    
    toggleVoiceInput() {
        this.voiceEnabled = document.getElementById('voice-input-toggle').checked;
        this.voiceBtn.style.display = this.voiceEnabled ? 'flex' : 'none';
    }
    
    toggleVoiceOutput() {
        const toggle = document.getElementById('voice-output-toggle');
        this.voiceOutputEnabled = toggle ? toggle.checked : false;
        
        // Stop any ongoing speech when toggled off
        if (!this.voiceOutputEnabled) {
            this.stopSpeaking();
        }
        
        // Save preference
        localStorage.setItem('voiceOutputEnabled', this.voiceOutputEnabled);
    }
    
    toggleMode() {
        this.mode = this.modeToggle.checked ? 'open' : 'strict';
        this.modeLabel.textContent = this.mode === 'strict' ? 'Strict' : 'Open';
        
        const modeMessage = this.mode === 'strict' 
            ? "Switched to Strict Mode: Professional responses only"
            : "Switched to Open Mode: More casual and wide-ranging conversations";
        
        this.addMessage('bot', modeMessage);
        
        // Play sound effect
        if (window.audioManager) {
            window.audioManager.playSound('toggle');
        }
    }
    
    toggleMaximize() {
        const container = document.getElementById('chatbot');
        container.classList.toggle('maximized');
        
        // Update icon
        const icon = container.querySelector('.fa-expand') || container.querySelector('.fa-compress');
        if (icon) {
            icon.className = container.classList.contains('maximized') 
                ? 'fas fa-compress' 
                : 'fas fa-expand';
        }
    }
    
    // NEW / FIXED: stop speaking helper (also used by voice toggle)
    stopSpeaking() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }
    
    async sendMessage() {
        const message = this.inputEl.value.trim();
        if (!message) return;
        
        // Stop any ongoing speech
        this.stopSpeaking();
        
        // Clear input
        this.inputEl.value = '';
        this.autoResize(this.inputEl);
        
        // Add user message
        this.addMessage('user', message);
        
        // Show typing indicator
        const typingId = this.showTyping();
        
        try {
            // Check if this is a "tell me more" request
            const lower = message.toLowerCase();
            const isMoreRequest = lower.includes('tell me more') || lower.includes('more details');
            
            // Send to backend
            const response = await fetch(`${this.backendUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    session_id: this.sessionId,
                    mode: this.mode,
                    detailed: isMoreRequest
                })
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            this.removeTyping(typingId);
            
            if (data.success) {
                // Store last response
                this.lastResponse = data.response;
                
                // Add bot response with "Tell me more" button if applicable
                this.addMessage('bot', data.response, {
                    suggestions: data.suggestions,
                    confidence: data.confidence,
                    showMoreButton: data.show_more_button
                });
                
                // Show suggestions
                if (data.suggestions && data.suggestions.length > 0) {
                    this.showSuggestions(data.suggestions);
                }
                
                // Voice output if enabled
                if (this.voiceOutputEnabled && window.speechSynthesis) {
                    this.speak(data.response);
                }
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
            
        } catch (error) {
            console.error('Chat error:', error);
            this.removeTyping(typingId);
            
            // Brief fallback response
            this.addMessage('bot', "I can help you learn about Sai's expertise. Try asking about his Python experience or ML projects!");
            
            this.showSuggestions(['Python experience?', 'ML projects?', 'Why hire Sai?']);
        }
        
        // Save conversation
        this.saveConversation();
        
        // Play send sound
        if (window.audioManager) {
            window.audioManager.playSound('messageSent');
        }
    }
    
    addMessage(sender, text, options = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? '👤' : '🤖';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // Parse markdown-like formatting
        const formattedText = this.formatMessage(text);
        content.innerHTML = formattedText;
        
        // Add "Tell me more" button if indicated
        if (sender === 'bot' && options.showMoreButton) {
            const moreBtn = document.createElement('button');
            moreBtn.className = 'expand-btn';
            moreBtn.innerHTML = '📖 Tell me more';
            moreBtn.onclick = () => {
                this.inputEl.value = 'Tell me more about that';
                this.sendMessage();
            };
            content.appendChild(moreBtn);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        this.messagesEl.appendChild(messageDiv);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        
        // Store in conversations
        this.conversations.push({
            sender: sender,
            text: text,
            timestamp: new Date().toISOString()
        });
        
        // Play receive sound for bot messages
        if (sender === 'bot' && window.audioManager) {
            window.audioManager.playSound('messageReceived');
        }
    }
    
    formatMessage(text) {
        // Convert markdown-like formatting to HTML
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/•/g, '▸');
    }
    
    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot';
        typingDiv.id = 'typing-' + Date.now();
        
        typingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content typing-indicator">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        this.messagesEl.appendChild(typingDiv);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        
        return typingDiv.id;
    }
    
    removeTyping(typingId) {
        const typingDiv = document.getElementById(typingId);
        if (typingDiv) {
            typingDiv.remove();
        }
    }
    
    showSuggestions(suggestions) {
        if (!this.suggestionsEl) return;
        
        this.suggestionsEl.innerHTML = suggestions.map(s => `
            <button class="suggestion" onclick="aiAssistant.sendSuggestion('${s.replace(/'/g, "\\'")}')">${s}</button>
        `).join('');
    }
    
    sendSuggestion(text) {
        this.inputEl.value = text;
        this.sendMessage();
    }
    
    async requestMoreDetails(previousResponse) {
        const message = "Tell me more details about that";
        this.addMessage('user', message);
        
        const typingId = this.showTyping();
        
        try {
            const response = await fetch(`${this.backendUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    session_id: this.sessionId,
                    mode: this.mode,
                    context: previousResponse
                })
            });
            
            const data = await response.json();
            this.removeTyping(typingId);
            
            if (data.success) {
                this.addMessage('bot', data.response);
            }
        } catch (error) {
            this.removeTyping(typingId);
            this.addMessage('bot', "Let me provide more details about Sai's background...");
        }
    }
    
    speak(text) {
        if (!window.speechSynthesis) return;
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        // Try to use a better voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
            v.name.includes('Google') || 
            v.name.includes('Microsoft') || 
            v.lang.startsWith('en')
        );
        
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        
        window.speechSynthesis.speak(utterance);
    }
    
    clearChat() {
        if (confirm('Are you sure you want to clear the conversation?')) {
            this.messagesEl.innerHTML = '';
            this.conversations = [];
            this.saveConversation();
            
            // Send welcome message again
            this.addMessage('bot', "Chat cleared! How can I help you learn about Sai?");
            this.showSuggestions(['Tell me about Sai', 'What are his skills?', 'Why hire him?']);
            
            if (window.audioManager) {
                window.audioManager.playSound('modalClose');
            }
        }
    }
    
    exportChat() {
        const chatHistory = this.conversations.map(msg => 
            `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.sender.toUpperCase()}: ${msg.text}`
        ).join('\n\n');
        
        const blob = new Blob([chatHistory], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        if (window.audioManager) {
            window.audioManager.playSound('downloadComplete');
        }
    }
    
    saveConversation() {
        localStorage.setItem('chatConversations', JSON.stringify(this.conversations));
    }
    
    loadConversations() {
        const saved = localStorage.getItem('chatConversations');
        if (saved) {
            try {
                this.conversations = JSON.parse(saved);
                // Don't reload old messages in UI for fresh start
            } catch (e) {
                console.error('Failed to load conversations:', e);
            }
        }
    }
    
    handleKeypress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }
    
    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    open() {
        const container = document.getElementById('chatbot');
        const floatingBtn = document.getElementById('floating-chat-btn');
        
        if (container) {
            container.classList.remove('hidden');
            if (floatingBtn) {
                floatingBtn.style.display = 'none';
            }
            
            // Focus input
            setTimeout(() => {
                if (this.inputEl) {
                    this.inputEl.focus();
                }
            }, 300);
            
            // Play sound
            if (window.audioManager) {
                window.audioManager.playSound('chatOpen');
            }
        }
    }
    
    // Add this method to properly close chatbot
    close() {
        // Stop any ongoing speech
        this.stopSpeaking();
        
        const container = document.getElementById('chatbot');
        const floatingBtn = document.getElementById('floating-chat-btn');
        
        if (container) {
            container.classList.add('hidden');
        }
        if (floatingBtn) {
            floatingBtn.style.display = 'flex';
        }
        
        if (window.audioManager) {
            window.audioManager.playSound('chatClose');
        }
    }
    
    toggle() {
        const container = document.getElementById('chatbot');
        if (container && container.classList.contains('hidden')) {
            this.open();
        } else {
            this.close();
        }
    }
}

// Initialize AI Assistant globally
window.aiAssistant = new AIAssistant();

// Update global functions to use new assistant
window.openChat = () => window.aiAssistant.open();
window.closeChat = () => window.aiAssistant.close();
window.toggleChat = () => window.aiAssistant.toggle();
