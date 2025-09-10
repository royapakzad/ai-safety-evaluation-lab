
# Multilingual AI Safety Evaluation Laboratory

#### 👩🏻‍💻 Web Platform for Evaluators:  [Multilingual LLM Safety Evaluation Lab](https://ai-safety-evaluation-lab.vercel.app/)
_To create an account look at section 5. Access Control & Login_
#### [![Watch the video](<img width="1131" height="734" alt="Screenshot 2025-09-09 at 3 45 54 PM" src="https://github.com/user-attachments/assets/8b1cb005-e676-4740-8620-453f7130459c" />
](https://drive.google.com/file/d/1HkflXeKmkX8QZwoXb7hPVMnYnRk6014G/view?usp=sharing)

---

## 1. Introduction: The Importance of Multilingual Evaluation

The **Multilingual AI Safety Evaluation Laboratory** is a specialized research tool designed to address a critical gap in AI safety: the evaluation of Large Language Models (LLMs) in non-English contexts.

While most LLM development and testing is English-centric, the majority of the world's population does not speak English. This creates a significant blind spot where models may be less helpful, less accurate, or even more dangerous when used in other languages.

This lab's primary purpose is to empower researchers, developers, and policymakers to rigorously assess **how model performance, safety, and alignment change across different languages**. It provides the tools to move beyond assumptions and gather concrete evidence, ensuring that AI systems are developed and deployed in a way that is equitable, fair, and safe for global, multilingual populations.


---

## 2. Core Capabilities

The platform is built around a comparison lab and a meta-evaluation system, all designed with a multilingual focus.

### A. Systematic Multilingual Evaluation
The lab’s core function enables a direct comparison of an LLM’s response to an English prompt with its response to the same prompt translated into another non-English language, selected by the evaluator from a drop-down menu. Both the English and non-English prompts are run on the chosen LLM (selected from the model menu), allowing evaluators to view the responses side by side and assess them using a human rights-based rubric.

- **Performance Degradation:** Does the quality, accuracy, or coherence of the answer decrease in the target language?  
- **Logical Inconsistencies:** Does the model contradict itself or show flawed reasoning in one language but not the other?  
- **Safety Guardrail Failure:** Are safety filters weaker or more easily bypassed in non-English interactions?  

### B. Human Rights-Based Evaluation Rubric
Evaluations use a rubric derived from the **[UN B-Tech Project’s GenAI taxonomy of harm](https://www.ohchr.org/en/documents/tools-and-resources/taxonomy-generative-ai-human-rights-harms-b-tech-gen-ai-project)**. This specialized framework is designed to measure the human rights impact of AI-generated content, making it particularly relevant for vulnerable, non-English-speaking communities.


### C. "LLM as a Judge" Meta-Evaluation
The platform supports research into the scalability and reliability of AI evaluation itself. By comparing human scores to those of a Gemini-powered “LLM Judge,” the lab explores whether automated evaluation systems can capture nuanced, language-specific failures—an essential step toward building globally relevant evaluation standards.

### D. Interactive Dashboard (Multilingual Disparity & Model Analytics)
An interactive, filterable dashboard provides both high-level and detailed views of evaluation results. Users can refine data by language pair and model, then explore comparisons of English vs. native language outputs across performance metrics (generation time, word counts, reasoning length), rubric-based human scores (via radar charts), and multilingual disparities (heatmaps). It also visualizes human vs. LLM judge assessments through stacked bars, highlights agreement rates, and enables cross-model comparisons of quality, disparity flags, and performance.

<img width="1131" height="734" alt="image" src="https://github.com/user-attachments/assets/09a3b289-9be3-4350-b66a-14e5d60e4933" />

<img width="1121" height="372" alt="Screenshot 2025-09-09 at 3 46 03 PM" src="https://github.com/user-attachments/assets/fc206627-b0f3-4bdd-86b3-62b046c7e199" />

<img width="1129" height="396" alt="Screenshot 2025-09-09 at 3 46 26 PM" src="https://github.com/user-attachments/assets/0ccc12b9-d5ca-47d5-a7af-0adc5e1496f9" />

<img width="1123" height="650" alt="Screenshot 2025-09-09 at 3 46 41 PM" src="https://github.com/user-attachments/assets/d717d202-5d26-401f-b442-2c859eb900a4" />

---

## 3. Benefits: Why Multilingual Evaluation Matters for Responsible AI

This lab is an essential tool for organizations committed to safe and ethical AI deployment, especially governments and international organizations such as the UN.

- **Exposing Language-Based Disparities & Harms:** Uncover risks that only manifest in other languages, such as weaker safety guardrails or higher rates of misinformation.  
- **Ensuring Global Equity:** Assess an LLM’s utility and safety for minority language speakers, helping prevent inadvertent discrimination.  
- **Evidence for Governance & Procurement:** Provide concrete data that supports informed procurement decisions, ensuring models serve *all* constituents.  
- **Developing Better, Safer Models:** Identify *why* a model fails in specific languages to guide fine-tuning, safety systems, and culturally sensitive interaction protocols.  

---

## 4. Future Development Roadmap

### Model-Centric Enhancements
- **Agentic System Evaluation:** Multi-turn, task-oriented safety testing.  
- **Structured Red Teaming Integration:** Adversarial prompt modules for language-specific vulnerabilities.  
- **Multi-modal Evaluation:** Assess models across images, audio, and video generation.  
- **Enhanced Analytics & Tracking:** Dashboards to monitor multilingual safety drift over time.  
- **Advanced Internationalization & Localization:** Evaluate contextual nuance, dialects, and cultural appropriateness.  

### Socio-Technical & Governance Evaluation
- **Corporate Policy Gap Analysis:** Compare companies’ stated AI principles against real-world performance.  
- **Market Access & Accessibility:** Assess equitable availability of AI-powered services.  
- **Contextual Vulnerability Assessment:** Map stakeholder risks and country-specific vulnerabilities for holistic societal impact analysis.  

---

## 5. Access Control & Login

The platform features two levels of access:

- **Admin Access**  
  - Permissions: View all evaluations, download complete datasets.  
  - Login: Contact the project administrator for credentials.  

- **Evaluator Access**  
  - Username: Your email address  
  - Password: Your email address (default, same as username)  
  - Permissions: Conduct experiments, view and download only your own evaluations.  

---

## 6. API Key Configuration

This application requires API keys for **Google Gemini**, **OpenAI**, and **Mistral** models.  

**Local Setup Instructions:**

1. Create an `env.js` file in the project root.  
2. Add your API keys:  

   ```javascript
   // env.js (do not commit this file!)
   export const API_KEY = "YOUR_GOOGLE_GEMINI_API_KEY_HERE";
   export const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE";
   export const MISTRAL_API_KEY = "YOUR_MISTRAL_API_KEY_HERE";

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
## 9. Credits & Acknowledgments

This project was developed as part of the Mozilla Foundation Trustworthy AI Program, under the Senior Fellowship of Roya Pakzad.
Special thanks to all contributors, evaluators, and civil society partners who participated in testing and evaluation (to be updated with the full list).

---
