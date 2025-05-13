import { CanvasOptions } from '../types';
import { storageService } from '../utils/storage';

/**
 * Popup functionality for Better Canvas extension
 */
class PopupManager {
  private syncedSwitches = [
    'remind',
    'tab_icons',
    'hide_feedback',
    'dark_mode',
    'remlogo',
    'full_width',
    'auto_dark',
    'assignments_due',
    'gpa_calc',
    'gradient_cards',
    'disable_color_overlay',
    'dashboard_grades',
    'dashboard_notes',
    'better_todo',
    'condensed_cards'
  ];
  
  private syncedSubOptions = [
    'todo_colors',
    'device_dark',
    'relative_dues',
    'card_overdues',
    'todo_overdues',
    'gpa_calc_prepend',
    'auto_dark',
    'auto_dark_start',
    'auto_dark_end',
    'num_assignments',
    'assignment_date_format',
    'todo_hr24',
    'grade_hover',
    'hide_completed',
    'num_todo_items', 
    'hover_preview'
  ];
  
  private apiUrl = "https://bettercanvas.diditupe.dev";
  private options: CanvasOptions | null = null;
  
  /**
   * Initialize the popup
   */
  async initialize(): Promise<void> {
    try {
      // Load options
      this.options = await storageService.getOptions();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize UI components
      this.initializeUI();
      
      // Set up tab switching
      this.setupTabSwitching();
      
      // Set up translation
      this.setupTranslation();
    } catch (error) {
      console.error('Error initializing popup:', error);
      this.showAlert('Error initializing popup. Please try again.');
    }
  }
  
  /**
   * Setup event listeners for all UI elements
   */
  private setupEventListeners(): void {
    if (!this.options) return;
    
    // Setup checkbox switches
    this.syncedSwitches.forEach(key => {
      const element = document.getElementById(key) as HTMLInputElement;
      if (element) {
        // Set initial state
        element.checked = this.options?.sync[key] || false;
        
        // Add change listener
        element.addEventListener('change', async () => {
          await this.saveOption('sync', key, element.checked);
          this.updateSubOptions(key);
        });
      }
    });
    
    // Setup number inputs
    const numInputs = document.querySelectorAll('input[type="number"]');
    numInputs.forEach(input => {
      const key = input.id;
      if (key && this.syncedSubOptions.includes(key)) {
        (input as HTMLInputElement).value = String(this.options?.sync[key] || 0);
        input.addEventListener('change', async () => {
          await this.saveOption('sync', key, parseInt((input as HTMLInputElement).value));
        });
      }
    });
    
    // Setup dark mode time inputs
    this.setupDarkModeTimeInputs();
    
    // Setup custom domain inputs
    this.setupCustomDomainInputs();
    
    // Setup notes textarea
    const notesTextarea = document.getElementById('dashboard_notes_text') as HTMLTextAreaElement;
    if (notesTextarea) {
      notesTextarea.value = this.options?.sync.dashboard_notes_text || '';
      notesTextarea.addEventListener('input', async () => {
        await this.saveOption('sync', 'dashboard_notes_text', notesTextarea.value);
      });
    }
    
    // Setup theme customization
    this.setupThemeCustomization();
  }
  
  /**
   * Initialize UI components
   */
  private initializeUI(): void {
    // Update sub-options visibility based on parent switch states
    this.syncedSwitches.forEach(key => {
      this.updateSubOptions(key);
    });
    
    // Update dark mode preview if dark mode is enabled
    if (this.options?.sync.dark_mode) {
      this.updateDarkModePreview();
    }
  }
  
  /**
   * Setup tab switching functionality
   */
  private setupTabSwitching(): void {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabs = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons and tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabs.forEach(tab => tab.classList.remove('active'));
        
        // Add active class to clicked button and corresponding tab
        button.classList.add('active');
        const tabId = button.id.replace('-btn', '-tab');
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
          targetTab.classList.add('active');
        }
      });
    });
    
    // Set first tab as active by default
    const firstButton = tabButtons[0];
    if (firstButton) {
      firstButton.classList.add('active');
      const tabId = firstButton.id.replace('-btn', '-tab');
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        targetTab.classList.add('active');
      }
    }
  }
  
  /**
   * Setup translation for all elements with data-i18n attribute
   */
  private setupTranslation(): void {
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        const translation = chrome.i18n.getMessage(key);
        if (translation) {
          element.textContent = translation;
        }
      }
    });
  }
  
  /**
   * Setup dark mode time inputs
   */
  private setupDarkModeTimeInputs(): void {
    if (!this.options) return;
    
    // Setup start time inputs
    const startHourInput = document.getElementById('auto_dark_start_hour') as HTMLInputElement;
    const startMinuteInput = document.getElementById('auto_dark_start_minute') as HTMLInputElement;
    
    if (startHourInput && startMinuteInput) {
      startHourInput.value = this.options.sync.auto_dark_start.hour;
      startMinuteInput.value = this.options.sync.auto_dark_start.minute;
      
      startHourInput.addEventListener('change', async () => {
        await this.saveOption('sync', 'auto_dark_start', {
          hour: startHourInput.value,
          minute: this.options?.sync.auto_dark_start.minute || '00'
        });
      });
      
      startMinuteInput.addEventListener('change', async () => {
        await this.saveOption('sync', 'auto_dark_start', {
          hour: this.options?.sync.auto_dark_start.hour || '20',
          minute: startMinuteInput.value
        });
      });
    }
    
    // Setup end time inputs
    const endHourInput = document.getElementById('auto_dark_end_hour') as HTMLInputElement;
    const endMinuteInput = document.getElementById('auto_dark_end_minute') as HTMLInputElement;
    
    if (endHourInput && endMinuteInput) {
      endHourInput.value = this.options.sync.auto_dark_end.hour;
      endMinuteInput.value = this.options.sync.auto_dark_end.minute;
      
      endHourInput.addEventListener('change', async () => {
        await this.saveOption('sync', 'auto_dark_end', {
          hour: endHourInput.value,
          minute: this.options?.sync.auto_dark_end.minute || '00'
        });
      });
      
      endMinuteInput.addEventListener('change', async () => {
        await this.saveOption('sync', 'auto_dark_end', {
          hour: this.options?.sync.auto_dark_end.hour || '08',
          minute: endMinuteInput.value
        });
      });
    }
  }
  
  /**
   * Setup custom domain inputs
   */
  private setupCustomDomainInputs(): void {
    if (!this.options) return;
    
    const customDomainInput = document.getElementById('custom_domain_input') as HTMLInputElement;
    const addDomainButton = document.getElementById('add_custom_domain');
    const customDomainContainer = document.getElementById('custom_domains_container');
    
    if (customDomainInput && addDomainButton && customDomainContainer) {
      // Display existing domains
      this.renderCustomDomains();
      
      // Add domain button
      addDomainButton.addEventListener('click', async () => {
        const domain = customDomainInput.value.trim();
        if (domain) {
          const domains = [...(this.options?.sync.custom_domain || []), domain];
          await this.saveOption('sync', 'custom_domain', domains);
          customDomainInput.value = '';
          this.renderCustomDomains();
        }
      });
    }
  }
  
  /**
   * Render the list of custom domains
   */
  private renderCustomDomains(): void {
    if (!this.options) return;
    
    const container = document.getElementById('custom_domains_container');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';      // Render each domain
    this.options.sync.custom_domain.forEach((domain: string, index: number) => {
      if (!domain) return;
      
      const domainItem = document.createElement('div');
      domainItem.className = 'custom-domain-item';
      
      const domainText = document.createElement('span');
      domainText.textContent = domain;
      domainItem.appendChild(domainText);
      
      const removeButton = document.createElement('button');
      removeButton.textContent = '✕';
      removeButton.className = 'remove-domain-btn';
      removeButton.addEventListener('click', async () => {
        const domains = [...this.options!.sync.custom_domain];
        domains.splice(index, 1);
        await this.saveOption('sync', 'custom_domain', domains);
        this.renderCustomDomains();
      });
      domainItem.appendChild(removeButton);
      
      container.appendChild(domainItem);
    });
  }
  
  /**
   * Setup theme customization
   */
  private setupThemeCustomization(): void {
    if (!this.options) return;
    
    const colorInputs = document.querySelectorAll('.theme-color-input') as NodeListOf<HTMLInputElement>;
    colorInputs.forEach(input => {
      const colorKey = input.getAttribute('data-color-key');
      if (colorKey && this.options?.sync.dark_preset[colorKey as keyof typeof this.options.sync.dark_preset]) {
        input.value = this.options.sync.dark_preset[colorKey as keyof typeof this.options.sync.dark_preset];
        
        input.addEventListener('input', async () => {
          if (!colorKey) return;
          
          const darkPreset = { ...this.options!.sync.dark_preset };
          darkPreset[colorKey as keyof typeof darkPreset] = input.value;
          await this.saveOption('sync', 'dark_preset', darkPreset);
          this.updateDarkModePreview();
        });
      }
    });
    
    // Reset button
    const resetButton = document.getElementById('reset-dark-theme');
    if (resetButton) {
      resetButton.addEventListener('click', async () => {
        const defaultOptions = await storageService.initialize();
        this.options!.sync.dark_preset = defaultOptions.sync.dark_preset;
        await this.saveOption('sync', 'dark_preset', this.options!.sync.dark_preset);
        
        // Update color inputs
        colorInputs.forEach(input => {
          const colorKey = input.getAttribute('data-color-key');
          if (colorKey && this.options?.sync.dark_preset[colorKey as keyof typeof this.options.sync.dark_preset]) {
            input.value = this.options.sync.dark_preset[colorKey as keyof typeof this.options.sync.dark_preset];
          }
        });
        
        this.updateDarkModePreview();
      });
    }
  }
  
  /**
   * Update the visibility of sub-options based on parent switch state
   * @param key - The key of the parent switch
   */
  private updateSubOptions(key: string): void {
    if (!this.options) return;
    
    const subOptionsContainer = document.getElementById(`${key}_options`);
    if (subOptionsContainer) {
      subOptionsContainer.style.display = this.options.sync[key] ? 'block' : 'none';
    }
  }
  
  /**
   * Update the dark mode preview
   */
  private updateDarkModePreview(): void {
    if (!this.options) return;
    
    const previewElement = document.getElementById('dark-mode-preview');
    if (!previewElement) return;
    
    const darkPreset = this.options.sync.dark_preset;
    
    // Set CSS variables for preview
    previewElement.style.setProperty('--preview-bg', darkPreset['background-1']);
    previewElement.style.setProperty('--preview-card-bg', darkPreset['background-2']);
    previewElement.style.setProperty('--preview-text', darkPreset['text-0']);
    previewElement.style.setProperty('--preview-secondary-text', darkPreset['text-2']);
    previewElement.style.setProperty('--preview-border', darkPreset['borders']);
    previewElement.style.setProperty('--preview-link', darkPreset['links']);
  }
  
  /**
   * Save an option to storage
   * @param area - The storage area ('local' or 'sync')
   * @param key - The option key
   * @param value - The option value
   */
  private async saveOption(area: 'local' | 'sync', key: string, value: any): Promise<void> {
    try {
      if (area === 'local') {
        await storageService.saveLocalOption(key as any, value);
        if (this.options) {
          this.options.local[key as keyof typeof this.options.local] = value;
        }
      } else {
        await storageService.saveSyncOption(key as any, value);
        if (this.options) {
          this.options.sync[key] = value;
        }
      }
    } catch (error) {
      console.error(`Error saving option ${key}:`, error);
      this.showAlert(`Error saving option ${key}. Please try again.`);
    }
  }
  
  /**
   * Show an alert message
   * @param message - The message to show
   */
  private showAlert(message: string): void {
    const alertElement = document.getElementById('alert');
    if (alertElement) {
      alertElement.textContent = message;
      alertElement.classList.add('show');
      
      setTimeout(() => {
        alertElement.classList.remove('show');
      }, 3000);
    }
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  const popup = new PopupManager();
  popup.initialize();
});
