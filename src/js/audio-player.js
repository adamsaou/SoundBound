// Audio Player Core Functionality
class AudioPlayer {
  constructor() {
    this.audio = document.getElementById('audioPlayer');
    this.isPlaying = false;
    this.currentTrackIndex = 0;
    this.playlist = [];
    this.volume = 0.7;
    this.isMuted = false;
    this.isDragging = false;
    
    this.initializeElements();
    this.bindEvents();
    this.updateVolumeDisplay();
  }

  initializeElements() {
    // Control buttons
    this.playBtn = document.getElementById('playBtn');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.volumeBtn = document.getElementById('volumeBtn');
    
    // Progress elements
    this.progressBar = document.getElementById('progressBar');
    this.progressFill = document.getElementById('progressFill');
    this.progressHandle = document.getElementById('progressHandle');
    this.currentTimeDisplay = document.getElementById('currentTime');
    this.durationDisplay = document.getElementById('duration');
    
    // Volume elements
    this.volumeBar = document.getElementById('volumeBar');
    this.volumeFill = document.getElementById('volumeFill');
    this.volumeHandle = document.getElementById('volumeHandle');
    
    // Track info elements
    this.trackTitle = document.getElementById('trackTitle');
    this.trackArtist = document.getElementById('trackArtist');
    
    // Icons
    this.playIcon = this.playBtn.querySelector('.play-icon');
    this.pauseIcon = this.playBtn.querySelector('.pause-icon');
  }

  bindEvents() {
    // Control button events
    this.playBtn.addEventListener('click', () => this.togglePlay());
    this.prevBtn.addEventListener('click', () => this.previousTrack());
    this.nextBtn.addEventListener('click', () => this.nextTrack());
    this.volumeBtn.addEventListener('click', () => this.toggleMute());
    
    // Audio events
    this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.nextTrack());
    this.audio.addEventListener('error', (e) => this.handleAudioError(e));
    
    // Progress bar events
    this.progressBar.addEventListener('click', (e) => this.seekTo(e));
    this.progressBar.addEventListener('mousedown', (e) => this.startDragging(e, 'progress'));
    
    // Volume bar events
    this.volumeBar.addEventListener('click', (e) => this.setVolume(e));
    this.volumeBar.addEventListener('mousedown', (e) => this.startDragging(e, 'volume'));
    
    // Global mouse events for dragging
    document.addEventListener('mousemove', (e) => this.handleDragging(e));
    document.addEventListener('mouseup', () => this.stopDragging());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  // Playback Control Methods
  async togglePlay() {
    if (!this.audio.src) {
      this.showToast('No track selected', 'info');
      return;
    }

    try {
      if (this.isPlaying) {
        await this.pause();
      } else {
        await this.play();
      }
    } catch (error) {
      console.error('Playback error:', error);
      this.showToast('Playback error occurred', 'error');
    }
  }

  async play() {
    try {
      await this.audio.play();
      this.isPlaying = true;
      this.updatePlayButton();
      this.addPlayingAnimation();
    } catch (error) {
      console.error('Play error:', error);
      this.showToast('Unable to play audio', 'error');
    }
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.updatePlayButton();
    this.removePlayingAnimation();
  }

  previousTrack() {
    if (this.playlist.length === 0) return;
    
    this.currentTrackIndex = this.currentTrackIndex > 0 
      ? this.currentTrackIndex - 1 
      : this.playlist.length - 1;
    
    this.loadTrack(this.currentTrackIndex);
  }

  nextTrack() {
    if (this.playlist.length === 0) return;
    
    this.currentTrackIndex = this.currentTrackIndex < this.playlist.length - 1 
      ? this.currentTrackIndex + 1 
      : 0;
    
    this.loadTrack(this.currentTrackIndex);
  }

  // Track Loading Methods
  loadTrack(index) {
    if (!this.playlist[index]) return;
    
    const track = this.playlist[index];
    this.audio.src = track.url;
    this.currentTrackIndex = index;
    
    this.updateTrackInfo(track);
    this.updatePlaylistHighlight();
    
    // Auto-play if was playing
    if (this.isPlaying) {
      this.play();
    }
  }

  updateTrackInfo(track) {
    this.trackTitle.textContent = track.name || 'Unknown Track';
    this.trackArtist.textContent = track.artist || 'Unknown Artist';
  }

  // Progress Control Methods
  updateProgress() {
    if (this.isDragging) return;
    
    const currentTime = this.audio.currentTime;
    const duration = this.audio.duration;
    
    if (duration) {
      const progressPercent = (currentTime / duration) * 100;
      this.progressFill.style.width = `${progressPercent}%`;
      this.progressHandle.style.left = `${progressPercent}%`;
    }
    
    this.currentTimeDisplay.textContent = this.formatTime(currentTime);
  }

  updateDuration() {
    const duration = this.audio.duration;
    this.durationDisplay.textContent = this.formatTime(duration);
  }

  seekTo(event) {
    const rect = this.progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const newTime = percent * this.audio.duration;
    
    if (isFinite(newTime)) {
      this.audio.currentTime = newTime;
    }
  }

  // Volume Control Methods
  setVolume(event) {
    const rect = this.volumeBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    
    this.volume = percent;
    this.audio.volume = percent;
    this.isMuted = false;
    this.updateVolumeDisplay();
  }

  toggleMute() {
    if (this.isMuted) {
      this.audio.volume = this.volume;
      this.isMuted = false;
    } else {
      this.audio.volume = 0;
      this.isMuted = true;
    }
    this.updateVolumeDisplay();
  }

  updateVolumeDisplay() {
    const displayVolume = this.isMuted ? 0 : this.volume;
    const volumePercent = displayVolume * 100;
    
    this.volumeFill.style.width = `${volumePercent}%`;
    this.volumeHandle.style.left = `${volumePercent}%`;
    
    // Update volume icon
    this.updateVolumeIcon(displayVolume);
  }

  updateVolumeIcon(volume) {
    const volumeIcon = this.volumeBtn.querySelector('.volume-icon');
    
    if (volume === 0) {
      volumeIcon.innerHTML = `
        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
      `;
    } else if (volume < 0.5) {
      volumeIcon.innerHTML = `
        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      `;
    } else {
      volumeIcon.innerHTML = `
        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
      `;
    }
  }

  // Drag Handling Methods
  startDragging(event, type) {
    this.isDragging = type;
    this.handleDragging(event);
  }

  handleDragging(event) {
    if (!this.isDragging) return;
    
    if (this.isDragging === 'progress') {
      this.seekTo(event);
    } else if (this.isDragging === 'volume') {
      this.setVolume(event);
    }
  }

  stopDragging() {
    this.isDragging = false;
  }

  // Playlist Management
  setPlaylist(playlist) {
    this.playlist = playlist;
    if (playlist.length > 0 && !this.audio.src) {
      this.loadTrack(0);
    }
  }

  addToPlaylist(tracks) {
    this.playlist.push(...tracks);
    this.updatePlaylistHighlight();
  }

  removeFromPlaylist(index) {
    if (index === this.currentTrackIndex) {
      this.pause();
      this.audio.src = '';
      this.updateTrackInfo({ name: 'No track selected', artist: 'Select a song to play' });
    } else if (index < this.currentTrackIndex) {
      this.currentTrackIndex--;
    }
    
    this.playlist.splice(index, 1);
    this.updatePlaylistHighlight();
  }

  // UI Update Methods
  updatePlayButton() {
    if (this.isPlaying) {
      this.playIcon.style.display = 'none';
      this.pauseIcon.style.display = 'block';
    } else {
      this.playIcon.style.display = 'block';
      this.pauseIcon.style.display = 'none';
    }
  }

  updatePlaylistHighlight() {
    const playlistItems = document.querySelectorAll('.playlist-item');
    playlistItems.forEach((item, index) => {
      if (index === this.currentTrackIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  addPlayingAnimation() {
    const albumArt = document.querySelector('.album-art');
    albumArt.style.animation = `pulse ${2 / this.getAnimationSpeed()}s infinite`;
  }

  removePlayingAnimation() {
    const albumArt = document.querySelector('.album-art');
    albumArt.style.animation = '';
  }

  // Keyboard Shortcuts
  handleKeyboard(event) {
    // Only handle shortcuts when not typing in inputs
    if (event.target.tagName === 'INPUT') return;
    
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePlay();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.previousTrack();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextTrack();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.adjustVolume(0.1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.adjustVolume(-0.1);
        break;
      case 'KeyM':
        event.preventDefault();
        this.toggleMute();
        break;
    }
  }

  adjustVolume(delta) {
    const newVolume = Math.max(0, Math.min(1, this.volume + delta));
    this.volume = newVolume;
    this.audio.volume = newVolume;
    this.isMuted = false;
    this.updateVolumeDisplay();
  }

  // Error Handling
  handleAudioError(event) {
    console.error('Audio error:', event);
    this.showToast('Error loading audio file', 'error');
    this.pause();
  }

  // Utility Methods
  formatTime(seconds) {
    if (!isFinite(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getAnimationSpeed() {
    const root = document.documentElement;
    const speed = getComputedStyle(root).getPropertyValue('--animation-speed');
    return parseFloat(speed) || 1;
  }

  showToast(message, type = 'info') {
    // This method will be implemented by the main app
    if (window.showToast) {
      window.showToast(message, type);
    }
  }

  // Public API Methods
  getCurrentTrack() {
    return this.playlist[this.currentTrackIndex] || null;
  }

  getCurrentTime() {
    return this.audio.currentTime;
  }

  getDuration() {
    return this.audio.duration;
  }

  getVolume() {
    return this.volume;
  }

  setVolumeLevel(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this.volume;
    this.isMuted = false;
    this.updateVolumeDisplay();
  }

  // Cleanup
  destroy() {
    this.pause();
    this.audio.src = '';
  }
}

// Export the AudioPlayer class
export { AudioPlayer };