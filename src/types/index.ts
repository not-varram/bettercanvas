export interface CanvasOptions {
  local: {
    previous_colors: null | Record<string, string>;
    previous_theme: null | string;
    errors: string[];
    saved_themes?: Record<string, any>;
    liked_themes?: string[];
  };
  sync: {
    dark_preset: {
      "background-0": string;
      "background-1": string;
      "background-2": string;
      borders: string;
      "text-0": string;
      "text-1": string;
      "text-2": string;
      links: string;
      sidebar: string;
      "sidebar-text": string;
    };
    new_install: boolean;
    assignments_due: boolean;
    gpa_calc: boolean;
    dark_mode: boolean;
    gradent_cards: boolean;
    disable_color_overlay: boolean;
    auto_dark: boolean;
    auto_dark_start: { hour: string; minute: string };
    auto_dark_end: { hour: string; minute: string };
    num_assignments: number;
    custom_domain: string[];
    assignments_done: any[];
    dashboard_grades: boolean;
    assignment_date_format: boolean;
    dashboard_notes: boolean;
    dashboard_notes_text: string;
    better_todo: boolean;
    todo_hr24: boolean;
    condensed_cards: boolean;
    custom_cards: Record<string, any>;
    custom_cards_2: Record<string, any>;
    custom_cards_3: Record<string, any>;
    custom_assignments: any[];
    custom_assignments_overflow: string[];
    grade_hover: boolean;
    hide_completed: boolean;
    num_todo_items: number;
    custom_font?: { link: string; family: string };
    todo_colors?: boolean;
    device_dark?: boolean;
    relative_dues?: boolean;
    card_overdues?: boolean;
    todo_overdues?: boolean;
    gpa_calc_prepend?: boolean;
    hover_preview?: boolean;
    reminders?: Reminder[];
    [key: string]: any;
  };
}

export interface Reminder {
  id?: string;
  h: string; // hash
  c: number; // completion status (0 = not done, 1 = done)
  t: string; // title
  d: number; // due date timestamp
  u: string; // url
  course?: string; // course name
}

export interface Assignment {
  id: string;
  name: string;
  html_url: string;
  due_at: string | null;
  points_possible: number;
  course_id: string;
  submission?: {
    score: number;
    [key: string]: any;
  };
  score_statistics?: {
    min: number;
    lower_q: number;
    mean: number;
    median: number;
    upper_q: number;
    max: number;
  };
  assignment_group_id: string;
  [key: string]: any;
}

export interface Grade {
  [key: string]: any;
}

export interface Announcement {
  [key: string]: any;
}
