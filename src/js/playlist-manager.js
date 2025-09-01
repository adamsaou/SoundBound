// Playlist Management
import { firebaseService } from './firebase-service.js';

class PlaylistManager {
  constructor(audioPlayer) {
    this.audioPlayer = audioPlayer;
    this.playlist = [];
    this.filteredPlaylist = [];
    this.searchTerm = '';
    
    this.initializeElements();
    this.bindEvents();
    this.loadSavedPlaylist();
  }

  initializeElements() {
    this.playlistContainer = document.getElementById('playlist');
    this.addMusicBtn = document.getElementById('addMusicBtn');
    this.fileInput = document.getElementById('fileInput');
    this.searchInput = document.getElementById('searchInput');
  }

  bindEvents() {
    // File input events
    this.addMusicBtn.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
    
    // Search functionality
    this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    
    // Drag and drop support
    this.setupDragAndDrop();
  }

  // File Handling
  handleFileSelection(event) {
    const files = Array.from(event.target.files);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length === 0) {
      this.showToast('Please select valid audio files', 'error');
      return;
    }
    
    this.addFilesToPlaylist(audioFiles);
    event.target.value = ''; // Reset file input
  }

  addFilesToPlaylist(files) {
    const newTracks = files.map((file, index) => {
      const url = URL.createObjectURL(file);
      const name = this.extractTrackName(file.name);
      const artist = this.extractArtistName(file.name);
      
      return {
        id: Date.now() + index,
        name,
        artist,
        url,
        duration: 0, // Will be updated when metadata loads
        file: file
      };
    });
    
    this.playlist.push(...newTracks);
    this.updateFilteredPlaylist();
    this.renderPlaylist();
    this.audioPlayer.setPlaylist(this.playlist);
    this.savePlaylist();
    
    // Load metadata for duration
    this.loadTrackMetadata(newTracks);
    
    this.showToast(`Added ${newTracks.length} song(s) to playlist`, 'success');
  }

  async loadTrackMetadata(tracks) {
    for (const track of tracks) {
      try {
        const audio = new Audio(track.url);
        audio.addEventListener('loadedmetadata', () => {
          track.duration = audio.duration;
          this.renderPlaylist(); // Re-render to show duration
        });
        audio.load();
      } catch (error) {
        console.error('Error loading metadata for track:', track.name, error);
      }
    }
  }

  // Search Functionality
  handleSearch(searchTerm) {
    this.searchTerm = searchTerm.toLowerCase();
    this.updateFilteredPlaylist();
    this.renderPlaylist();
  }

  updateFilteredPlaylist() {
    if (!this.searchTerm) {
      this.filteredPlaylist = [...this.playlist];
    } else {
      this.filteredPlaylist = this.playlist.filter(track => 
        track.name.toLowerCase().includes(this.searchTerm) ||
        track.artist.toLowerCase().includes(this.searchTerm)
      );
    }
  }

  // Playlist Rendering
  renderPlaylist() {
    if (this.filteredPlaylist.length === 0) {
      this.renderEmptyState();
      return;
    }
    
    const playlistHTML = this.filteredPlaylist.map((track, index) => {
      const originalIndex = this.playlist.indexOf(track);
      const isActive = originalIndex === this.audioPlayer.currentTrackIndex;
      const duration = track.duration ? this.formatDuration(track.duration) : '--:--';
      
      return `
        <div class="playlist-item ${isActive ? 'active' : ''}" data-index="${originalIndex}">
          <span class="track-number">${originalIndex + 1}</span>
          <div class="track-info">
            <h4>${this.escapeHtml(track.name)}</h4>
            <p>${this.escapeHtml(track.artist)}</p>
          </div>
          <span class="track-duration">${duration}</span>
          <button class="remove-track-btn" data-index="${originalIndex}" aria-label="Remove track">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');
    
    this.playlistContainer.innerHTML = playlistHTML;
    this.bindPlaylistEvents();
  }

  renderEmptyState() {
    this.playlistContainer.innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <h3>No songs in playlist</h3>
        <p>${this.searchTerm ? 'No songs match your search' : 'Add some music to get started'}</p>
      </div>
    `;
  }

  bindPlaylistEvents() {
    // Track selection
    const playlistItems = this.playlistContainer.querySelectorAll('.playlist-item');
    playlistItems.forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.remove-track-btn')) {
          const index = parseInt(item.dataset.index);
          this.selectTrack(index);
        }
      });
    });
    
    // Track removal
    const removeButtons = this.playlistContainer.querySelectorAll('.remove-track-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        this.removeTrack(index);
      });
    });
  }

  // Playlist Actions
  selectTrack(index) {
    this.audioPlayer.currentTrackIndex = index;
    this.audioPlayer.loadTrack(index);
    this.renderPlaylist(); // Update active state
  }

  removeTrack(index) {
    const track = this.playlist[index];
    if (!track) return;
    
    // Revoke object URL to free memory
    if (track.url.startsWith('blob:')) {
      URL.revokeObjectURL(track.url);
    }
    
    this.audioPlayer.removeFromPlaylist(index);
    this.playlist.splice(index, 1);
    
    this.updateFilteredPlaylist();
    this.renderPlaylist();
    this.savePlaylist();
    
    this.showToast('Song removed from playlist', 'info');
  }

  clearPlaylist() {
    // Revoke all object URLs
    this.playlist.forEach(track => {
      if (track.url.startsWith('blob:')) {
        URL.revokeObjectURL(track.url);
      }
    });
    
    this.playlist = [];
    this.filteredPlaylist = [];
    this.audioPlayer.setPlaylist([]);
    this.renderPlaylist();
    this.savePlaylist();
    
    this.showToast('Playlist cleared', 'info');
  }

  // Drag and Drop Support
  setupDragAndDrop() {
    const dropZone = document.querySelector('.playlist-section');
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
      if (!dropZone.contains(e.relatedTarget)) {
        dropZone.classList.remove('drag-over');
      }
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      const files = Array.from(e.dataTransfer.files);
      const audioFiles = files.filter(file => file.type.startsWith('audio/'));
      
      if (audioFiles.length > 0) {
        this.addFilesToPlaylist(audioFiles);
      } else {
        this.showToast('Please drop valid audio files', 'error');
      }
    });
  }

  // Data Persistence
  async savePlaylist() {
    try {
      // Save to localStorage for offline access
      const playlistData = this.playlist.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artist,
        duration: track.duration
        // Note: We don't save the URL or file object for security/storage reasons
      }));
      
      localStorage.setItem('soundbound-playlist', JSON.stringify(playlistData));
      
      // Save to Firebase if user is authenticated
      if (firebaseService.currentUser) {
        const result = await firebaseService.savePlaylist(
          firebaseService.currentUser.uid,
          playlistData
        );
        
        if (!result.success) {
          console.error('Failed to save playlist to cloud:', result.error);
        }
      }
    } catch (error) {
      console.error('Error saving playlist:', error);
    }
  }

  async loadSavedPlaylist() {
    try {
      // Load from localStorage first
      const localPlaylist = localStorage.getItem('soundbound-playlist');
      if (localPlaylist) {
        const playlistData = JSON.parse(localPlaylist);
        // Note: We can't restore file URLs, so this is mainly for metadata
        this.renderPlaylist();
      }
      
      // Load from Firebase if user is authenticated
      if (firebaseService.currentUser) {
        const result = await firebaseService.getPlaylist(firebaseService.currentUser.uid);
        if (result.success && result.playlist.length > 0) {
          // Merge with local playlist or handle as needed
          this.renderPlaylist();
        }
      }
    } catch (error) {
      console.error('Error loading saved playlist:', error);
    }
  }

  // Utility Methods
  extractTrackName(filename) {
    // Remove file extension and clean up the name
    let name = filename.replace(/\.[^/.]+$/, '');
    
    // Try to extract track name from common patterns
    // Pattern: "Artist - Track Name"
    if (name.includes(' - ')) {
      name = name.split(' - ').slice(1).join(' - ');
    }
    
    // Clean up underscores and extra spaces
    name = name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    
    return name || 'Unknown Track';
  }

  extractArtistName(filename) {
    let name = filename.replace(/\.[^/.]+$/, '');
    
    // Try to extract artist from common patterns
    // Pattern: "Artist - Track Name"
    if (name.includes(' - ')) {
      const artist = name.split(' - ')[0];
      return artist.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    return 'Unknown Artist';
  }

  formatDuration(seconds) {
    if (!isFinite(seconds)) return '--:--';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showToast(message, type = 'info') {
    if (window.showToast) {
      window.showToast(message, type);
    }
  }

  // Public API
  getPlaylist() {
    return [...this.playlist];
  }

  getFilteredPlaylist() {
    return [...this.filteredPlaylist];
  }

  getCurrentTrack() {
    return this.playlist[this.audioPlayer.currentTrackIndex] || null;
  }

  // User Change Handler
  onUserChange(user) {
    if (user) {
      // User signed in, load their playlist
      this.loadSavedPlaylist();
    }
    // Note: We don't clear the playlist when user signs out
    // to maintain a good user experience
  }

  // Cleanup
  destroy() {
    // Revoke all object URLs to free memory
    this.playlist.forEach(track => {
      if (track.url.startsWith('blob:')) {
        URL.revokeObjectURL(track.url);
      }
    });
    
    this.playlist = [];
    this.filteredPlaylist = [];
  }
}

// Export the PlaylistManager class
export { PlaylistManager };