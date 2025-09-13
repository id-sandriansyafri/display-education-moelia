/**
 * API Service Class for Education RSIA MOELIA
 * Handles all backend communication with fallback to local data
 */

class APIService {
    constructor() {
        this.cache = new Map();
        this.isOnline = navigator.onLine;
        this.setupNetworkListeners();
    }

    // Setup network connectivity listeners
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            API_STATUS.update('connected', 'Koneksi internet tersambung kembali');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            API_STATUS.update('offline', 'Tidak ada koneksi internet');
        });
    }

    // Main method to fetch videos with fallback
    async fetchVideos(params = {}) {
        API_STATUS.update('loading', 'Memuat data video...');
        
        try {
            // Try to fetch from API first
            const apiData = await this.fetchFromAPI(params);
            if (apiData) {
                API_STATUS.update('connected');
                return this.standardizeVideoData(apiData);
            }
        } catch (error) {
            console.warn('[API] Backend unavailable, trying fallback:', error.message);
        }

        // Fallback to local JSON data
        try {
            const localData = await this.fetchFromLocal();
            API_STATUS.update('offline', 'Menggunakan data lokal (server tidak tersedia)');
            return this.standardizeVideoData(localData);
        } catch (fallbackError) {
            API_STATUS.update('error', 'Gagal memuat data video');
            throw new Error(`${API_CONFIG.ERRORS.FALLBACK_FAILED}: ${fallbackError.message}`);
        }
    }

    // Fetch data from backend API
    async fetchFromAPI(params = {}, retryCount = 0) {
        const url = URL_BUILDER.videos(params);
        const cacheKey = this.getCacheKey(url);

        // Check cache first
        if (API_CONFIG.CACHE.ENABLED && this.isCacheValid(cacheKey)) {
            console.log('[API] Using cached data');
            return this.cache.get(cacheKey).data;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST.TIMEOUT);

            const response = await fetch(url, {
                method: 'GET',
                headers: API_CONFIG.REQUEST.HEADERS,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Validate response structure
            if (!this.validateAPIResponse(data)) {
                throw new Error(API_CONFIG.ERRORS.INVALID_RESPONSE);
            }

            // Cache successful response
            if (API_CONFIG.CACHE.ENABLED) {
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
            }

            return data;

        } catch (error) {
            // Handle specific error types
            if (error.name === 'AbortError') {
                throw new Error(API_CONFIG.ERRORS.TIMEOUT_ERROR);
            } else if (error instanceof SyntaxError) {
                throw new Error(API_CONFIG.ERRORS.PARSE_ERROR);
            } else if (error.message.includes('Failed to fetch')) {
                throw new Error(API_CONFIG.ERRORS.NETWORK_ERROR);
            }

            // Retry logic
            if (retryCount < API_CONFIG.REQUEST.RETRY_ATTEMPTS) {
                API_STATUS.update('retrying', `Mencoba lagi... (${retryCount + 1}/${API_CONFIG.REQUEST.RETRY_ATTEMPTS})`);
                await this.delay(API_CONFIG.REQUEST.RETRY_DELAY);
                return this.fetchFromAPI(params, retryCount + 1);
            }

            throw error;
        }
    }

    // Fetch data from local JSON file
    async fetchFromLocal() {
        try {
            const response = await fetch(API_CONFIG.FALLBACK.LOCAL_DATA_PATH);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error(API_CONFIG.ERRORS.NO_DATA);
            }

            // Return in API response format for consistency
            return {
                success: true,
                videos: data,
                message: 'Data loaded from local file'
            };

        } catch (error) {
            console.error('[API] Local fallback failed:', error);
            throw error;
        }
    }

    // Validate API response structure
    validateAPIResponse(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // Check if it has success field
        if (!data.hasOwnProperty(API_CONFIG.RESPONSE.SUCCESS_FIELD)) {
            return false;
        }

        // If successful, check for data field
        if (data[API_CONFIG.RESPONSE.SUCCESS_FIELD]) {
            return data.hasOwnProperty(API_CONFIG.RESPONSE.DATA_FIELD) && 
                   Array.isArray(data[API_CONFIG.RESPONSE.DATA_FIELD]);
        }

        // If not successful, should have error message
        return data.hasOwnProperty(API_CONFIG.RESPONSE.ERROR_FIELD);
    }

    // Standardize video data format
    standardizeVideoData(apiResponse) {
        let videos = [];

        // Handle API response format
        if (apiResponse.success && apiResponse.videos) {
            videos = apiResponse.videos;
        }
        // Handle direct array format (from local JSON)
        else if (Array.isArray(apiResponse)) {
            videos = apiResponse;
        }
        // Handle wrapped array format
        else if (apiResponse.videos && Array.isArray(apiResponse.videos)) {
            videos = apiResponse.videos;
        }

        // Ensure each video has required properties
        return videos.map(video => ({
            id: video.id || Date.now() + Math.random(),
            title: video.title || 'Untitled Video',
            description: video.description || 'No description available',
            src: video.src || video.url || '',
            duration: this.parseDuration(video.duration),
            thumbnail: video.thumbnail || '',
            category: video.category || 'Uncategorized',
            level: video.level || 'Beginner',
            instructor: video.instructor || 'Unknown',
            tags: Array.isArray(video.tags) ? video.tags : [],
            status: video.status || 'active'
        }));
    }

    // Parse duration from various formats
    parseDuration(duration) {
        if (typeof duration === 'number') {
            return duration;
        }
        
        if (typeof duration === 'string') {
            // Try to parse MM:SS format
            const timeParts = duration.split(':');
            if (timeParts.length === 2) {
                const minutes = parseInt(timeParts[0], 10) || 0;
                const seconds = parseInt(timeParts[1], 10) || 0;
                return minutes * 60 + seconds;
            }
            
            // Try to parse as number
            const parsed = parseInt(duration, 10);
            return isNaN(parsed) ? 0 : parsed;
        }

        return 0;
    }

    // Health check method
    async healthCheck() {
        try {
            const url = URL_BUILDER.healthCheck();
            const response = await fetch(url, {
                method: 'GET',
                headers: API_CONFIG.REQUEST.HEADERS,
                timeout: 5000
            });

            return {
                status: response.ok ? 'healthy' : 'unhealthy',
                responseTime: Date.now(),
                statusCode: response.status
            };
        } catch (error) {
            return {
                status: 'unavailable',
                error: error.message
            };
        }
    }

    // Cache management methods
    getCacheKey(url) {
        return API_CONFIG.CACHE.KEY_PREFIX + btoa(url);
    }

    isCacheValid(cacheKey) {
        if (!this.cache.has(cacheKey)) {
            return false;
        }

        const cached = this.cache.get(cacheKey);
        const now = Date.now();
        return (now - cached.timestamp) < API_CONFIG.CACHE.DURATION;
    }

    clearCache() {
        this.cache.clear();
        console.log('[API] Cache cleared');
    }

    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Error handling helper
    handleAPIError(error, context = 'API Request') {
        console.error(`[API Error] ${context}:`, error);
        
        // Update status based on error type
        if (error.message.includes('network') || error.message.includes('fetch')) {
            API_STATUS.update('offline', 'Tidak dapat terhubung ke server');
        } else if (error.message.includes('timeout')) {
            API_STATUS.update('error', 'Server tidak merespons');
        } else {
            API_STATUS.update('error', 'Terjadi kesalahan');
        }

        return {
            success: false,
            error: error.message,
            context: context
        };
    }

    // Static method for quick video fetching
    static async fetchVideos(params = {}) {
        const apiService = new APIService();
        return await apiService.fetchVideos(params);
    }

    // Static method for error handling
    static handleError(error, context = 'API Operation') {
        const apiService = new APIService();
        return apiService.handleAPIError(error, context);
    }
}

// Create global instance
const API = new APIService();

// Expose to global scope
window.APIService = APIService;
window.API = API;

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIService, API };
}