import { CanvasOptions } from '../types';
import { storageService } from '../utils/storage';

export class DarkModeService {
  private currentMode: 'light' | 'dark' = 'light';
  private options: CanvasOptions['sync'] | null = null;
  private styleElement: HTMLStyleElement | null = null;
  
  /**
   * Initialize the dark mode service
   */
  async initialize(): Promise<void> {
    this.options = (await storageService.getOptions()).sync;
    this.styleElement = document.createElement('style');
    document.head.appendChild(this.styleElement);
    
    // Set up listeners for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && (changes.dark_mode || changes.dark_preset || changes.auto_dark)) {
        this.updateOptions();
      }
    });
    
    await this.updateOptions();
    
    // Schedule dark mode check based on auto settings
    if (this.options.auto_dark) {
      this.startAutoModeSchedule();
    }
  }
  
  /**
   * Update options from storage and apply dark mode if needed
   */
  private async updateOptions(): Promise<void> {
    this.options = (await storageService.getOptions()).sync;
    
    if (this.options.auto_dark) {
      this.applyAutoDarkMode();
    } else if (this.options.dark_mode) {
      this.applyDarkMode();
    } else {
      this.applyLightMode();
    }
  }
  
  /**
   * Apply dark mode
   */
  applyDarkMode(): void {
    if (!this.options || !this.styleElement) return;
    
    const darkPreset = this.options.dark_preset;
    const css = `
      :root {
        --bc-background-0: ${darkPreset['background-0']};
        --bc-background-1: ${darkPreset['background-1']};
        --bc-background-2: ${darkPreset['background-2']};
        --bc-borders: ${darkPreset.borders};
        --bc-text-0: ${darkPreset['text-0']};
        --bc-text-1: ${darkPreset['text-1']};
        --bc-text-2: ${darkPreset['text-2']};
        --bc-links: ${darkPreset.links};
        --bc-sidebar: ${darkPreset.sidebar};
        --bc-sidebar-text: ${darkPreset['sidebar-text']};
      }
      
      body {
        background-color: var(--bc-background-1) !important;
        color: var(--bc-text-0) !important;
      }
      
      /* Additional dark mode styles */
      #main, .ic-Layout-contentMain, .ic-Dashboard-content, .ic-Dashboard-header {
        background-color: var(--bc-background-1) !important;
        color: var(--bc-text-0) !important;
      }
      
      .ic-app-header {
        background-color: var(--bc-sidebar) !important;
      }
      
      .ic-app-header__menu-list-item a, .ic-app-header__menu-list-item button {
        color: var(--bc-sidebar-text) !important;
      }
      
      /* Links */
      a, .btn-link {
        color: var(--bc-links) !important;
      }
      
      /* Borders */
      .ic-Dashboard-card, .ic-Dashboard-card__header, .ic-Dashboard-card__header-title, .ic-Dashboard-card__header-button {
        border-color: var(--bc-borders) !important;
      }
      
      /* Card backgrounds */
      .ic-Dashboard-card, .ic-Dashboard-card__header {
        background-color: var(--bc-background-2) !important;
      }
      
      /* Text in cards */
      .ic-Dashboard-card__header-title, .ic-Dashboard-card__header-term, .ic-Dashboard-card__header-subtitle {
        color: var(--bc-text-0) !important;
      }
      
      /* Elements with white backgrounds */
      input, textarea, select, .dropdown-menu, .ui-dialog, .ui-tabs, .ui-tabs-nav, .ui-tabs-panel {
        background-color: var(--bc-background-2) !important;
        color: var(--bc-text-0) !important;
        border-color: var(--bc-borders) !important;
      }
    `;
    
    this.styleElement.textContent = css;
    document.documentElement.classList.add('bc-dark-mode');
    document.documentElement.classList.remove('bc-light-mode');
    this.currentMode = 'dark';
  }
  
  /**
   * Apply light mode
   */
  applyLightMode(): void {
    if (!this.styleElement) return;
    
    this.styleElement.textContent = '';
    document.documentElement.classList.add('bc-light-mode');
    document.documentElement.classList.remove('bc-dark-mode');
    this.currentMode = 'light';
  }
  
  /**
   * Start scheduling automatic dark mode switching
   */
  private startAutoModeSchedule(): void {
    // Check mode initially
    this.applyAutoDarkMode();
    
    // Schedule checks every 5 minutes
    setInterval(() => {
      this.applyAutoDarkMode();
    }, 5 * 60 * 1000);
  }
  
  /**
   * Apply dark or light mode based on time of day
   */
  private applyAutoDarkMode(): void {
    if (!this.options || !this.options.auto_dark) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const startHour = parseInt(this.options.auto_dark_start.hour);
    const startMinute = parseInt(this.options.auto_dark_start.minute);
    const endHour = parseInt(this.options.auto_dark_end.hour);
    const endMinute = parseInt(this.options.auto_dark_end.minute);
    
    // Convert times to minutes for easier comparison
    const currentTime = currentHour * 60 + currentMinute;
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    // Check if current time is within dark mode hours
    // If start time is later than end time, it means dark mode spans overnight
    if (startTime > endTime) {
      // Dark mode spans overnight
      if (currentTime >= startTime || currentTime < endTime) {
        // During dark mode hours
        if (this.currentMode !== 'dark') {
          this.applyDarkMode();
        }
      } else {
        // During light mode hours
        if (this.currentMode !== 'light') {
          this.applyLightMode();
        }
      }
    } else {
      // Dark mode within same day
      if (currentTime >= startTime && currentTime < endTime) {
        // During dark mode hours
        if (this.currentMode !== 'dark') {
          this.applyDarkMode();
        }
      } else {
        // During light mode hours
        if (this.currentMode !== 'light') {
          this.applyLightMode();
        }
      }
    }
  }
}
