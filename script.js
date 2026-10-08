const canvas = document.getElementById("video-canvas");
const context = canvas.getContext("2d");

const frameCount = 240;

// The frame numbers are from frame_000001.png to frame_000240.png
const currentFrame = index => (
  `assets/frames/frame_${index.toString().padStart(6, '0')}.jpg`
);

const images = [];
let imagesLoaded = 0;

// Preload all images for smooth performance
const preloader = document.getElementById('preloader');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

for (let i = 1; i <= frameCount; i++) {
  const img = new Image();
  img.src = currentFrame(i);
  images.push(img);
  img.onload = () => {
      imagesLoaded++;
      
      if (progressBar && progressText) {
          const percent = Math.floor((imagesLoaded / frameCount) * 100);
          progressBar.style.width = percent + '%';
          progressText.textContent = percent + '%';
      }

      // Once the first image is loaded, draw it to set the initial state
      if (i === 1) {
          // Adjust canvas size to the image size
          canvas.width = img.width || 1920;
          canvas.height = img.height || 1080;
          renderFrame(1);
      }

      if (imagesLoaded === frameCount) {
          if (preloader) {
              setTimeout(() => {
                  preloader.classList.add('hidden');
              }, 300);
          }
      }
  };
}

function renderFrame(index) {
  if (images[index - 1] && images[index - 1].complete) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(images[index - 1], 0, 0);
  }
}

// Setup GSAP + ScrollTrigger for canvas frame animation
gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const frameObj = { frame: 0 };

if (!prefersReducedMotion) {
  if (!isMobile) {
      gsap.to(frameObj, {
        frame: frameCount - 1,
        snap: "frame",
        ease: "none",
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5 // Adding a slight smooth scrub for better performance
        },
        onUpdate: () => renderFrame(Math.max(1, frameObj.frame + 1))
      });
  }

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
    
    // 3D Tilt Hover Effect (Disabled if reduced motion is preferred)
    if (!reducedMotion) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -5; // Max 5 degrees
            const rotateY = ((x - centerX) / centerX) * 5;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            card.style.transition = 'none'; // Instant follow on move
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
            card.style.transition = 'transform 0.5s ease'; // Smooth reset
        });
        
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.1s ease'; // Smooth entry
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
