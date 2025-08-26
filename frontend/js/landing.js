// Landing Page JavaScript

// Play sounds immediately on page load
window.addEventListener('load', () => {
    // Initialize audio manager immediately
    if (!window.audioManager) {
        window.audioManager = new AudioManager();
        window.audioManager.init();
    }
    
    // Play landing sound after a brief delay to ensure audio context is ready
    setTimeout(() => {
        if (window.audioManager) {
            // Create a special landing sound
            window.audioManager.playSound('landingPageLoad');
            
            // Also play ambient space sound
            // window.audioManager.playSound('ambientSpace');
        }
    }, 100);
});

let scene, camera, renderer;
let stars = [];
let mouseX = 0, mouseY = 0;

// Initialize Three.js Space Background
function initSpace() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('space-container').appendChild(renderer.domElement);
    
    // Create stars
    const geometry = new THREE.SphereGeometry(0.05, 24, 24);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    for (let i = 0; i < 1000; i++) {
        const star = new THREE.Mesh(geometry, material);
        star.position.x = (Math.random() - 0.5) * 100;
        star.position.y = (Math.random() - 0.5) * 100;
        star.position.z = (Math.random() - 0.5) * 100;
        scene.add(star);
        stars.push(star);
    }
    
    // Mouse tracking
    document.addEventListener('mousemove', onMouseMove);
    
    animate();
}

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
    requestAnimationFrame(animate);
    
    // Rotate stars
    stars.forEach(star => {
        star.position.z += 0.1;
        if (star.position.z > 5) {
            star.position.z = -50;
        }
    });
    
    // Camera movement based on mouse
    camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.05;
    
    renderer.render(scene, camera);
}

// Typing Animation
const phrases = [
    "AI/ML Engineer",
    "Deep Learning Specialist",
    "Data Scientist",
    "Problem Solver",
    "Innovation Driver"
];

let phraseIndex = 0;
let letterIndex = 0;
let currentPhrase = '';
let isDeleting = false;

function typeWriter() {
    const typedElement = document.querySelector('.typed-text');
    if (!typedElement) return;
    
    const currentFullPhrase = phrases[phraseIndex];
    
    if (isDeleting) {
        currentPhrase = currentFullPhrase.substring(0, letterIndex - 1);
        letterIndex--;
    } else {
        currentPhrase = currentFullPhrase.substring(0, letterIndex + 1);
        letterIndex++;
    }
    
    typedElement.textContent = currentPhrase;
    
    let typeSpeed = isDeleting ? 50 : 100;
    
    if (!isDeleting && letterIndex === currentFullPhrase.length) {
        typeSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && letterIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
    }
    
    setTimeout(typeWriter, typeSpeed);
}

// Enter Portfolio
function enterPortfolio() {
    // Play transition sound
    if (window.audioManager) {
        window.audioManager.playSound('transition');
    }
    
    // Add exit animation
    document.querySelector('.landing-content').style.animation = 'fadeOut 1s ease';
    
    setTimeout(() => {
        window.location.href = 'main.html';
    }, 1000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => loadingScreen.remove(), 1000);
        }
    }, 2000);
    
    // Initialize space background
    if (typeof THREE !== 'undefined') {
        initSpace();
    }
    
    // Start typing animation
    setTimeout(typeWriter, 1000);
});

// Window resize handler
window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});
