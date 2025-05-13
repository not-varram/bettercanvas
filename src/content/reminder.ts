import { Reminder, Assignment } from '../types';
import { getData, hashString, makeElement } from '../utils/helpers';

export class ReminderService {
  private canvas_svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="#ff4545" width="25px" height="25px" viewBox="-192 -192 2304.00 2304.00" stroke="white"><g stroke-width="0"><rect x="-192" y="-192" width="2304.00" height="2304.00" rx="0" fill="none" strokewidth="0"/></g><g stroke-linecap="round" stroke-linejoin="round"/><g> <path d="M958.568 277.97C1100.42 277.97 1216.48 171.94 1233.67 34.3881 1146.27 12.8955 1054.57 0 958.568 0 864.001 0 770.867 12.8955 683.464 34.3881 700.658 171.94 816.718 277.97 958.568 277.97ZM35.8207 682.031C173.373 699.225 279.403 815.285 279.403 957.136 279.403 1098.99 173.373 1215.05 35.8207 1232.24 12.8953 1144.84 1.43262 1051.7 1.43262 957.136 1.43262 862.569 12.8953 769.434 35.8207 682.031ZM528.713 957.142C528.713 1005.41 489.581 1044.55 441.31 1044.55 393.038 1044.55 353.907 1005.41 353.907 957.142 353.907 908.871 393.038 869.74 441.31 869.74 489.581 869.74 528.713 908.871 528.713 957.142ZM1642.03 957.136C1642.03 1098.99 1748.06 1215.05 1885.61 1232.24 1908.54 1144.84 1920 1051.7 1920 957.136 1920 862.569 1908.54 769.434 1885.61 682.031 1748.06 699.225 1642.03 815.285 1642.03 957.136ZM1567.51 957.142C1567.51 1005.41 1528.38 1044.55 1480.11 1044.55 1431.84 1044.55 1392.71 1005.41 1392.71 957.142 1392.71 908.871 1431.84 869.74 1480.11 869.74 1528.38 869.74 1567.51 908.871 1567.51 957.142ZM958.568 1640.6C816.718 1640.6 700.658 1746.63 683.464 1884.18 770.867 1907.11 864.001 1918.57 958.568 1918.57 1053.14 1918.57 1146.27 1907.11 1233.67 1884.18 1216.48 1746.63 1100.42 1640.6 958.568 1640.6ZM1045.98 1480.11C1045.98 1528.38 1006.85 1567.51 958.575 1567.51 910.304 1567.51 871.172 1528.38 871.172 1480.11 871.172 1431.84 910.304 1392.71 958.575 1392.71 1006.85 1392.71 1045.98 1431.84 1045.98 1480.11ZM1045.98 439.877C1045.98 488.148 1006.85 527.28 958.575 527.28 910.304 527.28 871.172 488.148 871.172 439.877 871.172 391.606 910.304 352.474 958.575 352.474 1006.85 352.474 1045.98 391.606 1045.98 439.877ZM1441.44 1439.99C1341.15 1540.29 1333.98 1697.91 1418.52 1806.8 1579 1712.23 1713.68 1577.55 1806.82 1418.5 1699.35 1332.53 1541.74 1339.7 1441.44 1439.99ZM1414.21 1325.37C1414.21 1373.64 1375.08 1412.77 1326.8 1412.77 1278.53 1412.77 1239.4 1373.64 1239.4 1325.37 1239.4 1277.1 1278.53 1237.97 1326.8 1237.97 1375.08 1237.97 1414.21 1277.1 1414.21 1325.37ZM478.577 477.145C578.875 376.846 586.039 219.234 501.502 110.339 341.024 204.906 206.338 339.592 113.203 498.637 220.666 584.607 378.278 576.01 478.577 477.145ZM679.155 590.32C679.155 638.591 640.024 677.723 591.752 677.723 543.481 677.723 504.349 638.591 504.349 590.32 504.349 542.048 543.481 502.917 591.752 502.917 640.024 502.917 679.155 542.048 679.155 590.32ZM1440 475.712C1540.3 576.01 1697.91 583.174 1806.8 498.637 1712.24 338.159 1577.55 203.473 1418.51 110.339 1332.54 217.801 1341.13 375.413 1440 475.712ZM1414.21 590.32C1414.21 638.591 1375.08 677.723 1326.8 677.723 1278.53 677.723 1239.4 638.591 1239.4 590.32 1239.4 542.048 1278.53 502.917 1326.8 502.917 1375.08 502.917 1414.21 542.048 1414.21 590.32ZM477.145 1438.58C376.846 1338.28 219.234 1331.12 110.339 1415.65 204.906 1576.13 339.593 1710.82 498.637 1805.39 584.607 1696.49 577.443 1538.88 477.145 1438.58ZM679.155 1325.37C679.155 1373.64 640.024 1412.77 591.752 1412.77 543.481 1412.77 504.349 1373.64 504.349 1325.37 504.349 1277.1 543.481 1237.97 591.752 1237.97 640.024 1237.97 679.155 1277.1 679.155 1325.37Z"/></g></svg>`;

  /**
   * Insert reminders into storage
   * @param reminders - The reminders to insert
   */
  async insertReminders(reminders: Reminder[]): Promise<void> {
    const toAdd: Reminder[] = [];
    const storage = await chrome.storage.sync.get("reminders") as { reminders: Reminder[] };
    
    // Set default if not exists
    if (!storage.reminders) {
      storage.reminders = [];
    }
    
    // overrides = if there's an item that needs to update, but already exists
    let overrides = false;
    
    for (const insert of reminders) {
      let found = false;
      
      for (let i = 0; i < storage.reminders.length; i++) {
        // check if item was recently submitted
        if (insert.c === -1 && insert.h === storage.reminders[i].h) {
          overrides = true;
          storage.reminders[i] = insert;
        } else if (insert.h === storage.reminders[i].h) {
          found = true;
        }
      }
      
      if (!found && insert.c !== -1) {
        toAdd.push(insert);
      }
    }
    
    const allReminders = [...storage.reminders, ...toAdd]
      // Sort by due date
      .sort((a, b) => a.d - b.d)
      // Remove done items older than 1 day
      .filter(item => {
        if (item.c !== 1) return true;
        if (new Date().getTime() - item.d > 86400000) return false;
        return true;
      });
    
    // Update storage
    await chrome.storage.sync.set({ reminders: allReminders });
  }

  /**
   * Create a reminder from an assignment
   * @param assignment - The assignment to create a reminder from
   * @param courseName - The name of the course
   */
  createReminderFromAssignment(assignment: Assignment, courseName: string): Reminder | null {
    if (!assignment.due_at) return null;

    const dueDate = new Date(assignment.due_at).getTime();
    const hash = hashString(`${assignment.html_url}-${assignment.due_at}`);
    
    return {
      h: hash,
      c: 0, // Not completed
      t: assignment.name,
      d: dueDate,
      u: assignment.html_url,
      course: courseName
    };
  }

  /**
   * Display reminders on the page
   * @param containerSelector - The CSS selector for the container to display reminders in
   */
  async displayReminders(containerSelector: string): Promise<void> {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const reminders = await chrome.storage.sync.get("reminders") as { reminders: Reminder[] };
    
    if (!reminders.reminders || reminders.reminders.length === 0) {
      return;
    }
    
    // Create a container for reminders
    const reminderContainer = makeElement<HTMLDivElement>('div', container as HTMLElement, {
      class: 'better-canvas-reminders'
    });
    
    const header = makeElement<HTMLDivElement>('div', reminderContainer, {
      class: 'better-canvas-reminders-header'
    });
    
    header.innerHTML = `${this.canvas_svg} <span>Reminders</span>`;
    
    const reminderList = makeElement<HTMLUListElement>('ul', reminderContainer, {
      class: 'better-canvas-reminders-list'
    });
    
    // Show only non-completed reminders sorted by due date
    const activeReminders = reminders.reminders
      .filter(r => r.c === 0)
      .sort((a, b) => a.d - b.d)
      .slice(0, 5);
    
    activeReminders.forEach(reminder => {
      const reminderItem = makeElement<HTMLLIElement>('li', reminderList, {
        class: 'better-canvas-reminder-item'
      });
      
      const dueDate = new Date(reminder.d);
      const now = new Date();
      const isOverdue = dueDate < now;
      
      reminderItem.innerHTML = `
        <div class="reminder-title ${isOverdue ? 'overdue' : ''}">
          <a href="${reminder.u}" target="_blank">${reminder.t}</a>
          ${reminder.course ? `<span class="reminder-course">${reminder.course}</span>` : ''}
        </div>
        <div class="reminder-due ${isOverdue ? 'overdue' : ''}">
          ${isOverdue ? 'Overdue' : 'Due'} ${this.formatDate(dueDate)}
        </div>
        <button class="reminder-complete" data-hash="${reminder.h}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      `;
      
      // Add event listener to complete button
      const completeButton = reminderItem.querySelector('.reminder-complete');
      if (completeButton) {
        completeButton.addEventListener('click', async (e) => {
          e.preventDefault();
          const hash = (completeButton as HTMLElement).dataset.hash;
          await this.markReminderComplete(hash as string);
          reminderItem.classList.add('completed');
          setTimeout(() => {
            reminderItem.remove();
          }, 500);
        });
      }
    });
  }

  /**
   * Format a date for display
   * @param date - The date to format
   */
  private formatDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date < today) {
      return `${(date.getMonth() + 1)}/${date.getDate()}/${date.getFullYear()}`;
    } else if (date < tomorrow) {
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `Today, ${displayHours}:${minutes} ${period}`;
    } else {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${dayNames[date.getDay()]}, ${(date.getMonth() + 1)}/${date.getDate()}`;
    }
  }

  /**
   * Mark a reminder as complete
   * @param hash - The hash of the reminder
   */
  async markReminderComplete(hash: string): Promise<void> {
    const storage = await chrome.storage.sync.get("reminders") as { reminders: Reminder[] };
    
    if (!storage.reminders) {
      return;
    }
    
    const updatedReminders = storage.reminders.map(r => {
      if (r.h === hash) {
        return { ...r, c: 1 };
      }
      return r;
    });
    
    await chrome.storage.sync.set({ reminders: updatedReminders });
  }
}
