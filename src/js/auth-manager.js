// Authentication Manager
import { firebaseService } from './firebase-service.js';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.isAuthModalOpen = false;
    
    this.initializeElements();
    this.bindEvents();
    this.setupAuthStateListener();
  }

  initializeElements() {
    // Modal elements
    this.userModal = document.getElementById('userModal');
    this.userBtn = document.getElementById('userBtn');
    this.closeUserModal = document.getElementById('closeUserModal');
    
    // Auth forms
    this.authContainer = document.getElementById('authContainer');
    this.loginForm = document.getElementById('loginForm');
    this.signupForm = document.getElementById('signupForm');
    this.userProfile = document.getElementById('userProfile');
    
    // Login form elements
    this.loginEmail = document.getElementById('loginEmail');
    this.loginPassword = document.getElementById('loginPassword');
    this.loginBtn = document.getElementById('loginBtn');
    this.showSignup = document.getElementById('showSignup');
    
    // Signup form elements
    this.signupEmail = document.getElementById('signupEmail');
    this.signupPassword = document.getElementById('signupPassword');
    this.signupBtn = document.getElementById('signupBtn');
    this.showLogin = document.getElementById('showLogin');
    
    // Profile elements
    this.userEmail = document.getElementById('userEmail');
    this.logoutBtn = document.getElementById('logoutBtn');
  }

  bindEvents() {
    // Modal controls
    this.userBtn.addEventListener('click', () => this.openModal());
    this.closeUserModal.addEventListener('click', () => this.closeModal());
    this.userModal.addEventListener('click', (e) => {
      if (e.target === this.userModal) this.closeModal();
    });
    
    // Form switching
    this.showSignup.addEventListener('click', () => this.showSignupForm());
    this.showLogin.addEventListener('click', () => this.showLoginForm());
    
    // Authentication actions
    this.loginBtn.addEventListener('click', () => this.handleLogin());
    this.signupBtn.addEventListener('click', () => this.handleSignup());
    this.logoutBtn.addEventListener('click', () => this.handleLogout());
    
    // Form submission on Enter
    this.loginForm.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleLogin();
    });
    
    this.signupForm.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSignup();
    });
    
    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isAuthModalOpen) {
        this.closeModal();
      }
    });
  }

  // Modal Management
  openModal() {
    this.userModal.classList.add('active');
    this.isAuthModalOpen = true;
    document.body.style.overflow = 'hidden';
    
    // Show appropriate form based on auth state
    if (this.currentUser) {
      this.showUserProfile();
    } else {
      this.showLoginForm();
    }
  }

  closeModal() {
    this.userModal.classList.remove('active');
    this.isAuthModalOpen = false;
    document.body.style.overflow = '';
    this.clearFormInputs();
  }

  // Form Management
  showLoginForm() {
    this.loginForm.style.display = 'block';
    this.signupForm.style.display = 'none';
    this.userProfile.style.display = 'none';
    this.loginEmail.focus();
  }

  showSignupForm() {
    this.loginForm.style.display = 'none';
    this.signupForm.style.display = 'block';
    this.userProfile.style.display = 'none';
    this.signupEmail.focus();
  }

  showUserProfile() {
    this.loginForm.style.display = 'none';
    this.signupForm.style.display = 'none';
    this.userProfile.style.display = 'block';
    
    if (this.currentUser) {
      this.userEmail.textContent = this.currentUser.email;
    }
  }

  clearFormInputs() {
    this.loginEmail.value = '';
    this.loginPassword.value = '';
    this.signupEmail.value = '';
    this.signupPassword.value = '';
  }

  // Authentication Handlers
  async handleLogin() {
    const email = this.loginEmail.value.trim();
    const password = this.loginPassword.value;
    
    if (!this.validateEmail(email)) {
      this.showToast('Please enter a valid email address', 'error');
      return;
    }
    
    if (!password) {
      this.showToast('Please enter your password', 'error');
      return;
    }
    
    this.setLoading(true);
    
    try {
      const result = await firebaseService.signIn(email, password);
      
      if (result.success) {
        this.showToast('Successfully signed in!', 'success');
        this.closeModal();
      } else {
        this.showToast(result.error || 'Sign in failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showToast('An unexpected error occurred', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  async handleSignup() {
    const email = this.signupEmail.value.trim();
    const password = this.signupPassword.value;
    
    if (!this.validateEmail(email)) {
      this.showToast('Please enter a valid email address', 'error');
      return;
    }
    
    if (password.length < 6) {
      this.showToast('Password must be at least 6 characters long', 'error');
      return;
    }
    
    this.setLoading(true);
    
    try {
      const result = await firebaseService.signUp(email, password);
      
      if (result.success) {
        this.showToast('Account created successfully!', 'success');
        this.closeModal();
      } else {
        this.showToast(result.error || 'Account creation failed', 'error');
      }
    } catch (error) {
      console.error('Signup error:', error);
      this.showToast('An unexpected error occurred', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  async handleLogout() {
    this.setLoading(true);
    
    try {
      const result = await firebaseService.signOut();
      
      if (result.success) {
        this.showToast('Successfully signed out', 'success');
        this.closeModal();
      } else {
        this.showToast('Sign out failed', 'error');
      }
    } catch (error) {
      console.error('Logout error:', error);
      this.showToast('An unexpected error occurred', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  // Auth State Management
  setupAuthStateListener() {
    firebaseService.onAuthStateChange((user) => {
      this.currentUser = user;
      this.updateUserButton();
      
      // Notify other components about user change
      if (window.styleCustomizer) {
        window.styleCustomizer.onUserChange(user);
      }
      
      if (window.playlistManager) {
        window.playlistManager.onUserChange(user);
      }
    });
  }

  updateUserButton() {
    const userBtn = this.userBtn;
    
    if (this.currentUser) {
      userBtn.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
      userBtn.style.color = 'white';
      userBtn.style.borderColor = 'var(--primary-color)';
    } else {
      userBtn.style.background = 'var(--surface-color)';
      userBtn.style.color = 'var(--text-secondary)';
      userBtn.style.borderColor = 'var(--border-color)';
    }
  }

  // Utility Methods
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  setLoading(isLoading) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (isLoading) {
      loadingIndicator.classList.add('active');
    } else {
      loadingIndicator.classList.remove('active');
    }
    
    // Disable/enable form buttons
    this.loginBtn.disabled = isLoading;
    this.signupBtn.disabled = isLoading;
    this.logoutBtn.disabled = isLoading;
  }

  showToast(message, type = 'info') {
    if (window.showToast) {
      window.showToast(message, type);
    }
  }

  // Public API
  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }
}

// Export the AuthManager class
export { AuthManager };