/**
 * API Configuration for Education RSIA MOELIA
 * Centralized configuration for backend API integration
 */

// API Configuration Object
const API_CONFIG = {
    // Base URL for backend API (Laragon custom setup)
    BASE_URL: 'http://localhost:81/video-playlist-app/backend/api/',
    
    // API Endpoints
    ENDPOINTS: {
        VIDEOS: 'videos.php',
        CATEGORIES: 'categories.php',
        HEALTH_CHECK: 'health.php'
    },
    
    // Request Configuration
    REQUEST: {
        TIMEOUT: 10000,      // 10 seconds timeout
        RETRY_ATTEMPTS: 3,   // Number of retry attempts
        RETRY_DELAY: 1000,   // Delay between retries (ms)
        HEADERS: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    },
    
    // Response Configuration
    RESPONSE: {
        SUCCESS_FIELD: 'success',
        DATA_FIELD: 'videos',
        MESSAGE_FIELD: 'message',
        ERROR_FIELD: 'error'
    },
    
    // Cache Configuration
    CACHE: {
        ENABLED: true,
        DURATION: 5 * 60 * 1000,  // 5 minutes in milliseconds
        KEY_PREFIX: 'education_rsia_api_'
    },
    
    // Fallback Configuration
    FALLBACK: {
        ENABLED: true,
        LOCAL_DATA_PATH: 'data/videos.json',
        USE_LOCAL_ON_FAILURE: true
    },
    
    // Status Configuration
    STATUS: {
        MESSAGES: {
            CONNECTED: '✅ Terhubung ke server backend',
            OFFLINE: '📡 Mode offline - menggunakan data lokal',
            LOADING: '⏳ Memuat data dari server...',
            ERROR: '❌ Gagal terhubung ke server',
            RETRYING: '🔄 Mencoba kembali...'
        },
        COLORS: {
            CONNECTED: 'text-green-600',
            OFFLINE: 'text-yellow-600',
            LOADING: 'text-blue-600',
            ERROR: 'text-red-600',
            RETRYING: 'text-orange-600'
        }
    },
    
    // Error Messages (Indonesian)
    ERRORS: {
        NETWORK_ERROR: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        TIMEOUT_ERROR: 'Permintaan timeout. Server tidak merespons dalam waktu yang ditentukan.',
        PARSE_ERROR: 'Error parsing response dari server.',
        INVALID_RESPONSE: 'Response dari server tidak valid.',
        SERVER_ERROR: 'Server mengalami kesalahan internal.',
        NO_DATA: 'Tidak ada data video yang ditemukan.',
        FALLBACK_FAILED: 'Gagal memuat data lokal sebagai fallback.'
    }
};

// Environment Detection
const ENV_CONFIG = {
    // Detect current environment
    detectEnvironment() {
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        if (hostname === 'localhost' && port === '8000') {
            return 'development';
        } else if (hostname === 'localhost' && port === '81') {
            return 'laragon';
        } else if (hostname.includes('127.0.0.1')) {
            return 'local';
        } else {
            return 'production';
        }
    },
    
    // Get environment-specific configuration
    getConfig() {
        const env = this.detectEnvironment();
        
        const configs = {
            development: {
                ...API_CONFIG,
                BASE_URL: 'http://localhost:81/video-playlist-app/backend/api/',
                REQUEST: {
                    ...API_CONFIG.REQUEST,
                    TIMEOUT: 15000  // Longer timeout for development
                }
            },
            laragon: {
                ...API_CONFIG,
                BASE_URL: 'http://localhost:81/video-playlist-app/backend/api/'
            },
            local: {
                ...API_CONFIG,
                BASE_URL: 'http://127.0.0.1:81/video-playlist-app/backend/api/'
            },
            production: {
                ...API_CONFIG,
                BASE_URL: '/backend/api/',  // Relative URL for production
                CACHE: {
                    ...API_CONFIG.CACHE,
                    DURATION: 15 * 60 * 1000  // 15 minutes cache in production
                }
            }
        };
        
        return configs[env] || configs.development;
    }
};

// Export configuration based on environment
const CONFIG = ENV_CONFIG.getConfig();

// URL Builder Utility
const URL_BUILDER = {
    // Build full API URL
    build(endpoint, params = {}) {
        let url = CONFIG.BASE_URL + endpoint;
        
        const queryParams = new URLSearchParams(params);
        if (queryParams.toString()) {
            url += '?' + queryParams.toString();
        }
        
        return url;
    },
    
    // Build URL for specific video endpoint
    videos(params = {}) {
        return this.build(CONFIG.ENDPOINTS.VIDEOS, params);
    },
    
    // Build URL for categories endpoint
    categories(params = {}) {
        return this.build(CONFIG.ENDPOINTS.CATEGORIES, params);
    },
    
    // Build health check URL
    healthCheck() {
        return this.build(CONFIG.ENDPOINTS.HEALTH_CHECK);
    }
};

// API Status Manager
const API_STATUS = {
    current: 'loading',
    lastCheck: null,
    
    // Update status
    update(status, message = null) {
        this.current = status;
        this.lastCheck = new Date();
        
        // Update UI status indicator
        this.updateUI(status, message);
        
        // Log status change
        console.log(`[API Status] ${status.toUpperCase()}: ${message || CONFIG.STATUS.MESSAGES[status.toUpperCase()]}`);
    },
    
    // Update UI status indicator
    updateUI(status, message = null) {
        const statusElement = DOM.select('#api-status');
        if (!statusElement) return;
        
        const statusMessage = message || CONFIG.STATUS.MESSAGES[status.toUpperCase()];
        const statusColor = CONFIG.STATUS.COLORS[status.toUpperCase()];
        
        statusElement.innerHTML = `<span class="${statusColor}">${statusMessage}</span>`;
    },
    
    // Check if API is connected
    isConnected() {
        return this.current === 'connected';
    },
    
    // Check if API is offline
    isOffline() {
        return this.current === 'offline';
    }
};

// Expose global variables for other scripts
window.API_CONFIG = CONFIG;
window.URL_BUILDER = URL_BUILDER;
window.API_STATUS = API_STATUS;

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_CONFIG: CONFIG,
        URL_BUILDER,
        API_STATUS
    };
}