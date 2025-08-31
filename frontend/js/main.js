// Main Portfolio JavaScript
let currentSection = 'home';
let isDarkMode = true;
let sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing portfolio...');
    initializePortfolio();
    setupNavigationAndScrolling();
    setupEventListeners();
    animateCounters();
    initSkillsVisualization();
    trackPageView('main');
    
    // Initialize audio manager
    if (window.audioManager) {
        window.audioManager.init();
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
});

function initializePortfolio() {
    // Set dark mode by default
    document.body.classList.add('dark-mode');
    
    // Show only home section initially
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('home').classList.add('active');
    
    // Fix any GSAP issues
    if (typeof gsap !== 'undefined') {
        gsap.killTweensOf("*");
    }
    
    // Ensure all text is visible
    fixTextVisibility();
    
    // Set theme from localStorage if exists
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        toggleTheme();
    }
}

function fixTextVisibility() {
    // Force all text elements to be visible
    const elements = document.querySelectorAll('.hero-content, .hero-text, .hero-title, .hero-subtitle, .stat-item, .stat-number, .stat-label, .timeline-item, .timeline-content');
    elements.forEach(el => {
        if (el) {
            el.style.opacity = '1';
            el.style.visibility = 'visible';
            el.style.display = el.style.display || 'block';
            el.style.transform = 'none';
        }
    });
}

// ============================================
// NAVIGATION & SCROLLING
// ============================================
function setupNavigationAndScrolling() {
    // Handle navigation clicks
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.dataset.section;
            navigateToSection(targetSection);
            
            // Play navigation sound
            if (window.audioManager) {
                window.audioManager.playSound('click');
            }
        });
    });
    
    // Setup scroll spy
    setupScrollSpy();
    
    // Mobile menu toggle
    const navBurger = document.querySelector('.nav-burger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navBurger && navMenu) {
        navBurger.addEventListener('click', () => {
            navBurger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Animate burger
            const spans = navBurger.querySelectorAll('span');
            if (navBurger.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            }
        });
    }
}

function navigateToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Smooth scroll to section
        targetSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        // Update navigation
        updateActiveNavigation(sectionId);
        
        // Track page view
        trackPageView(sectionId);
        
        // Update current section
        currentSection = sectionId;
        
        // Close mobile menu if open
        const navMenu = document.querySelector('.nav-menu');
        const navBurger = document.querySelector('.nav-burger');
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            navBurger.classList.remove('active');
        }
    }
}

function setupScrollSpy() {
    const sections = document.querySelectorAll('.section');
    
    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                updateActiveNavigation(sectionId);
                currentSection = sectionId;
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

function updateActiveNavigation(sectionId) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        }
    });
}

// ============================================
// THEME TOGGLE
// ============================================
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        themeIcon.className = isDarkMode ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    // Save preference
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Play theme switch sound
    if (window.audioManager) {
        window.audioManager.playSound('switch');
    }
}

// ============================================
// ANIMATED COUNTERS
// ============================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const animateCounter = (counter) => {
        const target = parseInt(counter.dataset.value) || 0;
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    };
    
    // Use Intersection Observer to trigger animation when visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                if (counter.textContent === '0') {
                    animateCounter(counter);
                }
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

// ============================================
// SKILLS VISUALIZATION
// ============================================
function initSkillsVisualization() {
    const skillBars = document.querySelectorAll('.skill-progress');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const width = bar.dataset.width || 0;
                setTimeout(() => {
                    bar.style.width = width + '%';
                }, 200);
                observer.unobserve(bar);
            }
        });
    }, { threshold: 0.5 });
    
    skillBars.forEach(bar => {
        observer.observe(bar);
    });
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC to close modals/games
        if (e.key === 'Escape') {
            closeProjectModal();
            if (window.gameManager) {
                window.gameManager.closeGame();
            }
            closeChat();
        }
        
        // Ctrl/Cmd + K to open chat
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            toggleChat();
        }
    });
}

// NEW: Setup keyboard shortcuts with input-focus guard
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Check if input is focused
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || 
                               activeElement.tagName === 'TEXTAREA');
        
        // Don't trigger shortcuts when typing
        if (!isInputFocused) {
            // Ctrl/Cmd shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'k':
                        e.preventDefault();
                        toggleChat();
                        break;
                    case 'g':
                        e.preventDefault();
                        window.location.href = 'games.html';
                        break;
                    case 'h':
                        e.preventDefault();
                        if (window.location.pathname.includes('main.html')) {
                            navigateToSection('home');
                        } else {
                            window.location.href = 'main.html#home';
                        }
                        break;
                    case 'l':
                        e.preventDefault();
                        window.location.href = 'index.html';
                        break;
                }
            }
        }
        
        // ESC key works regardless
        if (e.key === 'Escape') {
            closeProjectModal();
            closeChat();
        }
    });
}

// ============================================
// CONTACT FORM WITH EMAILJS
// ============================================
async function handleContactSubmit(e) {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    if (!btn) return;
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;
    
    try {
        // Get form values
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value,
            session_id: sessionId || 'anonymous'
        };
        
        // Send to backend instead of EmailJS
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Success
            btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
            btn.style.background = 'linear-gradient(45deg, #00ff00, #00cc00)';
            e.target.reset();
            
            // Show success notification
            showNotification('Message sent successfully! Sai will get back to you soon.', 'success');
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, 3000);
        } else {
            throw new Error(result.error || 'Failed to send message');
        }
        
    } catch (error) {
        console.error('Contact form error:', error);
        btn.innerHTML = '<i class="fas fa-times"></i> Failed to send';
        btn.style.background = 'linear-gradient(45deg, #ff0000, #cc0000)';
        
        showNotification('Failed to send message. Please try again or email directly.', 'error');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 3000);
    }
}

// ============================================
// DOWNLOAD RESUME
// ============================================
function downloadResume() {
    // Track download
    trackInteraction('resume_download', 'button');
    
    // Try to download PDF
    const link = document.createElement('a');
    link.href = 'assets/SaiTejaReddy_Resume.pdf';
    link.download = 'SaiTejaReddy_Resume.pdf';
    link.click();
    
    // Play download sound
    if (window.audioManager) {
        window.audioManager.playSound('download');
    }
    
    showNotification('Resume download started!', 'success');
}

// ============================================
// CHAT FUNCTIONS
// ============================================
function openChat() {
    const chatbot = document.getElementById('chatbot');
    const floatingBtn = document.getElementById('floating-chat-btn');
    
    if (chatbot) {
        chatbot.classList.remove('hidden');
        if (floatingBtn) {
            floatingBtn.classList.add('hidden');
        }
        
        // Focus chat input
        setTimeout(() => {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.focus();
            }
        }, 100);
        
        // Play open sound
        if (window.audioManager) {
            window.audioManager.playSound('open');
        }
        
        trackInteraction('chat_opened', 'chatbot');
    }
}

function closeChat() {
    const chatbot = document.getElementById('chatbot');
    const floatingBtn = document.getElementById('floating-chat-btn');
    
    if (chatbot) {
        chatbot.classList.add('hidden');
    }
    if (floatingBtn) {
        floatingBtn.classList.remove('hidden');
    }
    
    // Play close sound
    if (window.audioManager) {
        window.audioManager.playSound('close');
    }
}

function toggleChat() {
    const chatbot = document.getElementById('chatbot');
    if (chatbot?.classList.contains('hidden')) {
        openChat();
    } else {
        closeChat();
    }
}

// ============================================
// PROJECT MODAL
// ============================================
function viewProject(projectId) {
    const modal = document.getElementById('project-modal');
    const content = document.getElementById('project-detail-content');
    
    if (!modal || !content) return;
    
    const projectDetails = {
        'llm': {
            title: 'LLM Classification Fine-Tuning',
            description: 'Fine-tuned DistilBERT for binary classification of instruction prompts using Hugging Face Transformers.',
            fullDescription: 'This project involved fine-tuning a DistilBERT model to classify instruction prompts as either valid or invalid. The model achieved 92% accuracy on the test set and was deployed using Hugging Face Spaces.',
            technologies: ['Hugging Face', 'PyTorch', 'DistilBERT', 'Transformers'],
            impact: 'Achieved 92% accuracy on classification tasks',
            github: 'https://github.com/sgunreddy97',
            features: [
                'Custom data preprocessing pipeline',
                'Hyperparameter optimization',
                'Model versioning with MLflow',
                'API deployment with FastAPI'
            ]
        },
        'speech': {
            title: 'Speech Recognition System',
            description: 'Built multilingual speech recognition pipeline combining Thai ASR with neural machine translation.',
            fullDescription: 'Developed an end-to-end speech recognition system that can transcribe Thai speech and translate it to English in real-time.',
            technologies: ['Wav2Vec2', 'MarianMT', 'Librosa', 'PyTorch'],
            impact: 'Successfully translated Thai speech to English with 95% accuracy',
            github: 'https://github.com/sgunreddy97',
            features: [
                'Real-time audio processing',
                'Multi-language support',
                'Noise reduction algorithms',
                'Cloud deployment on AWS'
            ]
        },
        'amazon': {
            title: 'Amazon Review Sentiment Analysis',
            description: 'Fine-tuned GPT-2 on Amazon reviews for sentiment analysis with LoRA optimization.',
            fullDescription: 'Implemented parameter-efficient fine-tuning using LoRA to adapt GPT-2 for sentiment analysis on Amazon product reviews.',
            technologies: ['GPT-2', 'LoRA', 'PEFT', 'Transformers'],
            impact: 'Reduced training time by 60% with parameter-efficient methods',
            features: [
                'LoRA implementation for efficient training',
                'Custom tokenization for review text',
                'Batch inference optimization',
                'Model quantization for deployment'
            ]
        }
    };
    
    const project = projectDetails[projectId] || projectDetails['llm'];
    
    content.innerHTML = `
        <h2>${project.title}</h2>
        <p class="project-description">${project.fullDescription}</p>
        
        <div class="project-features">
            <h3>Key Features</h3>
            <ul>
                ${project.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        </div>
        
        <div class="project-tech">
            <h3>Technologies Used</h3>
            <div class="tech-tags">
                ${project.technologies.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
            </div>
        </div>
        
        <p class="project-impact"><strong>Impact:</strong> ${project.impact}</p>
        
        ${project.github ? `
            <div class="project-links">
                <a href="${project.github}" target="_blank" class="btn btn-primary">
                    <i class="fab fa-github"></i> View on GitHub
                </a>
            </div>
        ` : ''}
    `;
    
    modal.classList.remove('hidden');
    
    // Play modal sound
    if (window.audioManager) {
        window.audioManager.playSound('modal');
    }
}

function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('project-modal');
    if (event.target === modal) {
        closeProjectModal();
    }
});

// Keyboard shortcuts handler
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'k':
                e.preventDefault();
                toggleChat();
                break;
            case 'g':
                e.preventDefault();
                window.location.href = 'games.html';
                break;
            case 'h':
                e.preventDefault();
                navigateToSection('home');
                break;
            case 'l':
                e.preventDefault();
                window.location.href = 'index.html';
                break;
            case 'e':
                if (window.aiAssistant) {
                    e.preventDefault();
                    window.aiAssistant.exportChat();
                }
                break;
        }
    }
    
    // ESC key
    if (e.key === 'Escape') {
        closeProjectModal();
        closeChat();
        closeHelp();
    }
});

// Help modal functions
function showHelp() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.classList.remove('hidden');
        if (window.audioManager) {
            window.audioManager.playSound('modalOpen');
        }
    }
}

function closeHelp() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.classList.add('hidden');
        if (window.audioManager) {
            window.audioManager.playSound('modalClose');
        }
    }
}

// ============================================
// GAME MENU
// ============================================
function toggleGameMenu() {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.classList.toggle('hidden');
        
        if (!gameContainer.classList.contains('hidden')) {
            // Play game menu sound
            if (window.audioManager) {
                window.audioManager.playSound('gameMenu');
            }
        }
    }
}

function closeGameMenu() {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.classList.add('hidden');
    }
}

function startGame(gameType) {
    if (window.gameManager) {
        window.gameManager.startGame(gameType);
    }
}

// ============================================
// NOTIFICATIONS
// ============================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? 'linear-gradient(45deg, #00ff00, #00cc00)' : 
                      type === 'error' ? 'linear-gradient(45deg, #ff0000, #cc0000)' : 
                      'linear-gradient(45deg, #667eea, #764ba2)'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// ANALYTICS TRACKING
// ============================================
function trackPageView(page) {
    fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            session_id: sessionId,
            page: page,
            action: 'page_view',
            user_agent: navigator.userAgent,
            referrer: document.referrer
        })
    }).catch(err => console.error('Tracking error:', err));
}

function trackInteraction(action, element) {
    fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            session_id: sessionId,
            page: currentSection,
            action: action,
            details: { element: element },
            user_agent: navigator.userAgent
        })
    }).catch(err => console.error('Tracking error:', err));
}

// ============================================
// ANIMATIONS
// ============================================
// Add custom animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export functions for use in other files
window.portfolioFunctions = {
    openChat,
    closeChat,
    toggleChat,
    downloadResume,
    viewProject,
    closeProjectModal,
    trackInteraction,
    showNotification
};

console.log('Main.js loaded successfully');
