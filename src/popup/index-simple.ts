import type { CanvasOptions } from '../types';

console.log('Better Canvas popup script loaded');

class PopupController {
  private options: CanvasOptions | null = null;
  private domElements: Record<string, HTMLElement> = {};

  /**
   * Initialize the popup
   */
  async initialize(): Promise<void> {
    try {
      // Initialize UI elements
      this.initializeUI();
      
      // Get options from background script
      await this.getOptions();
      
      // Update UI based on options
      this.updateUI();
      
      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.showError(error.message);
    }
  }
  
  /**
   * Initialize UI elements
   */
  private initializeUI(): void {
    // Cache DOM elements for better performance
    const darkModeToggle = document.getElementById('dark-mode-toggle') as HTMLInputElement;
    const errorContainer = document.getElementById('error-container') as HTMLDivElement;
    
    // If elements don't exist, we're probably in a development environment
    if (darkModeToggle) {
      this.domElements.darkModeToggle = darkModeToggle;
    } else {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = 'dark-mode-toggle';
      document.body.appendChild(input);
      this.domElements.darkModeToggle = input;
    }
    
    if (errorContainer) {
      this.domElements.errorContainer = errorContainer;
    } else {
      const div = document.createElement('div');
      div.id = 'error-container';
      div.style.display = 'none';
      document.body.appendChild(div);
      this.domElements.errorContainer = div;
    }
  }
  
  /**
   * Get options from background script
   */
  private async getOptions(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'getOptions' }, response => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          this.options = response.options;
          resolve();
        }
      });
    });
  }
  
  /**
   * Update UI based on options
   */
  private updateUI(): void {
    if (!this.options) return;
    
    const { sync } = this.options;
    
    // Update dark mode toggle
    if (this.domElements.darkModeToggle) {
      (this.domElements.darkModeToggle as HTMLInputElement).checked = sync.dark_mode || false;
    }
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Dark mode toggle
    this.domElements.darkModeToggle?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.saveOption('sync', 'dark_mode', target.checked);
    });
  }
  
  /**
   * Save option to storage
   */
  private saveOption(area: 'local' | 'sync', key: string, value: any): void {
    chrome.runtime.sendMessage(
      { type: 'saveOption', area, key, value },
      response => {
        if (response.error) {
          this.showError(`Error saving option: ${response.error}`);
        }
      }
    );
  }
  
  /**
   * Show error message
   */
  private showError(message: string): void {
    if (this.domElements.errorContainer) {
      this.domElements.errorContainer.textContent = message;
      this.domElements.errorContainer.style.display = 'block';
      
      setTimeout(() => {
        this.domElements.errorContainer.style.display = 'none';
      }, 5000);
    } else {
      console.error(message);
    }
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup DOM loaded');
  const popupController = new PopupController();
  popupController.initialize();
});
