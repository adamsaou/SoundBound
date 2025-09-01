// Main Application Entry Point
import { AudioPlayer } from './audio-player.js';
import { StyleCustomizer } from './style-customizer.js';
import { AuthManager } from './auth-manager.js';
import { PlaylistManager } from './playlist-manager.js';

class SoundBoundApp {
  constructor() {
    this.isInitialized = false;
    this.toastQueue = [];
    
    this.initializeApp();
  }

  async initializeApp() {
    try {
      // Show loading indicator
      this.showLoading(true);
      
      // Initialize core components
      this.audioPlayer = new AudioPlayer();
      this.styleCustomizer = new StyleCustomizer();
      this.authManager = new AuthManager();
      this.playlistManager = new PlaylistManager(this.audioPlayer);
      
      // Make components globally accessible for cross-component communication
      window.audioPlayer = this.audioPlayer;
      window.styleCustomizer = this.styleCustomizer;
      window.authManager = this.authManager;
      window.playlistManager = this.playlistManager;
      
      // Set up global toast function
      window.showToast = (message, type) => this.showToast(message, type);
      
      // Initialize toast system
      this.initializeToastSystem();
      
      // Add demo tracks for better UX
      this.addDemoTracks();
      
      // Mark as initialized
      this.isInitialized = true;
      
      // Hide loading indicator
      this.showLoading(false);
      
      // Show welcome message
      this.showToast('Welcome to SoundBound! 🎵', 'success');
      
      console.log('SoundBound initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SoundBound:', error);
      this.showToast('Failed to initialize application', 'error');
      this.showLoading(false);
    }
  }

  // Demo Content
  addDemoTracks() {
    // Add some demo tracks with placeholder URLs
    // In a real app, these would be actual audio files
    const demoTracks = [
      {
        id: 1,
        name: 'Ambient Waves',
        artist: 'Nature Sounds',
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
        duration: 180
      },
      {
        id: 2,
        name: 'Digital Dreams',
        artist: 'Synthwave Collective',
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
        duration: 240
      },
      {
        id: 3,
        name: 'Coffee Shop Jazz',
        artist: 'Smooth Jazz Trio',
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
        duration: 195
      }
    ];
    
    // Note: These are placeholder tracks. Users will add their own music files.
    // The demo tracks help showcase the UI without requiring immediate file uploads.
  }

  // Toast Notification System
  initializeToastSystem() {
    this.toastContainer = document.getElementById('toastContainer');
  }

  showToast(message, type = 'info', duration = 4000) {
    const toast = this.createToastElement(message, type);
    this.toastContainer.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    // Auto-remove toast
    setTimeout(() => {
      this.removeToast(toast);
    }, duration);
    
    // Add click to dismiss
    toast.addEventListener('click', () => {
      this.removeToast(toast);
    });
  }

  createToastElement(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = this.getToastIcon(type);
    
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        ${icon}
        <span>${this.escapeHtml(message)}</span>
      </div>
    `;
    
    return toast;
  }

  getToastIcon(type) {
    const icons = {
      success: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22,4 12,14.01 9,11.01"/>
        </svg>
      `,
      error: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      `,
      info: `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      `
    };
    
    return icons[type] || icons.info;
  }

  removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // Loading Management
  showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (show) {
      loadingIndicator.classList.add('active');
    } else {
      loadingIndicator.classList.remove('active');
    }
  }

  // Utility Methods
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Error Handling
  handleGlobalError(error) {
    console.error('Global error:', error);
    this.showToast('An unexpected error occurred', 'error');
  }

  // Cleanup
  destroy() {
    if (this.audioPlayer) {
      this.audioPlayer.destroy();
    }
    
    if (this.playlistManager) {
      this.playlistManager.destroy();
    }
    
    // Clean up Firebase listeners
    if (window.firebaseService) {
      window.firebaseService.cleanup();
    }
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.soundBoundApp = new SoundBoundApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.soundBoundApp) {
    window.soundBoundApp.destroy();
  }
});