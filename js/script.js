/**
 * Video Playlist Application
 * Main application logic following DRY principles
 */

class VideoPlaylistApp {
    constructor() {
        this.currentVideoIndex = 0;
        this.videos = [];
        this.elements = this.initializeElements();
        this.isPlaying = false;
        
        this.init();
    }

    // Initialize DOM elements using utility functions
    initializeElements() {
        return {
            video: DOM.select('#main-video'),
            playlist: DOM.select('#playlist'),
            currentTitle: DOM.select('#current-title'),
            currentDescription: DOM.select('#current-description'),
            currentVideoSpan: DOM.select('.current-video'),
            totalVideosSpan: DOM.select('.total-videos'),
            loadingOverlay: DOM.select('#loading-overlay')
        };
    }

    // Main initialization method
    async init() {
        try {
            await this.loadVideoData();
            this.setupEventListeners();
            this.renderPlaylist();
            this.loadLastPlayedVideo();
        } catch (error) {
            ErrorHandler.log(error, 'App initialization');
            this.handleLoadError();
        }
    }

    // Load video data from local JSON file
    async loadVideoData() {
        try {
            const response = await fetch('data/videos.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.videos = await response.json();

            if (!Array.isArray(this.videos) || this.videos.length === 0) {
                throw new Error('No video data found');
            }

            this.updateTotalVideosCount();
            console.log(`[VideoPlaylistApp] Loaded ${this.videos.length} videos from local data`);
        } catch (error) {
            ErrorHandler.log(error, 'Loading video data from local JSON');

            const errorMsg = `
                <div class="error-display p-8 m-4 rounded-lg text-center">
                    <div class="text-red-600 text-2xl font-bold mb-4">⚠️ Tidak Dapat Memuat Data Video</div>
                    <p class="text-slate-700 mb-4">Gagal memuat data video dari file lokal.</p>
                    <div class="text-left bg-white p-6 rounded-lg shadow-sm">
                        <p class="font-semibold text-slate-900 mb-3">Solusi:</p>
                        <ol class="list-decimal list-inside space-y-2 text-slate-700">
                            <li>Pastikan file <code class="bg-slate-100 px-2 py-1 rounded">data/videos.json</code> tersedia</li>
                            <li class="mt-2">Jalankan aplikasi melalui web server:
                                <br><span class="text-blue-600">📁 Double-click <code class="bg-slate-100 px-2 py-1 rounded">serve.bat</code></span>
                                <br><span class="text-blue-600">🐍 Atau jalankan: <code class="bg-slate-100 px-2 py-1 rounded">python serve.py</code></span>
                            </li>
                            <li class="mt-2">Gunakan web server lokal seperti Live Server (VS Code extension)</li>
                        </ol>
                    </div>
                    <div class="mt-4">
                        <button onclick="window.videoApp.retryLoadData()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                            🔄 Coba Lagi
                        </button>
                    </div>
                </div>
            `;

            if (this.elements.playlist) {
                this.elements.playlist.innerHTML = errorMsg;
            }

            throw error;
        }
    }

    // Set up all event listeners using event delegation where possible
    setupEventListeners() {
        // Video player events
        this.addVideoEventListeners();
        
        // Playlist events (using event delegation for better performance)
        DOM.on(this.elements.playlist, 'click', this.handlePlaylistClick.bind(this));
        
        // Keyboard navigation
        DOM.on(document, 'keydown', this.handleKeyboard.bind(this));
        
        // Window events
        DOM.on(window, 'beforeunload', this.saveCurrentState.bind(this));
    }

    // Add video-specific event listeners
    addVideoEventListeners() {
        const video = this.elements.video;
        
        DOM.on(video, 'ended', this.handleVideoEnded.bind(this));
        DOM.on(video, 'play', this.handleVideoPlay.bind(this));
        DOM.on(video, 'pause', this.handleVideoPause.bind(this));
        DOM.on(video, 'loadstart', this.handleVideoLoadStart.bind(this));
        DOM.on(video, 'canplay', this.handleVideoCanPlay.bind(this));
        DOM.on(video, 'error', this.handleVideoError.bind(this));
        DOM.on(video, 'volumechange', this.handleVolumeChange.bind(this));
    }

    // Handle playlist item clicks using event delegation
    handlePlaylistClick(event) {
        const playlistItem = event.target.closest('.playlist-item');
        if (!playlistItem) return;

        const videoIndex = parseInt(playlistItem.dataset.index);
        if (!isNaN(videoIndex) && videoIndex !== this.currentVideoIndex) {
            this.playVideo(videoIndex);
        }
    }

    // Handle keyboard navigation
    handleKeyboard(event) {
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                this.playPreviousVideo();
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.playNextVideo();
                break;
            case ' ':
                event.preventDefault();
                this.togglePlayPause();
                break;
        }
    }

    // Video event handlers
    handleVideoEnded() {
        this.playNextVideo();
    }

    handleVideoPlay() {
        this.isPlaying = true;
        this.updatePlayingState();
    }

    handleVideoPause() {
        this.isPlaying = false;
        this.updatePlayingState();
    }

    handleVideoLoadStart() {
        DOM.addClass(this.elements.video, Config.classes.loading);
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.className = this.elements.loadingOverlay.className.replace(Config.classes.loadingOverlayHidden, Config.classes.loadingOverlay);
        }
    }

    handleVideoCanPlay() {
        DOM.removeClass(this.elements.video, Config.classes.loading);
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.className = this.elements.loadingOverlay.className.replace(Config.classes.loadingOverlay, Config.classes.loadingOverlayHidden);
        }
    }

    handleVideoError(event) {
        const error = event.target.error;
        console.error('Video Error Details:', {
            code: error ? error.code : 'unknown',
            message: error ? error.message : 'unknown',
            src: event.target.src,
            readyState: event.target.readyState,
            networkState: event.target.networkState
        });
        ErrorHandler.log(error, 'Video playbook error');
        this.showVideoError(`Video Error: ${error ? error.message : 'Unknown error'}`);
    }

    handleVolumeChange() {
        Storage.save(Config.storage.volume, this.elements.video.volume);
    }

    // Core video playback methods
    playVideo(index) {
        if (!this.isValidVideoIndex(index)) return;

        this.currentVideoIndex = index;
        this.loadCurrentVideo();
        this.updateUI();
        this.updatePlaylistSelection();
    }

    playNextVideo() {
        const nextIndex = (this.currentVideoIndex + 1) % this.videos.length;
        this.playVideo(nextIndex);
    }

    playPreviousVideo() {
        const prevIndex = this.currentVideoIndex === 0 
            ? this.videos.length - 1 
            : this.currentVideoIndex - 1;
        this.playVideo(prevIndex);
    }

    togglePlayPause() {
        if (this.elements.video.paused) {
            this.elements.video.play();
        } else {
            this.elements.video.pause();
        }
    }

    // Video loading and UI updates
    loadCurrentVideo() {
        const currentVideo = this.getCurrentVideo();
        if (!currentVideo) return;

        console.log('Loading video:', currentVideo.src);

        // Clear previous source first
        this.elements.video.src = '';

        if (Validate.videoSource(currentVideo.src)) {
            // Set source and load
            this.elements.video.src = currentVideo.src;
            this.elements.video.load(); // Force reload
            console.log('Video source set to:', currentVideo.src);

            // Autoplay when video can play
            DOM.on(this.elements.video, 'canplay', () => {
                this.elements.video.play().catch(error => {
                    console.log('Autoplay blocked by browser:', error);
                });
            }, { once: true });
        } else {
            ErrorHandler.log('Invalid video source', currentVideo.src);
            this.showVideoError('Video source not available');
        }
    }

    updateUI() {
        const currentVideo = this.getCurrentVideo();
        if (!currentVideo) {
            DOM.setText(this.elements.currentTitle, Config.messages.selectVideo);
            DOM.setText(this.elements.currentDescription, 'Pilih video dari playlist untuk memulai pembelajaran.');
            return;
        }

        DOM.setText(this.elements.currentTitle, currentVideo.title);
        DOM.setText(this.elements.currentDescription, currentVideo.description);
        DOM.setText(this.elements.currentVideoSpan, this.currentVideoIndex + 1);
        
        // Restore saved volume
        this.restoreVideoSettings();
    }

    updatePlaylistSelection() {
        // Remove active classes from all items
        DOM.selectAll('.playlist-item').forEach(item => {
            // Remove active classes
            item.classList.remove('bg-gradient-to-r', 'from-blue-600', 'to-blue-700', 'text-white', 'border-blue-600', 'shadow-lg', 'pulse-blue');
            item.classList.add('bg-white', 'text-slate-900', 'border-blue-100');

            // Reset item number and text colors
            const itemNumber = item.querySelector('.item-number');
            const itemTitle = item.querySelector('.item-title');
            const itemDuration = item.querySelector('.item-duration');
            const itemCategory = item.querySelector('div.text-xs');
            const playIcon = item.querySelector('.play-icon');

            if (itemNumber) {
                itemNumber.className = 'item-number w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-sm';
            }
            if (itemTitle) {
                itemTitle.className = 'item-title text-slate-900 font-medium text-sm mb-1 truncate';
            }
            if (itemDuration) {
                itemDuration.className = 'item-duration text-slate-500 text-xs';
            }
            if (itemCategory) {
                itemCategory.className = 'text-xs text-slate-400 mt-1';
            }
            if (playIcon) {
                playIcon.className = 'play-icon text-blue-600 text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300';
            }
        });

        // Add active class to current item
        const currentItem = DOM.select(`[data-index="${this.currentVideoIndex}"]`);
        if (currentItem) {
            // Remove white background and add active classes
            currentItem.classList.remove('bg-white', 'text-slate-900', 'border-blue-100');
            currentItem.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-blue-700', 'text-white', 'border-blue-600', 'shadow-lg');
            
            // Update active item elements
            const itemNumber = currentItem.querySelector('.item-number');
            const itemTitle = currentItem.querySelector('.item-title');
            const itemDuration = currentItem.querySelector('.item-duration');
            const playIcon = currentItem.querySelector('.play-icon');
            
            if (itemNumber) {
                itemNumber.className = 'item-number w-10 h-10 ' + Config.classes.activeNumber + ' rounded-full flex items-center justify-center text-sm font-semibold';
            }
            if (itemTitle) {
                itemTitle.className = 'item-title ' + Config.classes.activeTitle + ' font-medium text-sm mb-1 truncate';
            }
            if (itemDuration) {
                itemDuration.className = 'item-duration ' + Config.classes.activeDuration + ' text-xs';
            }
            if (playIcon) {
                playIcon.className = 'play-icon ' + Config.classes.activePlayIcon + ' text-lg transition-opacity duration-300';
            }
            
            // Add active indicator
            if (!currentItem.querySelector('.active-indicator')) {
                const indicator = DOM.create('div', { class: 'active-indicator' });
                currentItem.appendChild(indicator);
            }
        }
    }

    updatePlayingState() {
        const currentItem = DOM.select(`[data-index="${this.currentVideoIndex}"]`);
        if (!currentItem) return;

        if (this.isPlaying) {
            DOM.addClass(currentItem, Config.classes.playing);
        } else {
            DOM.removeClass(currentItem, Config.classes.playing);
        }
    }

    updateTotalVideosCount() {
        DOM.setText(this.elements.totalVideosSpan, this.videos.length);
    }

    // Playlist rendering
    renderPlaylist() {
        if (!this.elements.playlist) return;

        const playlistHTML = this.videos
            .map((video, index) => Template.playlistItem(video, index))
            .join('');

        DOM.setHTML(this.elements.playlist, playlistHTML);
        
        // Add smooth animations
        DOM.selectAll('.playlist-item').forEach(item => {
            Animate.addTransition(item);
        });
    }

    // Utility methods
    getCurrentVideo() {
        return this.videos[this.currentVideoIndex];
    }

    isValidVideoIndex(index) {
        return index >= 0 && index < this.videos.length;
    }

    // State persistence
    saveCurrentState() {
        const state = {
            currentVideoIndex: this.currentVideoIndex,
            currentTime: this.elements.video.currentTime,
            volume: this.elements.video.volume
        };
        Storage.save(Config.storage.lastPlayed, state);
    }

    loadLastPlayedVideo() {
        const savedState = Storage.load(Config.storage.lastPlayed);
        if (savedState && this.isValidVideoIndex(savedState.currentVideoIndex)) {
            this.currentVideoIndex = savedState.currentVideoIndex;
            this.loadCurrentVideo();
            this.updateUI();
            this.updatePlaylistSelection();

            // Restore playback position and autoplay
            DOM.on(this.elements.video, 'loadedmetadata', () => {
                if (savedState.currentTime) {
                    this.elements.video.currentTime = savedState.currentTime;
                }
                // Autoplay video
                this.elements.video.play().catch(error => {
                    console.log('Autoplay blocked by browser:', error);
                });
            }, { once: true });
        } else {
            // Load first video by default and autoplay
            this.playVideo(0);
            DOM.on(this.elements.video, 'loadedmetadata', () => {
                this.elements.video.play().catch(error => {
                    console.log('Autoplay blocked by browser:', error);
                });
            }, { once: true });
        }
    }

    restoreVideoSettings() {
        const savedVolume = Storage.load(Config.storage.volume, 1.0);
        this.elements.video.volume = savedVolume;
    }

    // Error handling
    handleLoadError() {
        const errorMessage = 'Failed to load video playlist. Please check your connection and try again.';
        ErrorHandler.show(errorMessage, this.elements.playlist);
    }

    showVideoError(message = 'Video playback failed') {
        DOM.setText(this.elements.currentTitle, 'Error');
        DOM.setText(this.elements.currentDescription, message);
    }

    // Retry loading data (called from error UI button)
    async retryLoadData() {
        console.log('[VideoPlaylistApp] Retrying data load...');
        try {
            // Show loading state
            if (this.elements.playlist) {
                this.elements.playlist.innerHTML = `
                    <div class="text-center p-8">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p class="text-slate-600">Mencoba memuat ulang data video...</p>
                    </div>
                `;
            }

            // Attempt to reload data
            await this.loadVideoData();
            this.renderPlaylist();
            this.loadLastPlayedVideo();

            console.log('[VideoPlaylistApp] Data reload successful');
        } catch (error) {
            console.error('[VideoPlaylistApp] Retry failed:', error);
            // Error handling is already done in loadVideoData()
        }
    }

    // Error handling for local data loading
    handleLoadError() {
        const errorMessage = 'Gagal memuat playlist video dari file lokal. Periksa file data/videos.json dan coba lagi.';
        ErrorHandler.show(errorMessage, this.elements.playlist);
    }
}

// Application initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check for required DOM elements before initializing
    const requiredElements = ['#main-video', '#playlist', '#current-title'];
    const missingElements = requiredElements.filter(selector => !DOM.select(selector));
    
    if (missingElements.length > 0) {
        ErrorHandler.log(`Missing required elements: ${missingElements.join(', ')}`, 'DOM Check');
        return;
    }

    // Initialize the application
    try {
        window.videoApp = new VideoPlaylistApp();
    } catch (error) {
        ErrorHandler.log(error, 'Application startup');
    }
});

// Service worker registration (for future offline support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker registration would go here
        // navigator.serviceWorker.register('/sw.js');
    });
}