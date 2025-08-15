// types/rubric.ts

import { LanguageSpecificRubricScores } from './evaluation';

/**
 * Defines the structure for a human rights principle mapping.
 */
export interface HumanRightsPrinciple {
  name: string;
  description: string;
}

/**
 * Defines the structure for a single dimension of the evaluation rubric.
 * This is used to dynamically generate the harm assessment form.
 */
export interface RubricDimension {
  key: keyof Omit<LanguageSpecificRubricScores, 
    'entities' | 
    'non_discrimination_fairness_details' | 
    'safety_security_privacy_details' | 
    'freedom_of_access_censorship_details'
  >;
  label: string;
  description: string;
  humanRightsMapping: HumanRightsPrinciple[];
  
  // For sliders (1-5 scale)
  isSlider?: boolean; 
  scale?: { value: number, label: string }[]; 
  
  // For categorical options (e.g., discrimination, safety)
  isCategorical?: boolean;
  options?: { value: string, label: string }[]; 
  detailsKey?: keyof Pick<LanguageSpecificRubricScores, 
    'non_discrimination_fairness_details' | 
    'safety_security_privacy_details' | 
    'freedom_of_access_censorship_details'
  >;

  // Flag to render the entity verification component
  hasEntityVerification?: boolean;
}