import React from 'react';
import { User } from '../types';

interface GuardrailLabProps {
  currentUser: User;
  onBack: () => void;
}

const GuardrailLab: React.FC<GuardrailLabProps> = ({ currentUser, onBack }) => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            ← Back to Labs
          </button>
          <h1 className="text-2xl font-bold text-foreground">Safety Guardrail Evaluation Lab</h1>
          <p className="text-muted-foreground">This lab is currently empty</p>
        </div>
      </div>

      <div className="bg-card text-card-foreground p-8 rounded-xl shadow-md border border-border">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">This lab is currently under development.</p>
          <p className="mt-2">Please check back later.</p>
        </div>
      </div>
    </div>
  );
};

export default GuardrailLab;
