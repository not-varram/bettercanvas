import { Assignment } from '../types';
import { getData, makeElement } from '../utils/helpers';

export class GradeService {
  /**
   * Calculate and display class averages
   * @param courseId - The ID of the course
   */
  async getClassAverages(courseId: string): Promise<void> {
    try {
      const courseGradesPromise = getData<Assignment[]>(`${window.location.origin}/api/v1/courses/${courseId}/assignments?include[]=score_statistics&include[]=submission`);
      const courseGroupsPromise = getData<any[]>(`${window.location.origin}/api/v1/courses/${courseId}/assignment_groups`);
      
      // Wait for both API calls to complete
      const [grades, groups] = await Promise.all([courseGradesPromise, courseGroupsPromise]);
      
      // Calculate weights
      let totalWeight = 0;
      let weights: { [key: string]: number } = {};
      
      groups.forEach(group => {
        weights[group.id] = group.group_weight;
        totalWeight += group.group_weight;
      });
      
      // Normalize weights if total isn't zero
      groups.forEach(group => {
        weights[group.id] = totalWeight === 0 ? 1 : weights[group.id] / totalWeight;
      });
      
      // Calculate statistics
      let min = 0, lowq = 0, mean = 0, median = 0, upq = 0, max = 0, earned = 0;
      let totalPoints = 0;
      
      grades.forEach(grade => {
        if (!grade.score_statistics) return;
        
        // Get the weight for this assignment's group
        const weight = weights[grade.assignment_group_id];
        
        // Update statistics
        min += grade.score_statistics.min * weight;
        lowq += grade.score_statistics.lower_q * weight;
        mean += grade.score_statistics.mean * weight;
        median += grade.score_statistics.median * weight;
        upq += grade.score_statistics.upper_q * weight;
        max += grade.score_statistics.max * weight;
        
        // Count points
        totalPoints += grade.points_possible * weight;
        
        // Add user's score
        if (grade.submission && grade.submission.score !== null) {
          earned += grade.submission.score * weight;
        }
      });
      
      // Normalize by total points
      min = (min / totalPoints);
      lowq = (lowq / totalPoints);
      mean = (mean / totalPoints);
      median = (median / totalPoints);
      upq = (upq / totalPoints);
      max = (max / totalPoints);
      earned = (earned / totalPoints);
      
      // Create visualization
      const width = 150;
      
      // Create HTML for the statistics display
      let inner = `
        <td colspan="6" style="padding-bottom: 20px;">
          <table id="" class="">
            <thead>
              <tr>
                <th colspan="5">Class Averages</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Mean: ${(mean * 100).toFixed(2)}</td>
                <td>Upper Quartile: ${(upq * 100).toFixed(2)}</td>
                <td>Lower Quartile: ${(lowq * 100).toFixed(2)}</td>
                <td colspan="3">
                  <svg viewBox="-1 0 160 30" xmlns="http://www.w3.org/2000/svg" style="float: right; height: 30px; margin-20px; width: 161px; position: relative; margin-right: 30px;" aria-hidden="true">
                    <line class="zero" x1="0" y1="3" x2="0" y2="27" stroke="#556572"></line>
                    <line class="possible" x1="150.0" y1="3" x2="150.0" y2="27" stroke="#556572"></line>
                    <line class="min" x1="${min * width}" y1="6" x2="${min * width}" y2="24" stroke="#556572" stroke-width="2"></line>
                    <line class="bottomQ" x1="${min * width}" y1="15" x2="${lowq * width}" y2="15" stroke="#556572" stroke-width="2"></line>
                    <line class="topQ" x1="${upq * width}" y1="15" x2="${max * width}" y2="15" stroke="#556572" stroke-width="2"></line>
                    <line class="max" x1="${max * width}" y1="6" x2="${max * width}" y2="24" stroke="#556572" stroke-width="2"></line>
                    <rect class="mid50" x="${lowq * width}" y="3" width="${(upq - lowq) * width}" height="24" stroke="#556572" stroke-width="2" rx="3" fill="none"></rect>
                    <line class="median" x1="${mean * width}" y1="3" x2="${mean * width}" y2="27" stroke="#556572" stroke-width="2"></line>
                    <rect class="myScore" x="${(earned * width) - 7}" y="8" width="14" height="14" stroke="#224488" stroke-width="2" rx="3" fill="#aabbdd"></rect>
                  </svg>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      `;
      
      // Add to page
      const container = document.querySelector("#grades_summary tbody");
      if (container) {
        makeElement('tr', container as HTMLElement, { innerHTML: inner });
      }
    } catch (error) {
      console.error("Error calculating class averages:", error);
    }
  }
  
  /**
   * Calculate GPA based on grades
   * @param gradesContainer - The container with grades
   */
  calculateGPA(gradesContainer: HTMLElement): void {
    const gradeElements = gradesContainer.querySelectorAll('.student_assignment.final_grade .grade');
    if (!gradeElements || gradeElements.length === 0) return;
    
    // Get grade percentages
    const grades = Array.from(gradeElements).map(el => {
      const gradeText = el.textContent?.trim();
      if (!gradeText) return 0;
      
      // Extract percentage from text (e.g. "95%" -> 95)
      const match = gradeText.match(/(\d+\.?\d*)%?/);
      if (!match) return 0;
      
      return parseFloat(match[1]);
    });
    
    // Calculate GPA based on common scale
    let gpaTotal = 0;
    
    grades.forEach(grade => {
      if (grade >= 90) {
        gpaTotal += 4.0; // A
      } else if (grade >= 80) {
        gpaTotal += 3.0; // B
      } else if (grade >= 70) {
        gpaTotal += 2.0; // C
      } else if (grade >= 60) {
        gpaTotal += 1.0; // D
      } else {
        gpaTotal += 0.0; // F
      }
    });
    
    // Calculate GPA average
    const gpa = gpaTotal / grades.length;
    
    // Create and display GPA element
    const gpaContainer = makeElement<HTMLDivElement>('div', gradesContainer, {
      class: 'bc-gpa-container'
    });
    
    gpaContainer.textContent = `Estimated GPA: ${gpa.toFixed(2)}`;
  }
}
