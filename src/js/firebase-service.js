// Firebase Service Layer
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from './firebase-config.js';

class FirebaseService {
  constructor() {
    this.currentUser = null;
    this.unsubscribeAuth = null;
    this.unsubscribePreferences = null;
  }

  // Authentication Methods
  async signUp(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user document with default preferences
      await this.createUserDocument(user.uid, {
        email: user.email,
        createdAt: new Date(),
        preferences: this.getDefaultPreferences()
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  // Auth State Observer
  onAuthStateChange(callback) {
    this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      callback(user);
    });
    return this.unsubscribeAuth;
  }

  // User Document Methods
  async createUserDocument(userId, userData) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, userData);
      return { success: true };
    } catch (error) {
      console.error('Create user document error:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserDocument(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { success: true, data: userSnap.data() };
      } else {
        return { success: false, error: 'User document not found' };
      }
    } catch (error) {
      console.error('Get user document error:', error);
      return { success: false, error: error.message };
    }
  }

  // Preferences Methods
  async saveUserPreferences(userId, preferences) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        preferences: preferences,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Save preferences error:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserPreferences(userId) {
    try {
      const result = await this.getUserDocument(userId);
      if (result.success && result.data.preferences) {
        return { success: true, preferences: result.data.preferences };
      } else {
        return { success: true, preferences: this.getDefaultPreferences() };
      }
    } catch (error) {
      console.error('Get preferences error:', error);
      return { success: false, error: error.message };
    }
  }

  // Playlist Methods
  async savePlaylist(userId, playlist) {
    try {
      const playlistRef = doc(db, 'playlists', userId);
      await setDoc(playlistRef, {
        songs: playlist,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Save playlist error:', error);
      return { success: false, error: error.message };
    }
  }

  async getPlaylist(userId) {
    try {
      const playlistRef = doc(db, 'playlists', userId);
      const playlistSnap = await getDoc(playlistRef);
      
      if (playlistSnap.exists()) {
        return { success: true, playlist: playlistSnap.data().songs || [] };
      } else {
        return { success: true, playlist: [] };
      }
    } catch (error) {
      console.error('Get playlist error:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time Preferences Listener
  onPreferencesChange(userId, callback) {
    const userRef = doc(db, 'users', userId);
    this.unsubscribePreferences = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const preferences = doc.data().preferences || this.getDefaultPreferences();
        callback(preferences);
      }
    });
    return this.unsubscribePreferences;
  }

  // Utility Methods
  getDefaultPreferences() {
    return {
      theme: 'default',
      playerSize: 'normal',
      background: 'solid',
      fontSize: 16,
      animationSpeed: 1,
      volume: 0.7
    };
  }

  // Cleanup
  cleanup() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
    if (this.unsubscribePreferences) {
      this.unsubscribePreferences();
    }
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();