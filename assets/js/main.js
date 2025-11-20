/**
 * =============================================
 * INSTITUTO SAN MARTÍN DE PORRES
 * JavaScript Principal - Versión Profesional
 * =============================================
 */

// ========== VARIABLES GLOBALES ==========
let currentYear = new Date().getFullYear();
let isLoading = true;
let scrollPosition = 0;
let swiper = null;
let animationObserver = null;
let statsAnimated = false;

// ========== CONFIGURACIÓN ==========
const CONFIG = {
    // URLs de la API (simuladas para demo)
    API_BASE_URL: 'https://api.sanmartindeporres.edu.pe',
    
    // Configuraciones de animación
    ANIMATION_DURATION: 1000,
    SCROLL_THRESHOLD: 100,
    STATS_ANIMATION_SPEED: 50,
    
    // Configuraciones de formulario
    FORM_VALIDATION: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^(\+51|51)?[9][0-9]{8}$/,
        name: /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]{2,50}$/
    },
    
    // Mensajes del sistema
    MESSAGES: {
        success: {
            form: '¡Mensaje enviado exitosamente! Te contactaremos pronto.',
            newsletter: '¡Suscripción exitosa! Recibirás nuestras novedades.',
        },
        error: {
            form: 'Error al enviar el mensaje. Inténtalo nuevamente.',
            newsletter: 'Error en la suscripción. Verifica tu email.',
            validation: 'Por favor, completa todos los campos correctamente.',
            network: 'Error de conexión. Verifica tu internet.'
        },
        loading: {
            form: 'Enviando mensaje...',
            newsletter: 'Procesando suscripción...'
        }
    }
};

// ========== UTILIDADES ==========
const Utils = {
    /**
     * Selector de elementos mejorado
     */
    $(selector) {
        const elements = document.querySelectorAll(selector);
        return elements.length === 1 ? elements[0] : elements;
    },

    /**
     * Debounce function para optimizar eventos
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function para scroll events
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Animación suave de números
     */
    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = Math.floor(start + (end - start) * progress);
            
            element.textContent = value;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    },

    /**
     * Validador de email mejorado
     */
    validateEmail(email) {
        return CONFIG.FORM_VALIDATION.email.test(email);
    },

    /**
     * Validador de teléfono peruano
     */
    validatePhone(phone) {
        return CONFIG.FORM_VALIDATION.phone.test(phone);
    },

    /**
     * Validador de nombres
     */
    validateName(name) {
        return CONFIG.FORM_VALIDATION.name.test(name);
    },

    /**
     * Mostrar notificación toast
     */
    showToast(message, type = 'success') {
        // Crear elemento toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Agregar estilos dinámicos
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: '10000',
            transform: 'translateX(400px)',
            transition: 'all 0.3s ease',
            maxWidth: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
        });

        // Agregar al DOM
        document.body.appendChild(toast);

        // Animar entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Auto-remove después de 5 segundos
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, 5000);
    },

    /**
     * Scroll suave a elemento
     */
    smoothScrollTo(element, offset = 80) {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    },

    /**
     * Formatear fecha
     */
    formatDate(date) {
        return new Intl.DateTimeFormat('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },

    /**
     * Generar ID único
     */
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
};

// ========== LOADER ==========
const LoaderManager = {
    init() {
        this.simulateLoading();
    },

    simulateLoading() {
        const loader = Utils.$('#loader');
        const progressBar = Utils.$('.progress-bar');
        
        if (!loader || !progressBar) return;

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => this.hideLoader(), 500);
            }
            
            progressBar.style.width = `${progress}%`;
        }, 200);
    },

    hideLoader() {
        const loader = Utils.$('#loader');
        if (loader) {
            loader.classList.add('hidden');
            document.body.style.overflow = '';
            isLoading = false;
            
            // Inicializar todo después del loader
            setTimeout(() => {
                App.initializeAll();
            }, 300);
        }
    }
};

// ========== NAVEGACIÓN ==========
const Navigation = {
    init() {
        this.setupScrollEffect();
        this.setupMobileMenu();
        this.setupActiveLinks();
        this.setupSmoothScroll();
    },

    setupScrollEffect() {
        const header = Utils.$('#header');
        const scrollTop = Utils.$('#scrollTop');

        const handleScroll = Utils.throttle(() => {
            scrollPosition = window.pageYOffset;

            // Header effect
            if (scrollPosition > 100) {
                header?.classList.add('scrolled');
            } else {
                header?.classList.remove('scrolled');
            }

            // Scroll to top button
            if (scrollPosition > 500) {
                scrollTop?.classList.add('visible');
            } else {
                scrollTop?.classList.remove('visible');
            }
        }, 16);

        window.addEventListener('scroll', handleScroll);
        
        // Scroll to top functionality
        scrollTop?.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    },

    setupMobileMenu() {
        const navToggle = Utils.$('#nav-toggle');
        const navMenu = Utils.$('#nav-menu');

        navToggle?.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu?.classList.toggle('active');
            document.body.classList.toggle('nav-open');
        });

        // Cerrar menú al hacer clic en un enlace
        const navLinks = Utils.$('.nav-link');
        navLinks.forEach?.(link => {
            link.addEventListener('click', () => {
                navToggle?.classList.remove('active');
                navMenu?.classList.remove('active');
                document.body.classList.remove('nav-open');
            });
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar') && navMenu?.classList.contains('active')) {
                navToggle?.classList.remove('active');
                navMenu?.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        });
    },

    setupActiveLinks() {
        const navLinks = Utils.$('.nav-link');
        const sections = Utils.$('section[id]');

        const updateActiveLink = Utils.throttle(() => {
            let current = '';
            
            sections.forEach?.(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach?.(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        }, 16);

        window.addEventListener('scroll', updateActiveLink);
    },

    setupSmoothScroll() {
        const navLinks = Utils.$('a[href^="#"]');
        
        navLinks.forEach?.(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = Utils.$(`#${targetId}`);
                
                if (targetElement) {
                    Utils.smoothScrollTo(targetElement);
                }
            });
        });
    }
};

// ========== HERO SLIDER ==========
const HeroSlider = {
    init() {
        this.setupSwiper();
    },

    setupSwiper() {
        swiper = new Swiper('.hero-slider', {
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
            speed: 1000,
            on: {
                slideChange: function() {
                    // Reset animations on slide change
                    const activeSlide = this.slides[this.activeIndex];
                    const content = activeSlide.querySelector('.hero-content');
                    if (content) {
                        content.style.animation = 'none';
                        setTimeout(() => {
                            content.style.animation = 'fadeInUp 1s ease-out';
                        }, 50);
                    }
                }
            }
        });

        // Pause autoplay on hover
        const heroSlider = Utils.$('.hero-slider');
        heroSlider?.addEventListener('mouseenter', () => {
            swiper.autoplay.stop();
        });

        heroSlider?.addEventListener('mouseleave', () => {
            swiper.autoplay.start();
        });
    }
};

// ========== ESTADÍSTICAS ANIMADAS ==========
const StatsAnimation = {
    init() {
        this.setupStatsObserver();
    },

    setupStatsObserver() {
        const statsSection = Utils.$('.stats');
        
        if (!statsSection) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !statsAnimated) {
                    this.animateStats();
                    statsAnimated = true;
                }
            });
        }, { threshold: 0.5 });

        observer.observe(statsSection);
    },

    animateStats() {
        const statNumbers = Utils.$('.stat-number');
        
        statNumbers.forEach?.(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            Utils.animateNumber(stat, 0, target, 2000);
        });
    }
};

// ========== TABS DE INSTALACIONES ==========
const FacilitiesTabs = {
    init() {
        this.setupTabs();
    },

    setupTabs() {
        const tabButtons = Utils.$('.tab-button');
        const tabPanels = Utils.$('.tab-panel');

        tabButtons.forEach?.(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and panels
                tabButtons.forEach?.(btn => btn.classList.remove('active'));
                tabPanels.forEach?.(panel => panel.classList.remove('active'));
                
                // Add active class to clicked button and corresponding panel
                button.classList.add('active');
                const targetPanel = Utils.$(`#${targetTab}`);
                targetPanel?.classList.add('active');
                
                // Animate panel content
                const cards = targetPanel?.querySelectorAll('.facility-card');
                cards?.forEach((card, index) => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.transition = 'all 0.4s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 100);
                });
            });
        });
    }
};

// ========== FORMULARIOS ==========
const FormManager = {
    init() {
        this.setupContactForm();
        this.setupNewsletterForm();
        this.setupFormValidation();
    },

    setupContactForm() {
        const form = Utils.$('#contactForm');
        
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateContactForm(form)) {
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const formData = new FormData(form);
            
            this.setButtonLoading(submitBtn, true);
            
            try {
                // Simular envío de formulario
                await this.simulateFormSubmission(formData);
                
                Utils.showToast(CONFIG.MESSAGES.success.form, 'success');
                form.reset();
                this.resetFormLabels(form);
                
            } catch (error) {
                console.error('Error al enviar formulario:', error);
                Utils.showToast(CONFIG.MESSAGES.error.form, 'error');
            } finally {
                this.setButtonLoading(submitBtn, false);
            }
        });
    },

    setupNewsletterForm() {
        const form = Utils.$('#newsletterForm');
        
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = form.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (!Utils.validateEmail(email)) {
                Utils.showToast('Ingresa un email válido', 'error');
                emailInput.focus();
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            
            this.setButtonLoading(submitBtn, true);
            
            try {
                // Simular suscripción
                await this.simulateNewsletterSubscription(email);
                
                Utils.showToast(CONFIG.MESSAGES.success.newsletter, 'success');
                emailInput.value = '';
                
            } catch (error) {
                console.error('Error en suscripción:', error);
                Utils.showToast(CONFIG.MESSAGES.error.newsletter, 'error');
            } finally {
                this.setButtonLoading(submitBtn, false);
            }
        });
    },

    setupFormValidation() {
        // Validación en tiempo real para campos de formulario
        const inputs = Utils.$('input, textarea, select');
        
        inputs.forEach?.(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                // Limpiar errores mientras el usuario escribe
                this.clearFieldError(input);
            });
        });
    },

    validateContactForm(form) {
        const nombre = form.nombre.value.trim();
        const email = form.email.value.trim();
        const telefono = form.telefono.value.trim();
        const nivel = form.nivel.value;
        const mensaje = form.mensaje.value.trim();

        let isValid = true;

        // Validar nombre
        if (!Utils.validateName(nombre)) {
            this.setFieldError(form.nombre, 'Ingresa un nombre válido');
            isValid = false;
        }

        // Validar email
        if (!Utils.validateEmail(email)) {
            this.setFieldError(form.email, 'Ingresa un email válido');
            isValid = false;
        }

        // Validar teléfono
        if (!Utils.validatePhone(telefono)) {
            this.setFieldError(form.telefono, 'Ingresa un teléfono válido');
            isValid = false;
        }

        // Validar nivel
        if (!nivel) {
            this.setFieldError(form.nivel, 'Selecciona un nivel');
            isValid = false;
        }

        // Validar mensaje
        if (mensaje.length < 10) {
            this.setFieldError(form.mensaje, 'El mensaje debe tener al menos 10 caracteres');
            isValid = false;
        }

        if (!isValid) {
            Utils.showToast(CONFIG.MESSAGES.error.validation, 'error');
        }

        return isValid;
    },

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const name = field.name;

        switch (name) {
            case 'nombre':
                if (!Utils.validateName(value)) {
                    this.setFieldError(field, 'Nombre inválido');
                    return false;
                }
                break;
            case 'email':
                if (!Utils.validateEmail(value)) {
                    this.setFieldError(field, 'Email inválido');
                    return false;
                }
                break;
            case 'telefono':
                if (!Utils.validatePhone(value)) {
                    this.setFieldError(field, 'Teléfono inválido');
                    return false;
                }
                break;
        }

        this.clearFieldError(field);
        return true;
    },

    setFieldError(field, message) {
        this.clearFieldError(field);
        
        field.style.borderColor = '#ef4444';
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.color = '#ef4444';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '0.25rem';
        
        field.parentNode.appendChild(errorElement);
    },

    clearFieldError(field) {
        field.style.borderColor = '';
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    },

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    },

    resetFormLabels(form) {
        const labels = form.querySelectorAll('label');
        labels.forEach(label => {
            label.style.top = '';
            label.style.fontSize = '';
            label.style.color = '';
        });
    },

    // Simular envío de datos (en producción, esto sería una llamada real a la API)
    async simulateFormSubmission(formData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simular éxito del 90% de las veces
                if (Math.random() > 0.1) {
                    console.log('Formulario enviado:', Object.fromEntries(formData));
                    resolve({ success: true });
                } else {
                    reject(new Error('Error simulado'));
                }
            }, 2000);
        });
    },

    async simulateNewsletterSubscription(email) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) {
                    console.log('Suscripción newsletter:', email);
                    resolve({ success: true });
                } else {
                    reject(new Error('Error simulado'));
                }
            }, 1500);
        });
    }
};

// ========== MODAL MANAGER ==========
const ModalManager = {
    init() {
        this.setupModalTriggers();
        this.setupModalClose();
    },

    setupModalTriggers() {
        // Los triggers se configuran en el HTML con onclick
        window.openModal = (modalId) => {
            const modal = Utils.$(`#${modalId}`);
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        };
    },

    setupModalClose() {
        window.closeModal = (modalId) => {
            const modal = Utils.$(`#${modalId}`);
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        };

        // Cerrar modal al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = Utils.$('.modal.active');
                if (activeModal) {
                    activeModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    }
};

// ========== ANIMACIONES AOS ==========
const AnimationManager = {
    init() {
        this.setupAOS();
        this.setupCustomAnimations();
    },

    setupAOS() {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 1000,
                offset: 100,
                easing: 'ease-out-cubic',
                once: true,
                mirror: false
            });
        }
    },

    setupCustomAnimations() {
        // Observador para animaciones personalizadas
        animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        // Observar elementos con animaciones personalizadas
        const animatedElements = Utils.$('.fade-in-up, .scale-in');
        animatedElements.forEach?.(el => {
            animationObserver.observe(el);
        });
    }
};

// ========== PERFORMANCE MONITOR ==========
const PerformanceMonitor = {
    init() {
        this.logLoadTime();
        this.setupLazyLoading();
        this.optimizeImages();
    },

    logLoadTime() {
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            console.log(`🚀 Página cargada en ${Math.round(loadTime)}ms`);
            
            // Enviar métricas (en producción)
            this.sendMetrics({
                loadTime: Math.round(loadTime),
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            });
        });
    },

    setupLazyLoading() {
        // Lazy loading para imágenes
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            const lazyImages = Utils.$('img[data-src]');
            lazyImages.forEach?.(img => {
                imageObserver.observe(img);
            });
        }
    },

    optimizeImages() {
        // Optimizar carga de imágenes basada en conexión
        if ('connection' in navigator) {
            const connection = navigator.connection;
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                // Cargar imágenes de menor calidad para conexiones lentas
                console.log('🐌 Conexión lenta detectada, optimizando imágenes...');
            }
        }
    },

    sendMetrics(data) {
        // En producción, enviar a servicio de analytics
        console.log('📊 Métricas:', data);
    }
};

// ========== ACCESIBILIDAD ==========
const AccessibilityManager = {
    init() {
        this.setupKeyboardNavigation();
        this.setupAriaLabels();
        this.setupFocusManagement();
    },

    setupKeyboardNavigation() {
        // Navegación por teclado mejorada
        document.addEventListener('keydown', (e) => {
            // Manejar Enter y Espacio en elementos clickeables
            if (e.key === 'Enter' || e.key === ' ') {
                if (e.target.classList.contains('tab-button')) {
                    e.preventDefault();
                    e.target.click();
                }
            }

            // Navegación por pestañas en facilities
            if (e.target.classList.contains('tab-button')) {
                const tabButtons = [...Utils.$('.tab-button')];
                const currentIndex = tabButtons.indexOf(e.target);

                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % tabButtons.length;
                    tabButtons[nextIndex].focus();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
                    tabButtons[prevIndex].focus();
                }
            }
        });
    },

    setupAriaLabels() {
        // Agregar aria-labels dinámicamente
        const navLinks = Utils.$('.nav-link');
        navLinks.forEach?.(link => {
            if (!link.getAttribute('aria-label')) {
                link.setAttribute('aria-label', `Ir a ${link.textContent}`);
            }
        });

        // Mejorar formularios con aria-describedby
        const formFields = Utils.$('input, textarea, select');
        formFields.forEach?.(field => {
            const label = field.nextElementSibling;
            if (label && label.tagName === 'LABEL') {
                const labelId = `label-${Utils.generateId()}`;
                label.id = labelId;
                field.setAttribute('aria-labelledby', labelId);
            }
        });
    },

    setupFocusManagement() {
        // Gestión de foco para modales
        document.addEventListener('keydown', (e) => {
            const activeModal = Utils.$('.modal.active');
            if (activeModal && e.key === 'Tab') {
                const focusableElements = activeModal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                if (focusableElements.length) {
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];
                    
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            lastElement.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            firstElement.focus();
                            e.preventDefault();
                        }
                    }
                }
            }
        });
    }
};

// ========== MANEJO DE ERRORES ==========
const ErrorHandler = {
    init() {
        this.setupGlobalErrorHandler();
        this.setupPromiseRejectionHandler();
    },

    setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('🚨 Error global:', event.error);
            this.logError({
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack
            });
        });
    },

    setupPromiseRejectionHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Promise rechazada:', event.reason);
            this.logError({
                type: 'unhandledPromiseRejection',
                reason: event.reason
            });
        });
    },

    logError(errorData) {
        // En producción, enviar errores a servicio de logging
        const errorReport = {
            ...errorData,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.log('📝 Error registrado:', errorReport);
        
        // Mostrar mensaje amigable al usuario
        if (!isLoading) {
            Utils.showToast('Ha ocurrido un error. Por favor, recarga la página.', 'error');
        }
    }
};

// ========== APLICACIÓN PRINCIPAL ==========
const App = {
    init() {
        console.log('🏫 Inicializando Instituto San Martín de Porres...');
        
        // Configurar manejadores de error primero
        ErrorHandler.init();
        
        // Inicializar loader
        LoaderManager.init();
    },

    initializeAll() {
        console.log('🚀 Inicializando componentes principales...');
        
        try {
            // Inicializar todos los módulos
            Navigation.init();
            HeroSlider.init();
            StatsAnimation.init();
            FacilitiesTabs.init();
            FormManager.init();
            ModalManager.init();
            AnimationManager.init();
            PerformanceMonitor.init();
            AccessibilityManager.init();
            
            // Configurar eventos específicos
            this.setupEventListeners();
            this.updateFooterYear();
            
            console.log('✅ Todos los componentes inicializados correctamente');
            
        } catch (error) {
            console.error('❌ Error al inicializar componentes:', error);
            ErrorHandler.logError({
                type: 'initialization',
                error: error.stack
            });
        }
    },

    setupEventListeners() {
        // Eventos de resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));

        // Eventos de visibilidad de página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Pausar animaciones cuando la página no es visible
                swiper?.autoplay?.stop();
            } else {
                // Reanudar cuando vuelve a ser visible
                swiper?.autoplay?.start();
            }
        });

        // Eventos de conexión
        window.addEventListener('online', () => {
            Utils.showToast('Conexión restaurada', 'success');
        });

        window.addEventListener('offline', () => {
            Utils.showToast('Sin conexión a internet', 'error');
        });
    },

    handleResize() {
        // Manejar cambios de tamaño de ventana
        if (swiper) {
            swiper.update();
        }
        
        // Reajustar AOS si es necesario
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
    },

    updateFooterYear() {
        // Actualizar año en footer
        const yearElements = Utils.$('.current-year');
        yearElements.forEach?.(element => {
            element.textContent = currentYear;
        });
    }
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// ========== EXPORTAR PARA USO GLOBAL ==========
window.SanMartinApp = {
    Utils,
    Navigation,
    FormManager,
    ModalManager,
    openModal: (modalId) => window.openModal(modalId),
    closeModal: (modalId) => window.closeModal(modalId)
};

// ========== SERVICE WORKER (PWA) ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registrado:', registration);
            })
            .catch(error => {
                console.log('❌ Error al registrar Service Worker:', error);
            });
    });
}

// ========== CONSOLE ART ==========
console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                🏫 INSTITUTO SAN MARTÍN DE PORRES           ║
║                                                              ║
║                 Excelencia Educativa desde 1971             ║
║                                                              ║
║                  Desarrollado con ❤️ y JavaScript          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

🚀 Sistema inicializado correctamente
📊 Monitoreo de rendimiento activo
🔒 Validaciones de seguridad implementadas
♿ Accesibilidad optimizada
📱 Diseño responsive habilitado

Para soporte técnico: desarrollo@sanmartindeporres.edu.pe
`);