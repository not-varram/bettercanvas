import { CanvasOptions, Assignment } from '../types';
import { storageService } from '../utils/storage';
import { makeElement, getData } from '../utils/helpers';
import { DarkModeService } from './darkmode';
import { GradeService } from './grades';
import { ReminderService } from './reminder';

class BetterCanvas {
  private domain: string;
  private current_page: string;
  private assignments: Assignment[] | null = null;
  private grades: any[] | null = null;
  private announcements: any[] = [];
  private options: CanvasOptions['sync'] | null = null;
  private timeCheck: NodeJS.Timeout | null = null;
  private darkModeService: DarkModeService;
  private gradeService: GradeService;
  private reminderService: ReminderService;

  constructor() {
    this.domain = window.location.origin;
    this.current_page = window.location.pathname;
    this.darkModeService = new DarkModeService();
    this.gradeService = new GradeService();
    this.reminderService = new ReminderService();
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

      // Get options from storage
      const allOptions = await storageService.getOptions();
      this.options = allOptions.sync;

      // Initialize dark mode
      await this.darkModeService.initialize();

      // Run enhancements based on current page
      await this.enhancePage();

      // Listen for URL changes (Single Page App behavior)
      this.observeURLChanges();
    } catch (error) {
      console.error('Error initializing Better Canvas:', error);
    }
  }

  /**
   * Apply enhancements based on the current page
   */
  private async enhancePage(): Promise<void> {
    if (!this.options) return;

    // Detect course page with ID
    const courseMatch = this.current_page.match(/courses\/(\d+)/);
    const courseId = courseMatch ? courseMatch[1] : null;

    // Dashboard enhancements
    if (this.current_page === '/' || this.current_page === '/courses') {
      if (this.options.assignments_due) {
        await this.loadUpcomingAssignments();
      }

      if (this.options.dashboard_notes) {
        this.addDashboardNotes();
      }

      if (this.options.better_todo) {
        this.enhanceTodoList();
      }
    }

    // Course grades enhancements
    if (courseId && this.current_page.includes('/grades')) {
      if (this.options.gpa_calc) {
        const gradesContainer = document.querySelector('#grades_summary_container');
        if (gradesContainer) {
          this.gradeService.calculateGPA(gradesContainer as HTMLElement);
        }
      }

      await this.gradeService.getClassAverages(courseId);
    }

    // Apply general enhancements
    this.applyGeneralEnhancements();
  }

  /**
   * Load upcoming assignments and display them
   */
  private async loadUpcomingAssignments(): Promise<void> {
    try {
      const upcomingUrl = `${this.domain}/api/v1/users/self/upcoming_events`;
      const assignmentsData = await getData<any[]>(upcomingUrl);

      if (!assignmentsData || !Array.isArray(assignmentsData)) {
        console.error('Failed to load upcoming assignments');
        return;
      }

      // Filter to only show assignments
      const assignments = assignmentsData.filter(item => 
        item.type === 'assignment' || item.assignment
      );

      // Process assignments for display and reminders
      await this.processAssignments(assignments);
    } catch (error) {
      console.error('Error loading upcoming assignments:', error);
    }
  }

  /**
   * Process assignments for display and reminders
   */
  private async processAssignments(assignments: any[]): Promise<void> {
    if (!assignments || assignments.length === 0) return;

    // Map assignments to reminders
    const reminders = assignments
      .map(assignment => {
        const courseName = assignment.context_name || '';
        return this.reminderService.createReminderFromAssignment(assignment, courseName);
      })
      .filter(reminder => reminder !== null) as any[];

    // Save reminders to storage
    await this.reminderService.insertReminders(reminders);

    // Display reminders if enabled
    if (this.options?.better_todo) {
      await this.reminderService.displayReminders('.todo-list-container');
    }

    // Display upcoming assignments on dashboard
    if (this.options?.assignments_due) {
      this.displayUpcomingAssignments(assignments);
    }
  }

  /**
   * Display upcoming assignments on dashboard
   */
  private displayUpcomingAssignments(assignments: any[]): void {
    if (!assignments || assignments.length === 0) return;

    // Get the right sidebar for insertion
    const sidebar = document.querySelector('#right-side');
    if (!sidebar) return;

    // Create assignments container
    const container = makeElement<HTMLDivElement>('div', sidebar as HTMLElement, {
      class: 'bc-upcoming-assignments',
      id: 'bc-upcoming-assignments'
    });

    // Create header
    makeElement<HTMLHeadingElement>('h2', container, {
      textContent: 'Upcoming Assignments',
      class: 'bc-upcoming-header'
    });

    // Sort assignments by due date
    const sortedAssignments = [...assignments].sort((a, b) => {
      const dateA = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });

    // Limit number of displayed assignments
    const numToShow = this.options?.num_assignments || 4;
    const limitedAssignments = sortedAssignments.slice(0, numToShow);

    // Create the list
    const list = makeElement<HTMLUListElement>('ul', container, {
      class: 'bc-assignments-list'
    });

    // Add each assignment
    limitedAssignments.forEach(assignment => {
      const item = makeElement<HTMLLIElement>('li', list, {
        class: 'bc-assignment-item'
      });

      // Format due date
      let dueText = 'No due date';
      if (assignment.due_at) {
        const dueDate = new Date(assignment.due_at);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (dueDate < today) {
          dueText = `Overdue: ${(dueDate.getMonth() + 1)}/${dueDate.getDate()}`;
          item.classList.add('bc-overdue');
        } else if (dueDate.getTime() < tomorrow.getTime()) {
          dueText = 'Due Today';
          item.classList.add('bc-due-today');
        } else {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          dueText = `Due ${dayNames[dueDate.getDay()]}, ${(dueDate.getMonth() + 1)}/${dueDate.getDate()}`;
        }
      }

      // Create assignment content
      item.innerHTML = `
        <div class="bc-assignment-title">
          <a href="${assignment.html_url}" target="_blank">${assignment.title || assignment.name}</a>
        </div>
        <div class="bc-assignment-course">${assignment.context_name || ''}</div>
        <div class="bc-assignment-due">${dueText}</div>
      `;
    });
  }

  /**
   * Add notes section to dashboard
   */
  private addDashboardNotes(): void {
    const sidebar = document.querySelector('#right-side');
    if (!sidebar || !this.options?.dashboard_notes) return;

    // Check if notes already exist
    if (document.getElementById('bc-dashboard-notes')) return;

    // Create notes container
    const notesContainer = makeElement<HTMLDivElement>('div', sidebar as HTMLElement, {
      id: 'bc-dashboard-notes',
      class: 'bc-dashboard-notes'
    });

    // Create notes header
    makeElement<HTMLHeadingElement>('h2', notesContainer, {
      textContent: 'Notes',
      class: 'bc-notes-header'
    });

    // Create notes textarea
    const textarea = makeElement<HTMLTextAreaElement>('textarea', notesContainer, {
      class: 'bc-notes-textarea',
      placeholder: 'Type your notes here...',
      value: this.options.dashboard_notes_text || ''
    });

    // Save notes when changed
    textarea.addEventListener('input', async () => {
      if (!this.options) return;
      await storageService.saveSyncOption('dashboard_notes_text', textarea.value);
    });
  }

  /**
   * Enhance the Canvas todo list
   */
  private enhanceTodoList(): void {
    const todoContainer = document.querySelector('.todo-list-container');
    if (!todoContainer) return;

    // Add better styling
    todoContainer.classList.add('bc-enhanced-todo');

    // Add color coding to todo items
    const todoItems = todoContainer.querySelectorAll('.todo-list-item');
    todoItems.forEach(item => {
      const dueText = item.querySelector('.todo-date')?.textContent || '';
      
      if (dueText.includes('Due Today')) {
        item.classList.add('bc-due-today');
      } else if (dueText.includes('Overdue')) {
        item.classList.add('bc-overdue');
      }
    });
  }

  /**
   * Apply general enhancements to the page
   */
  private applyGeneralEnhancements(): void {
    if (!this.options) return;

    // Apply full width if enabled
    if (this.options.full_width) {
      document.body.classList.add('bc-full-width');
    }

    // Apply condensed cards if enabled
    if (this.options.condensed_cards) {
      const dashboardCards = document.querySelectorAll('.ic-DashboardCard');
      dashboardCards.forEach(card => {
        card.classList.add('bc-condensed-card');
      });
    }

    // Apply gradient cards if enabled
    if (this.options.gradent_cards) {
      const dashboardCards = document.querySelectorAll('.ic-DashboardCard');
      dashboardCards.forEach((card, index) => {
        const hue = (index * 30) % 360;
        (card as HTMLElement).style.background = `linear-gradient(135deg, hsl(${hue}, 80%, 40%), hsl(${hue + 60}, 80%, 50%))`;
      });
    }

    // Apply custom font if enabled
    if (this.options.custom_font && this.options.custom_font.link && this.options.custom_font.family) {
      // Create link element for font
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = this.options.custom_font.link;
      document.head.appendChild(fontLink);

      // Apply font to body
      document.body.style.fontFamily = this.options.custom_font.family;
    }
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
