import React from 'react';
import { LLMModelType, ModelDefinition } from '../types';

interface ModelSelectorProps {
  selectedModel: LLMModelType;
  onModelChange: (modelId: LLMModelType) => void;
  models: ModelDefinition[];
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange, models }) => {
  if (!models || models.length === 0) {
    return <p className="text-sm text-destructive">No models available for selection.</p>;
  }
  
  return (
    <div>
      <h3 className="text-md font-semibold text-foreground mb-3">Language Model</h3>
      {models.length === 1 && models[0] ? (
        <div className="p-3 bg-primary/10 text-primary border border-primary/30 rounded-lg font-medium text-center text-sm shadow">
          Using: {models[0].name}
        </div>
      ) : (
        <fieldset className="space-y-2">
          <legend className="sr-only">Select a Language Model</legend>
          {models.map(model => (
            <label 
              key={model.id} 
              className={`flex items-center space-x-3 p-3.5 border rounded-lg transition-all duration-200 cursor-pointer
                          ${selectedModel === model.id 
                            ? 'bg-primary text-primary-foreground border-transparent ring-2 ring-ring ring-offset-1 ring-offset-background shadow-md' 
                            : 'bg-card hover:bg-muted border-border hover:border-accent/50'}`}
            >
              <input
                type="radio"
                name="model_select"
                value={model.id}
                checked={selectedModel === model.id}
                onChange={() => onModelChange(model.id)}
                className="form-radio h-4 w-4 text-primary focus:ring-ring border-muted-foreground bg-transparent accent-primary"
                aria-label={model.name}
              />
              <span className={`text-sm font-medium ${selectedModel === model.id ? 'text-primary-foreground' : 'text-card-foreground'}`}>{model.name}</span>
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
};

export default ModelSelector;