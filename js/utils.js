// DOM Utility Functions
const DOM = {
    // Single element selectors
    select: (selector, parent = document) => parent.querySelector(selector),
    selectAll: (selector, parent = document) => parent.querySelectorAll(selector),
    
    // Element creation and manipulation
    create: (tag, attributes = {}, content = '') => {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        if (content) element.textContent = content;
        return element;
    },
    
    // Class manipulation utilities
    addClass: (element, className) => element.classList.add(className),
    removeClass: (element, className) => element.classList.remove(className),
    toggleClass: (element, className) => element.classList.toggle(className),
    hasClass: (element, className) => element.classList.contains(className),
    
    // Content manipulation
    setText: (element, text) => element.textContent = text,
    setHTML: (element, html) => element.innerHTML = html,
    
    // Event handling
    on: (element, event, handler, options = {}) => {
        element.addEventListener(event, handler, options);
    },
    
    off: (element, event, handler) => {
        element.removeEventListener(event, handler);
    }
};

// String formatting utilities
const Format = {
    // Format time in seconds to MM:SS format
    time: (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    
    // Capitalize first letter of each word
    title: (str) => {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    },
    
    // Truncate text with ellipsis
    truncate: (text, maxLength) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
};

// Template generation utilities
const Template = {
    // Generate playlist item HTML with Tailwind classes
    playlistItem: (video, index) => {
        return `
            <div class="playlist-item playlist-item-hover bg-white rounded-lg border border-blue-100 p-4 cursor-pointer relative group transition-all duration-300 hover:shadow-lg hover:border-blue-200" data-index="${index}" data-id="${video.id}">
                <div class="flex items-center space-x-4">
                    <div class="flex-shrink-0">
                        <div class="item-number w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-sm">
                            ${index + 1}
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="item-title text-slate-900 font-medium text-sm mb-1 truncate">
                            ${video.title}
                        </h4>
                    </div>
                    <div class="item-status flex-shrink-0">
                        <span class="play-icon text-blue-600 text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            ▶
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
};

// Validation utilities
const Validate = {
    // Check if element exists
    element: (element) => element !== null && element !== undefined,
    
    // Check if video source is valid
    videoSource: (src) => {
        return src && (
            src.startsWith('http') || 
            src.startsWith('./') || 
            src.startsWith('../') || 
            src.startsWith('assets/') ||
            src.includes('.mp4') ||
            src.includes('.webm') ||
            src.includes('.ogg')
        );
    },
    
    // Check if object has required properties
    hasProperties: (obj, requiredProps) => {
        return requiredProps.every(prop => obj.hasOwnProperty(prop));
    }
};

// Animation utilities
const Animate = {
    // Fade in element
    fadeIn: (element, duration = 300) => {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = performance.now();
        
        const fade = (timestamp) => {
            const elapsed = timestamp - start;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                element.style.opacity = progress;
                requestAnimationFrame(fade);
            } else {
                element.style.opacity = '1';
            }
        };
        
        requestAnimationFrame(fade);
    },
    
    // Add smooth transition class
    addTransition: (element, property = 'all', duration = '0.3s') => {
        element.style.transition = `${property} ${duration} ease`;
    }
};

// Local storage utilities
const Storage = {
    // Save data to localStorage
    save: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage save failed:', error);
            return false;
        }
    },
    
    // Load data from localStorage
    load: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage load failed:', error);
            return defaultValue;
        }
    },
    
    // Remove data from localStorage
    remove: (key) => {
        localStorage.removeItem(key);
    }
};

// Error handling utilities
const ErrorHandler = {
    // Log error with context
    log: (error, context = '') => {
        console.error(`[Video Playlist Error] ${context}:`, error);
    },
    
    // Show user-friendly error message
    show: (message, container) => {
        const errorElement = DOM.create('div', {
            class: 'error-message'
        }, message);
        
        if (container) {
            DOM.setHTML(container, '');
            container.appendChild(errorElement);
        }
    }
};

// Network utilities
const Network = {
    // Check if device is online
    isOnline: () => navigator.onLine,
    
    // Check connectivity to specific URL
    async checkConnectivity(url, timeout = 5000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-cache'
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    },
    
    // Get network connection info
    getConnectionInfo() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt,
                saveData: conn.saveData
            };
        }
        return null;
    }
};

// API utilities
const APIUtils = {
    // Show connection status in UI
    showConnectionStatus(status, message = null) {
        const statusElement = DOM.select('#api-status');
        if (!statusElement) return;
        
        const statusConfig = {
            connected: {
                icon: '✅',
                color: 'text-green-600 bg-green-50',
                message: message || 'Terhubung ke server backend'
            },
            offline: {
                icon: '📡',
                color: 'text-yellow-600 bg-yellow-50',
                message: message || 'Mode offline - data lokal'
            },
            loading: {
                icon: '⏳',
                color: 'text-blue-600 bg-blue-50',
                message: message || 'Memuat data...'
            },
            error: {
                icon: '❌',
                color: 'text-red-600 bg-red-50',
                message: message || 'Koneksi bermasalah'
            },
            retrying: {
                icon: '🔄',
                color: 'text-orange-600 bg-orange-50',
                message: message || 'Mencoba lagi...'
            }
        };
        
        const config = statusConfig[status] || statusConfig.error;
        statusElement.className = `text-xs px-3 py-1 rounded-full ${config.color}`;
        statusElement.innerHTML = `<span>${config.icon} ${config.message}</span>`;
    },
    
    // Format API error for user display
    formatError(error) {
        if (error.message.includes('fetch')) {
            return 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
        } else if (error.message.includes('timeout')) {
            return 'Server tidak merespons. Coba lagi nanti.';
        } else if (error.message.includes('parse')) {
            return 'Format data tidak valid dari server.';
        } else {
            return 'Terjadi kesalahan tidak dikenal.';
        }
    },
    
    // Check if URL is valid API endpoint
    isValidAPIUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }
};

// Loading utilities
const Loading = {
    // Show loading spinner in element
    show(element, message = 'Memuat...') {
        if (!element) return;
        
        element.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-slate-600 text-sm">${message}</p>
            </div>
        `;
    },
    
    // Hide loading spinner
    hide(element) {
        if (!element) return;
        // This will be replaced by actual content
    },
    
    // Show loading overlay on video
    showVideoLoading() {
        const overlay = DOM.select('#loading-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }
    },
    
    // Hide loading overlay on video
    hideVideoLoading() {
        const overlay = DOM.select('#loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }
    }
};

// Retry utilities
const Retry = {
    // Retry function with exponential backoff
    async withBackoff(fn, maxAttempts = 3, baseDelay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw error;
                }
                
                const delay = baseDelay * Math.pow(2, attempt - 1);
                console.log(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    },
    
    // Retry with user feedback
    async withFeedback(fn, element, maxAttempts = 3) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                if (element) {
                    Loading.show(element, `Mencoba... (${attempt}/${maxAttempts})`);
                }
                
                const result = await fn();
                return result;
            } catch (error) {
                if (attempt === maxAttempts) {
                    if (element) {
                        element.innerHTML = `
                            <div class="text-center p-4">
                                <p class="text-red-600 mb-2">❌ Gagal setelah ${maxAttempts} percobaan</p>
                                <p class="text-sm text-slate-600">${APIUtils.formatError(error)}</p>
                            </div>
                        `;
                    }
                    throw error;
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
};

// Configuration object for app settings
const Config = {
    // Tailwind CSS classes used throughout the app
    classes: {
        active: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg',
        activeNumber: 'bg-white text-blue-600',
        activeTitle: 'text-white',
        activeDuration: 'text-blue-100',
        activePlayIcon: 'text-white opacity-100',
        playing: 'pulse-blue',
        loading: 'opacity-60 pointer-events-none',
        error: 'error-display',
        hidden: 'hidden',
        loadingOverlay: 'flex',
        loadingOverlayHidden: 'hidden'
    },
    
    // Video player settings
    video: {
        preload: 'metadata',
        controls: true,
        autoplay: false
    },
    
    // Storage keys
    storage: {
        lastPlayed: 'video_playlist_last_played',
        volume: 'video_playlist_volume',
        playbackRate: 'video_playlist_playback_rate',
        apiCache: 'video_playlist_api_cache'
    },
    
    // UI Messages
    messages: {
        selectVideo: 'Pilih video untuk memulai pembelajaran',
        videoLoading: 'Memuat video...',
        videoError: 'Terjadi kesalahan saat memuat video',
        noVideoData: 'Data video tidak ditemukan',
        connectionError: 'Gagal terhubung ke server backend',
        retryLoading: 'Mencoba memuat ulang...'
    }
};