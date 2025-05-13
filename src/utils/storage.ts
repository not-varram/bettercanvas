import type { CanvasOptions, Reminder } from '../types';

// Utility functions for safer storage access
export async function safeStorageGet<T>(storageArea: 'local' | 'sync', key: string, defaultValue: T): Promise<T> {
  try {
    const result = await chrome.storage[storageArea].get(key);
    return result[key] !== undefined ? result[key] : defaultValue;
  } catch (error) {
    console.error(`Error getting ${key} from ${storageArea} storage:`, error);
    return defaultValue;
  }
}

export async function safeStorageSet(storageArea: 'local' | 'sync', key: string, value: any): Promise<void> {
  try {
    await chrome.storage[storageArea].set({ [key]: value });
  } catch (error) {
    console.error(`Error setting ${key} in ${storageArea} storage:`, error);
  }
}

// Default options for the extension
const defaultOptions = {
  local: {
    previous_colors: null,
    previous_theme: null,
    errors: [],
    saved_themes: {},
    liked_themes: [],
  },
  sync: {
    dark_preset: {
      "background-0": "#161616",
      "background-1": "#1e1e1e",
      "background-2": "#262626",
      "borders": "#3c3c3c",
      "text-0": "#f5f5f5",
      "text-1": "#e2e2e2",
      "text-2": "#ababab",
      "links": "#56Caf0",
      "sidebar": "#1e1e1e",
      "sidebar-text": "#f5f5f5"
    },
    new_install: true,
    assignments_due: true,
    gpa_calc: false,
    dark_mode: true,
    gradient_cards: false,
    disable_color_overlay: false,
    auto_dark: false,
    num_assignments: 4,
    custom_domain: [""],
    assignments_done: [],
    dashboard_grades: false,
    assignment_date_format: false,
    dashboard_notes: false,
    dashboard_notes_text: "",
    better_todo: false,
    todo_hr24: false,
    condensed_cards: false,
    reminders: [],
  }
};

/**
 * Storage service to handle access to Chrome's storage
 */
export class StorageService {
  /**
   * Initialize the storage with default values if not already set
   */
  async initialize(): Promise<CanvasOptions> {
    const localOptions = await chrome.storage.local.get(null);
    const syncOptions = await chrome.storage.sync.get(null);
    
    // Initialize local storage with defaults if needed
    if (Object.keys(localOptions).length === 0) {
      await chrome.storage.local.set(defaultOptions.local);
    }
    
    // Initialize sync storage with defaults if needed
    if (Object.keys(syncOptions).length === 0 || syncOptions.new_install) {
      await chrome.storage.sync.set({
        ...defaultOptions.sync,
        new_install: false
      });
    }
    
    return {
      local: await chrome.storage.local.get(null) as CanvasOptions['local'],
      sync: await chrome.storage.sync.get(null) as CanvasOptions['sync']
    };
  }
  
  /**
   * Get options from storage
   */
  async getOptions(): Promise<CanvasOptions> {
    return {
      local: await chrome.storage.local.get(null) as CanvasOptions['local'],
      sync: await chrome.storage.sync.get(null) as CanvasOptions['sync']
    };
  }
  
  /**
   * Save an option to local storage
   */
  async saveLocalOption(key: string, value: any): Promise<void> {
    await safeStorageSet('local', key, value);
  }
  
  /**
   * Save an option to sync storage
   */
  async saveSyncOption(key: string, value: any): Promise<void> {
    await safeStorageSet('sync', key, value);
  }
  
  /**
   * Get reminders from storage
   */
  async getReminders(): Promise<Reminder[]> {
    const result = await safeStorageGet<Reminder[]>('sync', 'reminders', []);
    return result;
  }
  
  /**
   * Save reminders to storage
   */
  async saveReminders(reminders: Reminder[]): Promise<void> {
    await safeStorageSet('sync', 'reminders', reminders);
  }
}

export const storageService = new StorageService();
