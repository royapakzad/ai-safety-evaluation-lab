
# Multilingual AI Safety Evaluation Laboratory
## 👉 Web Platform: [Multilingual LLM Safety Evaluation Lab](https://aimultilingualeval.vercel.app/)

## 1. Introduction: The Importance of Multilingual Evaluation

The **Multilingual AI Safety Evaluation Laboratory** is a specialized research tool designed to address a critical gap in AI safety: the evaluation of Large Language Models (LLMs) in non-English contexts.

While most LLM development and testing is English-centric, the majority of the world's population does not speak English. This creates a significant blind spot where models may be less helpful, less accurate, or even more dangerous when used in other languages.

This lab's primary purpose is to empower researchers, developers, and policymakers to rigorously assess **how model performance, safety, and alignment change across different languages**. It provides the tools to move beyond assumptions and gather concrete evidence, ensuring that AI systems are developed and deployed in a way that is equitable, fair, and safe for global, multilingual populations.

## 2. Core Capabilities

The platform is built around a comparison lab and a meta-evaluation system, all designed with a multilingual focus.

#### A. Systematic Multilingual Evaluation
This is the lab's core function. It facilitates the **direct comparison** of an LLM's response to an English prompt versus its response to the same prompt translated into one of dozens of supported languages. This allows for precise measurement of:
*   **Performance Degradation:** Does the quality, accuracy, or coherence of the answer decrease in the target language?
*   **Logical Inconsistencies:** Does the model contradict itself or show a flawed reasoning process in one language but not the other?
*   **Safety Guardrail Failure:** Are safety filters weaker or more easily bypassed in non-English interactions?

#### B. Human Rights-Based Evaluation Rubric
All evaluations are conducted using a rubric derived from the **[UN B-Tech Project's GenAI taxonomy of harm](https://www.ohchr.org/en/documents/tools-and-resources/taxonomy-generative-ai-human-rights-harms-b-tech-gen-ai-project)**. This is not a generic quality assessment; it is a specialized framework designed to measure the human rights impact of AI-generated content, a methodology that is crucial for assessing harms that may disproportionately affect vulnerable, non-English-speaking communities.

#### C. "LLM as a Judge" Meta-Evaluation
This feature allows for research into the scalability and reliability of AI evaluation itself. By comparing a human's scores to those of a Gemini-powered "LLM Judge," we can study how well automated systems capture nuanced, language-specific failures, a key challenge in creating globally relevant evaluation standards.

## 3. Benefits: Why Multilingual Evaluation Matters for Responsible AI

This lab is an important tool for any organization committed to the safe and ethical deployment of AI, particularly for public-facing bodies like government agencies and intrenational organizations such as UN.

*   **Exposing Language-Based Disparities & Harms:** Most safety benchmarks are heavily English-centric. This lab provides the tools to uncover risks that only manifest in other languages. Are safety guardrails weaker? Is the model more likely to produce misinformation or biased content in Spanish, Urdu, or Swahili? Answering these questions is fundamental to deploying AI responsibly in a global context.
*   **Ensuring Global Equity:** Public services and information access must be equitable for all. This tool allows for the direct assessment of an LLM's utility and safety for minority language speakers, preventing the rollout of systems that are inadvertently discriminatory.
*   **Evidence for Governance & Procurement:** It provides concrete, qualitative data that goes beyond marketing claims. By providing clear evidence of a model's multilingual capabilities (or lack thereof), agencies can make informed procurement decisions that serve their *entire* constituency, not just English speakers.
*   **Developing Better, Safer Models:** By identifying *why* a model fails in specific languages, developers can create better fine-tuning strategies, more robust safety systems, and interaction protocols that are safer for a global user base.

## 4. Future Development Roadmap

This platform is under development. Key areas for future expansion include:

### Model-Centric Enhancements
*   **Agentic System Evaluation:** Introducing simulations of multi-turn, task-oriented workflows to evaluate the safety and alignment of AI agents over extended interactions in different languages.
*   **Structured Red Teaming Integration:** Incorporating modules that allow evaluators to use structured, adversarial prompts to proactively probe for vulnerabilities and "jailbreaks," with a focus on exploits that are language-specific.
*   **Multi-modal Evaluation:** Expanding the framework to assess the safety and alignment of models that generate images, audio, and video content based on multilingual prompts.
*   **Enhanced Analytics & Longitudinal Tracking:** Building more sophisticated dashboard visualizations to track model performance and safety drift over time, specifically comparing language-based cohorts.
*   **Advanced Internationalization & Localization Testing:** Moving beyond direct translation to evaluate a model's understanding of contexts, cultural nuance, regional dialects, and localized content appropriateness.


### Socio-Technical & Governance Evaluation
*   **Corporate Policy Gap Analysis:** Integrating frameworks to assess non-content factors, such as analyzing the policy development and implementation gap between a company's stated AI principles and its models' real-world performance.
*   **Market Access & Accessibility Analysis:** Adding modules to evaluate the implications of model deployment on market access and the equitable availability of services for diverse communities.
*   **Contextual Vulnerability Assessment:** Incorporating tools for comprehensive stakeholder mapping and the assessment of country-specific vulnerability factors to provide a holistic view of potential societal impacts.

## 5. Access Control & Login

The application features a two-level access system:

*   **Admin Access:**
    *   **Permissions:** Admins can view all evaluations submitted by all users and download a complete CSV of all data from the platform.
    *   **Login:** Please contact the project administrator for admin credentials.

*   **Evaluator Access:**
    *   **Username:** Your email address (e.g., `user@example.com`)
    *   **Password:** Your email address (the same as your username)
    *   **Permissions:** Evaluators can conduct experiments, submit evaluations, view only their own past evaluations, and download a CSV of their own data.

## 6. API Key Configuration (Crucial!)

This application requires API keys for Google Gemini, OpenAI, and Mistral models to function fully (more models to be added).

**For Local Development (Recommended):**

1.  **Create `env.js` file:** In the root directory of the project, create a file named `env.js`.
2.  **Add your API keys to `env.js`:**
    ```javascript
    // IMPORTANT: DO NOT COMMIT THIS FILE TO VERSION CONTROL IF IT CONTAINS REAL API KEYS!
    // This file is for local development configuration only.

    // For Google Gemini
    export const API_KEY = "YOUR_GOOGLE_GEMINI_API_KEY_HERE";
    
    // For OpenAI
    export const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE";

    // For Mistral
    export const MISTRAL_API_KEY = "YOUR_MISTRAL_API_KEY_HERE";
    ```
    Replace the placeholder strings with your actual API keys.
3.  **Security:**
    *   **DO NOT COMMIT `env.js`** to Git or any version control system.
    *   Add `env.js` to your `.gitignore` file: `echo "env.js" >> .gitignore`

The application will read keys from `env.js` and display a prominent warning if any are missing or are still placeholders.

## 7. Codebase Philosophy & Best Practices

This project is structured for modularity and maintainability. Key principles for developers include:

*   **Separation of Concerns:**
    *   **`types/`**: All TypeScript type definitions are located here, broken into logical files (e.g., `evaluation.ts`, `models.ts`).
    *   **`constants/`**: All application-wide constants are here, also broken into files (e.g., `api.ts`, `rubric.ts`).
    *   **`components/`**: Contains all reusable React components.
    *   **`services/`**: Houses logic that interacts with external APIs (`llmService.ts`) or performs self-contained business logic (`textAnalysisService.ts`).
*   **Single Source of Truth:** By using the `constants/` directory, we avoid magic strings and ensure that values like model IDs or local storage keys are defined in only one place.
*   **Clean Imports:** The `index.ts` file in both `types/` and `constants/` allows for clean, simple imports (e.g., `import { User } from './types';`).
*   **Clear Commenting:** Add concise, professional comments to explain the *why* behind complex code, not just the *what*.

## 8. File System Overview

```
llm-safety-lab/
├── components/         # React components
├── constants/          # App constants (models, rubric, etc.)
├── services/           # API clients and business logic
├── types/              # TypeScript type definitions
├── public/
│   └── scenarios.json  # Not currently used, but available for future features
├── App.tsx             # Main application component
├── env.js              # Local API Key Config (gitignore this!)
├── index.html
├── index.tsx
├── README.md           # This file
└── llmtaskscompleted.md # Log of completed work
```
