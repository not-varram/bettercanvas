/**
 * Fetches data from the specified URL
 * @param url - The URL to fetch data from
 * @returns A promise that resolves to the fetched data
 */
export async function getData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json() as T;
}

/**
 * Creates a DOM element with specified attributes and appends it to a parent element
 * @param type - The type of element to create (e.g., 'div', 'span')
 * @param parent - The parent element to append the new element to
 * @param attributes - An object containing attributes to set on the element
 * @returns The created element
 */
export function makeElement<T extends HTMLElement>(
  type: string, 
  parent: HTMLElement | null, 
  attributes: Record<string, any> = {}
): T {
  const element = document.createElement(type) as T;
  
  for (const key in attributes) {
    if (key === 'innerHTML') {
      element.innerHTML = attributes[key];
    } else if (key === 'textContent') {
      element.textContent = attributes[key];
    } else {
      element.setAttribute(key, attributes[key]);
    }
  }
  
  if (parent) {
    parent.appendChild(element);
  }
  
  return element;
}

/**
 * Generates a hash from a string
 * @param str - The string to hash
 * @returns A hash string
 */
export function hashString(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString();
}

/**
 * Formats a date for display
 * @param date - The date to format
 * @param format - The format to use (24hr or 12hr)
 * @returns A formatted date string
 */
export function formatDate(date: Date, format: '24hr' | '12hr' = '12hr'): string {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  if (format === '24hr') {
    return `${hours}:${minutes}`;
  } else {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
  }
}
