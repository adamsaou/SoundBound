// Style Customization Manager
import { firebaseService } from './firebase-service.js';

class StyleCustomizer {
  constructor() {
    this.currentPreferences = this.getDefaultPreferences();
    this.isInitialized = false;
    
    this.initializeElements();
    this.bindEvents();
    this.loadSavedPreferences();
  }

  initializeElements() {
    // Modal elements
    this.styleModal = document.getElementById('styleModal');
    this.styleBtn = document.getElementById('styleBtn');
    this.closeStyleModal = document.getElementById('closeStyleModal');
    this.resetStyleBtn = document.getElementById('resetStyleBtn');
    this.saveStyleBtn = document.getElementById('saveStyleBtn');
    
    // Theme options
    this.themeOptions = document.querySelectorAll('.theme-option');
    
    // Size options
    this.sizeOptions = document.querySelectorAll('input[name="playerSize"]');
    
    // Background options
    this.backgroundOptions = document.querySelectorAll('input[name="background"]');
    
    // Sliders
    this.fontSizeSlider = document.getElementById('fontSizeSlider');
    this.fontSizeValue = document.getElementById('fontSizeValue');
    this.animationSpeedSlider = document.getElementById('animationSpeedSlider');
    this.animationSpeedValue = document.getElementById('animationSpeedValue');
  }

  bindEvents() {
    // Modal controls
    this.styleBtn.addEventListener('click', () => this.openModal());
    this.closeStyleModal.addEventListener('click', () => this.closeModal());
    this.styleModal.addEventListener('click', (e) => {
      if (e.target === this.styleModal) this.closeModal();
    });
    
    // Theme selection
    this.themeOptions.forEach(option => {
      option.addEventListener('click', () => this.selectTheme(option.dataset.theme));
    });
    
    // Size selection
    this.sizeOptions.forEach(option => {
      option.addEventListener('change', () => this.selectSize(option.value));
    });
    
    // Background selection
    this.backgroundOptions.forEach(option => {
      option.addEventListener('change', () => this.selectBackground(option.value));
    });
    
    // Slider events
    this.fontSizeSlider.addEventListener('input', () => this.updateFontSize());
    this.animationSpeedSlider.addEventListener('input', () => this.updateAnimationSpeed());
    
    // Action buttons
    this.resetStyleBtn.addEventListener('click', () => this.resetToDefault());
    this.saveStyleBtn.addEventListener('click', () => this.savePreferences());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.styleModal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }

  // Modal Management
  openModal() {
    this.styleModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.updateModalFromPreferences();
  }

  closeModal() {
    this.styleModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Theme Management
  selectTheme(theme) {
    this.currentPreferences.theme = theme;
    this.applyTheme(theme);
    this.updateThemeSelection(theme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  updateThemeSelection(selectedTheme) {
    this.themeOptions.forEach(option => {
      if (option.dataset.theme === selectedTheme) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }

  // Size Management
  selectSize(size) {
    this.currentPreferences.playerSize = size;
    this.applySize(size);
  }

  applySize(size) {
    document.documentElement.setAttribute('data-player-size', size);
    
    const sizeMultipliers = {
      compact: 0.8,
      normal: 1,
      large: 1.2
    };
    
    document.documentElement.style.setProperty('--player-size', sizeMultipliers[size]);
  }

  // Background Management
  selectBackground(background) {
    this.currentPreferences.background = background;
    this.applyBackground(background);
  }

  applyBackground(background) {
    document.documentElement.setAttribute('data-background', background);
  }

  // Font Size Management
  updateFontSize() {
    const fontSize = this.fontSizeSlider.value;
    this.currentPreferences.fontSize = parseInt(fontSize);
    this.applyFontSize(fontSize);
    this.fontSizeValue.textContent = `${fontSize}px`;
  }

  applyFontSize(fontSize) {
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
  }

  // Animation Speed Management
  updateAnimationSpeed() {
    const speed = this.animationSpeedSlider.value;
    this.currentPreferences.animationSpeed = parseFloat(speed);
    this.applyAnimationSpeed(speed);
    this.animationSpeedValue.textContent = `${speed}x`;
  }

  applyAnimationSpeed(speed) {
    document.documentElement.style.setProperty('--animation-speed', speed);
  }

  // Preferences Management
  async loadSavedPreferences() {
    try {
      // Try to load from localStorage first (for offline use)
      const localPrefs = localStorage.getItem('soundbound-preferences');
      if (localPrefs) {
        this.currentPreferences = { ...this.getDefaultPreferences(), ...JSON.parse(localPrefs) };
        this.applyAllPreferences();
      }

      // If user is authenticated, load from Firebase
      if (firebaseService.currentUser) {
        const result = await firebaseService.getUserPreferences(firebaseService.currentUser.uid);
        if (result.success) {
          this.currentPreferences = { ...this.getDefaultPreferences(), ...result.preferences };
          this.applyAllPreferences();
          this.saveToLocalStorage();
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      this.showToast('Failed to load saved preferences', 'error');
    }
  }

  async savePreferences() {
    try {
      // Save to localStorage
      this.saveToLocalStorage();
      
      // Save to Firebase if user is authenticated
      if (firebaseService.currentUser) {
        const result = await firebaseService.saveUserPreferences(
          firebaseService.currentUser.uid, 
          this.currentPreferences
        );
        
        if (result.success) {
          this.showToast('Preferences saved successfully!', 'success');
        } else {
          this.showToast('Failed to save preferences to cloud', 'error');
        }
      } else {
        this.showToast('Preferences saved locally', 'success');
      }
      
      this.closeModal();
    } catch (error) {
      console.error('Error saving preferences:', error);
      this.showToast('Failed to save preferences', 'error');
    }
  }

  saveToLocalStorage() {
    localStorage.setItem('soundbound-preferences', JSON.stringify(this.currentPreferences));
  }

  resetToDefault() {
    this.currentPreferences = this.getDefaultPreferences();
    this.applyAllPreferences();
    this.updateModalFromPreferences();
    this.showToast('Reset to default settings', 'info');
  }

  // Apply All Preferences
  applyAllPreferences() {
    this.applyTheme(this.currentPreferences.theme);
    this.applySize(this.currentPreferences.playerSize);
    this.applyBackground(this.currentPreferences.background);
    this.applyFontSize(this.currentPreferences.fontSize);
    this.applyAnimationSpeed(this.currentPreferences.animationSpeed);
  }

  // Update Modal UI
  updateModalFromPreferences() {
    // Update theme selection
    this.updateThemeSelection(this.currentPreferences.theme);
    
    // Update size selection
    const sizeOption = document.querySelector(`input[name="playerSize"][value="${this.currentPreferences.playerSize}"]`);
    if (sizeOption) sizeOption.checked = true;
    
    // Update background selection
    const backgroundOption = document.querySelector(`input[name="background"][value="${this.currentPreferences.background}"]`);
    if (backgroundOption) backgroundOption.checked = true;
    
    // Update sliders
    this.fontSizeSlider.value = this.currentPreferences.fontSize;
    this.fontSizeValue.textContent = `${this.currentPreferences.fontSize}px`;
    
    this.animationSpeedSlider.value = this.currentPreferences.animationSpeed;
    this.animationSpeedValue.textContent = `${this.currentPreferences.animationSpeed}x`;
  }

  // Default Preferences
  getDefaultPreferences() {
    return {
      theme: 'default',
      playerSize: 'normal',
      background: 'solid',
      fontSize: 16,
      animationSpeed: 1
    };
  }

  // Public API
  getPreferences() {
    return { ...this.currentPreferences };
  }

  setPreferences(preferences) {
    this.currentPreferences = { ...this.getDefaultPreferences(), ...preferences };
    this.applyAllPreferences();
  }

  // Utility Methods
  showToast(message, type = 'info') {
    if (window.showToast) {
      window.showToast(message, type);
    }
  }

  // Listen for user authentication changes
  onUserChange(user) {
    if (user) {
      // User signed in, load their preferences
      this.loadSavedPreferences();
      
      // Set up real-time preferences listener
      firebaseService.onPreferencesChange(user.uid, (preferences) => {
        this.currentPreferences = { ...this.getDefaultPreferences(), ...preferences };
        this.applyAllPreferences();
      });
    } else {
      // User signed out, use local preferences only
      this.loadSavedPreferences();
    }
  }
}

// Export the StyleCustomizer class
export { StyleCustomizer };