import React from 'react';
import { User } from '../types';

export type LabType = 'multilingual-ai' | 'guardrail-evaluation';

interface LabSelectorProps {
  currentUser: User;
  onLabSelect: (lab: LabType) => void;
}

const LabSelector: React.FC<LabSelectorProps> = ({ currentUser, onLabSelect }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          AI Safety Evaluation Labs
        </h1>
        <p className="text-lg text-muted-foreground">
          Welcome, {currentUser.isAdmin ? 'Admin' : 'Evaluator'}! Choose a lab to begin evaluation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Multilingual AI Lab Card */}
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Multilingual AI Lab</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Evaluate and compare LLM responses across different languages. Test for consistency,
              safety disparities, and human rights-based evaluation metrics.
            </p>
            <ul className="text-sm text-muted-foreground mb-6 space-y-2">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                Custom prompts and CSV upload
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                Multiple LLM models
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                Human rights-based rubric evaluation
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                Interactive analytics dashboard
              </li>
            </ul>
            <button
              onClick={() => onLabSelect('multilingual-ai')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Enter Multilingual AI Lab
            </button>
          </div>
        </div>

        {/* Guardrail Evaluation Lab Card */}
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Safety Guardrail Evaluation</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Test LLM safety guardrails across multiple languages using Mozilla.ai's any-guardrail library.
              Evaluate how well safety mechanisms work in different linguistic contexts.
            </p>
            <ul className="text-sm text-muted-foreground mb-6 space-y-2">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                Multiple guardrail models (Deepset, Llama Guard, etc.)
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                Multilingual safety evaluation
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                Custom prompts and CSV upload
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                Cross-language safety comparison
              </li>
            </ul>
            <button
              onClick={() => onLabSelect('guardrail-evaluation')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Enter Guardrail Evaluation Lab
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Need help? Contact your administrator or refer to the documentation.
        </p>
      </div>
    </div>
  );
};

export default LabSelector;