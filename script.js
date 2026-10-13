const canvas = document.getElementById("video-canvas");
const context = canvas ? canvas.getContext("2d") : null;

const frameCount = 240;

// The frame numbers are from frame_000001.jpg to frame_000240.jpg
const currentFrame = index => (
  `assets/frames/frame_${index.toString().padStart(6, '0')}.jpg`
);

const images = new Array(frameCount);
let imagesLoaded = 0;
let lastRenderedFrame = -1;
let rafId = null;

// Preload elements
const preloader = document.getElementById('preloader');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const frameObj = { frame: 0 };

// Fail-safe preloader dismiss: Never block the user for more than 1.2 seconds
let preloaderDismissed = false;
function dismissPreloader() {
  if (preloaderDismissed) return;
  preloaderDismissed = true;
  if (preloader) {
    preloader.classList.add('hidden');
  }
}
setTimeout(dismissPreloader, 1200);

// High-performance canvas rendering synchronized with display refresh rate
function renderFrame(index) {
  if (!context || !canvas) return;
  const frameIndex = Math.min(frameCount, Math.max(1, Math.round(index)));
  if (frameIndex === lastRenderedFrame) return;

  const img = images[frameIndex - 1];
  if (img && img.complete && img.naturalWidth > 0) {
    lastRenderedFrame = frameIndex;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    });
  }
}

// Progressive image loader: mobile gets 1 crisp frame (instant, 0 lag); desktop streams frames
function initImageLoader() {
  if (isMobile) {
    // Mobile optimization: Load only the first frame (~60KB vs 15MB)
    // Instant loading on 4G/5G, zero tab crashes, smooth 60fps scrolling
    const firstImg = new Image();
    firstImg.src = currentFrame(1);
    images[0] = firstImg;
    const onMobileReady = () => {
      if (canvas) {
        canvas.width = firstImg.naturalWidth || 1920;
        canvas.height = firstImg.naturalHeight || 1080;
      }
      renderFrame(1);
      if (progressBar && progressText) {
        progressBar.style.width = '100%';
        progressText.textContent = '100%';
      }
      dismissPreloader();
    };
    firstImg.onload = onMobileReady;
    firstImg.onerror = onMobileReady;
    return;
  }

  // Desktop optimization: Load initial 20 frames immediately for quick start, then stream the rest
  const INITIAL_BATCH = 20;

  function loadSingleImage(i, onComplete) {
    const img = new Image();
    img.src = currentFrame(i);
    images[i - 1] = img;

    const handleLoaded = () => {
      imagesLoaded++;
      if (i === 1 && canvas) {
        canvas.width = img.naturalWidth || 1920;
        canvas.height = img.naturalHeight || 1080;
        renderFrame(1);
      }
      if (progressBar && progressText) {
        const percent = Math.min(100, Math.floor((imagesLoaded / INITIAL_BATCH) * 100));
        progressBar.style.width = percent + '%';
        progressText.textContent = percent + '%';
      }
      if (imagesLoaded >= Math.min(10, INITIAL_BATCH)) {
        dismissPreloader();
      }
      if (onComplete) onComplete();
    };

    img.onload = handleLoaded;
    img.onerror = handleLoaded;
  }

  for (let i = 1; i <= INITIAL_BATCH; i++) {
    loadSingleImage(i);
  }

  // Stream remaining frames in chunks so main thread and network are never overwhelmed
  let nextIndex = INITIAL_BATCH + 1;
  function streamRemainingChunks() {
    if (nextIndex > frameCount) return;
    const CHUNK_SIZE = 15;
    const end = Math.min(frameCount, nextIndex + CHUNK_SIZE);
    for (let i = nextIndex; i <= end; i++) {
      loadSingleImage(i);
    }
    nextIndex = end + 1;
    if (nextIndex <= frameCount) {
      setTimeout(streamRemainingChunks, 80);
    }
  }

  setTimeout(streamRemainingChunks, 150);
}

initImageLoader();

// Setup GSAP + ScrollTrigger for canvas frame animation
gsap.registerPlugin(ScrollTrigger);

if (!prefersReducedMotion && !isMobile) {
  gsap.to(frameObj, {
    frame: frameCount - 1,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.8 // Silky smooth scrub interpolation without integer snapping jitter
    },
    onUpdate: () => renderFrame(frameObj.frame + 1)
  });
}

if (!prefersReducedMotion) {
  // Reveal Animations
  // 1. About section paragraph
  gsap.from(".about p", {
      scrollTrigger: {
          trigger: ".about",
          start: "top 80%",
      },
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
  });

  // 2. Tech stack logos staggered
  gsap.from(".logo-item", {
      scrollTrigger: {
          trigger: ".client-logos",
          start: "top 85%",
      },
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power2.out"
  });

  // 3. Project cards staggered
  gsap.from(".project-card", {
      scrollTrigger: {
          trigger: ".projects",
          start: "top 75%",
      },
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power3.out"
  });
}

// Re-render on resize to ensure correct canvas sizing/framing
window.addEventListener('resize', () => {
  if (!prefersReducedMotion) {
      renderFrame(Math.max(1, frameObj.frame + 1));
  } else {
      renderFrame(1);
  }
});

// Contact Form Validation
const contactForm = document.getElementById('contact-form');
const contactFeedback = document.getElementById('contact-feedback');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Simple client-side validation check is handled by 'required' and 'type="email"' attributes
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const message = document.getElementById('contact-message').value;

        if (name && email && message) {
            contactFeedback.textContent = "Thank you! Your message has been sent successfully.";
            contactFeedback.className = "form-feedback feedback-success";
            contactForm.reset();
        } else {
            contactFeedback.textContent = "Please fill out all fields.";
            contactFeedback.className = "form-feedback feedback-error";
        }
    });
}

// Newsletter Form Validation
const newsletterForm = document.getElementById('newsletter-form');
const newsletterFeedback = document.getElementById('newsletter-feedback');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('newsletter-email').value;
        
        // Basic email regex pattern for validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (emailPattern.test(email)) {
            newsletterFeedback.textContent = "Thank you for subscribing!";
            newsletterFeedback.className = "form-feedback feedback-success";
            newsletterForm.reset();
        } else {
            newsletterFeedback.textContent = "Please enter a valid email address.";
            newsletterFeedback.className = "form-feedback feedback-error";
        }
    });
}

// Generic Modal Logic
function openModal(modalElement) {
    if (!modalElement) return;
    const content = modalElement.querySelector('.modal-content');
    document.body.classList.add('modal-open');
    
    gsap.to(modalElement, {
        autoAlpha: 1, // Handles opacity and visibility: visible
        duration: 0.3,
        ease: 'power2.out'
    });
    
    if (content) {
        gsap.fromTo(content, 
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }
        );
    }
}

function closeModal(modalElement) {
    if (!modalElement) return;
    const content = modalElement.querySelector('.modal-content');
    
    document.body.classList.remove('modal-open');
    
    if (content) {
        gsap.to(content, {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in'
        });
    }
    
    gsap.to(modalElement, {
        autoAlpha: 0, // Handles opacity and visibility: hidden
        duration: 0.3,
        ease: 'power2.in',
        delay: 0.1
    });
}

// ----------------------------------------------------
// Contact Modal Setup
// ----------------------------------------------------
const contactModal = document.getElementById('contact-modal');
const closeContactBtn = document.getElementById('close-modal');
const contactTriggers = document.querySelectorAll('.contact-trigger');

contactTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(contactModal);
    });
});

if (closeContactBtn) closeContactBtn.addEventListener('click', () => closeModal(contactModal));

if (contactModal) {
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) closeModal(contactModal);
    });
}

// ----------------------------------------------------
// Projects Data & Modal Setup
// ----------------------------------------------------
const projectsData = [
    {
        title: "TextForge3D",
        image: "assets/project1-placeholder.jpg",
        description: "A premium AI-powered platform transforming natural-language prompts into playable 3D worlds.",
        extendedDescription: "This project pushes the boundaries of generative AI and WebGL integration. It features a scalable architecture designed to interpret complex prompts and render interactive environments in real time.",
        tag: "Generative AI & 3D Web",
        techStack: ["Next.js", "Three.js", "TensorFlow"],
        demoUrl: "#",
        codeUrl: "#"
    },
    {
        title: "Horizon (EcoSentinel)",
        image: "assets/project2-placeholder.jpg",
        description: "A real-time planetary health and local environmental impact dashboard.",
        extendedDescription: "Built with an emphasis on data visualization, Horizon aggregates global climate datasets and translates them into actionable local insights through an intuitive, interactive interface.",
        tag: "Full-Stack & Data Visualization",
        techStack: ["React", "Python", "D3.js"],
        demoUrl: "#",
        codeUrl: "#"
    },
    {
        title: "VisionVox",
        image: "assets/project3-placeholder.jpg",
        description: "An AI-based assistive navigation and gesture-to-voice system.",
        extendedDescription: "VisionVox empowers visually impaired users by converting spatial data and gestures into audible feedback, leveraging state-of-the-art computer vision models optimized for edge devices.",
        tag: "Computer Vision & Voice",
        techStack: ["Python", "OpenCV", "TensorFlow Lite"],
        demoUrl: "#",
        codeUrl: "#"
    },
    {
        title: "Easy Vision",
        image: "assets/project4-placeholder.jpg",
        description: "Assistive communication using computer vision and hand gestures to translate to text and audio.",
        extendedDescription: "Developed as an accessible communication tool, Easy Vision tracks complex hand signs via MediaPipe and seamlessly maps them to a continuous text and text-to-speech engine.",
        tag: "OpenCV & MediaPipe",
        techStack: ["Python", "MediaPipe", "OpenCV"],
        demoUrl: "#",
        codeUrl: "#"
    }
];

const projectModal = document.getElementById('project-modal');
const closeProjectBtn = document.getElementById('close-project-modal');
const projectCards = document.querySelectorAll('.project-card');

// Helper to check user reduced motion preference
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

projectCards.forEach(card => {
    card.addEventListener('click', () => {
        const index = card.getAttribute('data-project-index');
        if (index === null || !projectsData[index]) return;
        
        const data = projectsData[index];
        
        document.getElementById('project-modal-image').src = data.image;
        document.getElementById('project-modal-title').textContent = data.title;
        document.getElementById('project-modal-tag').textContent = data.tag;
        document.getElementById('project-modal-desc').textContent = data.description;
        document.getElementById('project-modal-ext-desc').textContent = data.extendedDescription;
        
        const techStackContainer = document.getElementById('project-modal-tech-stack');
        techStackContainer.innerHTML = '';
        data.techStack.forEach(tech => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tech;
            techStackContainer.appendChild(span);
        });
        
        document.getElementById('project-modal-demo').href = data.demoUrl;
        document.getElementById('project-modal-code').href = data.codeUrl;
        
        openModal(projectModal);
    });
    
    // 3D Tilt Hover Effect & Glare (Disabled if reduced motion is preferred)
    if (!reducedMotion) {
        const glare = card.querySelector('.project-card-glare');
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Refined tilt angle (max 10 degrees)
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
            card.style.transition = 'none'; // Instant follow on move
            
            // Dynamic glare movement
            if (glare) {
                const glareX = (x / rect.width) * 100;
                const glareY = (y / rect.height) * 100;
                glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 70%)`;
                glare.style.opacity = '1';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'; // Smooth organic reset
            if (glare) {
                glare.style.opacity = '0';
                glare.style.transition = 'opacity 0.5s ease';
            }
        });
        
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.15s ease-out';
            if (glare) glare.style.transition = 'none';
        });
    }
});

if (closeProjectBtn) closeProjectBtn.addEventListener('click', () => closeModal(projectModal));

if (projectModal) {
    projectModal.addEventListener('click', (e) => {
        if (e.target === projectModal) closeModal(projectModal);
    });
}

// ----------------------------------------------------
// Global Escape key to close any open modal
// ----------------------------------------------------
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('modal-open')) {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(m => {
            // Check if modal is visibly open
            if (m.style.visibility === 'visible' || m.style.opacity > 0) {
                closeModal(m);
            }
        });
    }
});

// ----------------------------------------------------
// Mobile Navigation
// ----------------------------------------------------
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
const navLinksItems = document.querySelectorAll('.nav-links a');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.classList.toggle('modal-open');
    });

    // Close mobile menu when a link is clicked
    navLinksItems.forEach(item => {
        item.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.classList.remove('modal-open');
        });
    });
}

// ====================================================
// Web Audio API Sound Effects (Awwwards Style SFX)
// ====================================================
let audioCtx = null;
let soundEnabled = false;

function initAudio() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Subtle high-tech hover tick
function playHoverSound() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(820, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.018, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) {
        // Ignore audio interruptions
    }
}

// Soft low-latency click pop
function playClickSound() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(160, audioCtx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
        // Ignore audio interruptions
    }
}

// Modal open chime sound
function playChimeSound() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.05);

            gain.gain.setValueAtTime(0.025, audioCtx.currentTime + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + idx * 0.05 + 0.25);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(audioCtx.currentTime + idx * 0.05);
            osc.stop(audioCtx.currentTime + idx * 0.05 + 0.25);
        });
    } catch (e) {}
}

// Sound toggle setup
const soundToggleBtn = document.getElementById('sound-toggle');
if (soundToggleBtn) {
    const soundStatus = soundToggleBtn.querySelector('.sound-status');

    soundToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        initAudio();
        soundEnabled = !soundEnabled;

        if (soundEnabled) {
            soundToggleBtn.classList.add('active');
            if (soundStatus) soundStatus.textContent = 'SFX ON';
            playChimeSound();
        } else {
            soundToggleBtn.classList.remove('active');
            if (soundStatus) soundStatus.textContent = 'SFX OFF';
        }
    });
}

// Attach sound triggers to interactive elements
const interactiveSoundTargets = 'a, button, .project-card, .logo-item, input, textarea';
document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveSoundTargets)) {
        playHoverSound();
    }
});

document.addEventListener('click', (e) => {
    if (e.target.closest(interactiveSoundTargets)) {
        playClickSound();
    }
});

// ====================================================
// Custom Animated Glow Dot & Magnetic Cursor
// ====================================================
const cursorDot = document.getElementById('cursor-dot');
const cursorOutline = document.getElementById('cursor-outline');

if (cursorDot && cursorOutline && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let outlineX = mouseX;
    let outlineY = mouseY;
    let dotX = mouseX;
    let dotY = mouseY;
    let isCursorVisible = false;
    let targetMagnetic = null;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!isCursorVisible) {
            cursorDot.style.opacity = '1';
            cursorOutline.style.opacity = '1';
            isCursorVisible = true;
        }

        // Check if cursor is near a magnetic target
        const magneticEl = e.target.closest('.btn-primary, .sound-toggle-btn, .hamburger, .close-btn');
        if (magneticEl) {
            targetMagnetic = magneticEl;
            document.body.classList.add('cursor-magnetic');
        } else {
            targetMagnetic = null;
            document.body.classList.remove('cursor-magnetic');
        }

        // Generic hover state for interactive elements
        const hoverEl = e.target.closest('a, button, .project-card, input, textarea, .logo');
        if (hoverEl) {
            document.body.classList.add('cursor-hover');
        } else {
            document.body.classList.remove('cursor-hover');
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.add('cursor-clicking');
    });

    document.addEventListener('mouseup', () => {
        document.body.classList.remove('cursor-clicking');
    });

    document.addEventListener('mouseleave', () => {
        cursorDot.style.opacity = '0';
        cursorOutline.style.opacity = '0';
        isCursorVisible = false;
    });

    // Smooth animation loop using requestAnimationFrame
    function renderCursor() {
        // Immediate dot tracking
        dotX += (mouseX - dotX) * 0.75;
        dotY += (mouseY - dotY) * 0.75;
        cursorDot.style.left = `${dotX}px`;
        cursorDot.style.top = `${dotY}px`;

        // Smooth outline tracking with magnetic attraction
        let targetX = mouseX;
        let targetY = mouseY;

        if (targetMagnetic) {
            const rect = targetMagnetic.getBoundingClientRect();
            const elemCenterX = rect.left + rect.width / 2;
            const elemCenterY = rect.top + rect.height / 2;
            
            // Magnetic pull: lerp towards element center
            targetX = elemCenterX + (mouseX - elemCenterX) * 0.25;
            targetY = elemCenterY + (mouseY - elemCenterY) * 0.25;

            // Apply slight magnetic pull to the button itself
            const pullX = (mouseX - elemCenterX) * 0.18;
            const pullY = (mouseY - elemCenterY) * 0.18;
            targetMagnetic.style.transform = `translate(${pullX.toFixed(2)}px, ${pullY.toFixed(2)}px)`;
        }

        outlineX += (targetX - outlineX) * 0.18;
        outlineY += (targetY - outlineY) * 0.18;

        cursorOutline.style.left = `${outlineX}px`;
        cursorOutline.style.top = `${outlineY}px`;

        requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    // Reset button translation on mouseout
    document.addEventListener('mouseout', (e) => {
        const magneticEl = e.target.closest('.btn-primary, .sound-toggle-btn, .hamburger, .close-btn');
        if (magneticEl) {
            magneticEl.style.transform = '';
        }
    });
}

// ====================================================
// SCROLL PROGRESS INDICATOR
// ====================================================
const scrollProgressBar = document.getElementById('scroll-progress');
if (scrollProgressBar) {
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        scrollProgressBar.style.width = `${progress}%`;
    }, { passive: true });
}

// ====================================================
// BACK TO TOP BUTTON
// ====================================================
const backToTopBtn = document.getElementById('back-to-top');
if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


// ====================================================
// TYPEWRITER ANIMATION
// ====================================================
const typewriterEl = document.getElementById('typewriter');
if (typewriterEl) {
    const roles = [
        'Full-Stack Developer',
        'AI/ML Engineer',
        'Creative Technologist',
        'Computer Vision Builder',
        '3D WebGL Creator'
    ];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeWriter() {
        const currentRole = roles[roleIndex];
        const displayText = isDeleting
            ? currentRole.substring(0, charIndex - 1)
            : currentRole.substring(0, charIndex + 1);

        typewriterEl.textContent = displayText;

        if (isDeleting) {
            charIndex--;
        } else {
            charIndex++;
        }

        let delay = isDeleting ? 50 : 100;

        if (!isDeleting && charIndex === currentRole.length) {
            delay = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            delay = 400;
        }

        setTimeout(typeWriter, delay);
    }
    setTimeout(typeWriter, 1500);
}

// ====================================================
// STATS COUNTER ANIMATION
// ====================================================
function animateCounter(el, target, duration) {
    duration = duration || 1800;
    var step = function(timestamp) {
        if (!step.startTime) step.startTime = timestamp;
        var progress = Math.min((timestamp - step.startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
    };
    requestAnimationFrame(step);
}

var statItems = document.querySelectorAll('.stat-item');
if (statItems.length > 0 && 'IntersectionObserver' in window) {
    var statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var el = entry.target;
                var target = parseInt(el.getAttribute('data-target'), 10);
                var numEl = el.querySelector('.stat-number');
                if (numEl) animateCounter(numEl, target);
                statsObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    statItems.forEach(function(item) { statsObserver.observe(item); });
}

// ====================================================
// GSAP SCROLL ANIMATIONS FOR NEW SECTIONS
// ====================================================
if (!prefersReducedMotion) {
    gsap.from('.stat-item', {
        scrollTrigger: { trigger: '.stats-section', start: 'top 80%' },
        y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out'
    });

    gsap.from('.cert-card', {
        scrollTrigger: { trigger: '.certs-section', start: 'top 80%' },
        y: 50, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out'
    });

    gsap.from('.timeline-item', {
        scrollTrigger: { trigger: '.timeline-section', start: 'top 80%' },
        y: 40, opacity: 0, duration: 0.9, stagger: 0.2, ease: 'power3.out'
    });
}


// ====================================================
// PAGE TRANSITION CINEMATIC ENTRANCE
// ====================================================
var pageTransition = document.getElementById('page-transition');
if (pageTransition && !prefersReducedMotion) {
    gsap.fromTo(pageTransition,
        { scaleY: 1, transformOrigin: 'top' },
        { scaleY: 0, duration: 0.8, ease: 'power4.inOut', delay: 0.1 }
    );
}
