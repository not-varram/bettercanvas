import { makeElement } from '../utils/helpers';
import type { CanvasOptions } from '../types';

console.log('Better Canvas content script loaded');

class BetterCanvas {
  private domain: string;
  private current_page: string;
  private options: CanvasOptions | null = null;

  constructor() {
    this.domain = window.location.origin;
    this.current_page = window.location.pathname;
  }

  /**
   * Initialize the extension
   */
  async initialize(): Promise<void> {
    try {
      // Wait for the page to be fully loaded
      if (document.readyState !== 'complete') {
        await new Promise<void>(resolve => {
          window.addEventListener('load', () => resolve());
        });
      }

      // Get options from background script
      await this.getOptions();

      // Apply enhancements
      await this.enhancePage();

      // Listen for URL changes (Single Page App behavior)
      this.observeURLChanges();
    } catch (error) {
      console.error('Error initializing Better Canvas:', error);
    }
  }

  /**
   * Get options from background script
   */
  private async getOptions(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'getOptions' }, response => {
        if (response.error) {
          console.error('Error getting options:', response.error);
          reject(new Error(response.error));
        } else {
          this.options = response.options;
          resolve();
        }
      });
    });
  }

  /**
   * Apply enhancements based on the current page
   */
  private async enhancePage(): Promise<void> {
    if (!this.options) return;

    // Add a simple enhancement to show the extension is working
    this.addWatermark();

    // More enhancements will be implemented later
  }

  /**
   * Add a watermark to show the extension is working
   */
  private addWatermark(): void {
    const watermark = makeElement<HTMLDivElement>('div', document.body, {
      style: 'position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 4px; z-index: 9999; font-size: 12px;'
    });
    watermark.textContent = '✓ Better Canvas (TS)';
  }

  /**
   * Observe URL changes for Single Page App navigation
   */
  private observeURLChanges(): void {
    let lastUrl = window.location.href;
    
    // Create an observer instance
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        this.current_page = window.location.pathname;
        this.enhancePage();
      }
    });

    // Start observing
    observer.observe(document, { subtree: true, childList: true });
  }
}

// Initialize BetterCanvas
const betterCanvas = new BetterCanvas();
betterCanvas.initialize();
