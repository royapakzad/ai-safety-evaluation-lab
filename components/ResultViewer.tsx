
import React, { useState } from 'react';
import { ChatMessage } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { RTL_LANG_CODES } from '../constants';

interface ResponseCardProps {
  title: string;
  response: ChatMessage | null;
  languageName?: string;
  languageCode?: string; // e.g. 'fa' for Farsi
  isLoading?: boolean;
  generationTime?: number | null;
}

const CopyIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
        <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V16.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 017 16.5v-13z" />
        <path d="M4.5 6A1.5 1.5 0 003 7.5v10A1.5 1.5 0 004.5 19h7a1.5 1.5 0 001.5-1.5v-2a.75.75 0 00-1.5 0v2a.001.001 0 010 0h-7a.001.001 0 010 0v-10a.001.001 0 010 0h2A.75.75 0 006 8V6H4.5z" />
    </svg>
);

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${className}`}>
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" />
    </svg>
);

// Regex for LTR content (URLs, emails, westernized phone numbers)
const LTR_REGEX = new RegExp([
    // URLs
    /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]|\((?:[^\s()<>]|(?:\([^\s()<>]+\)))*\))+(?:\((?:[^\s()<>]|(?:\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/.source,
    // Emails
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/.source,
    // Phone numbers with optional international codes, brackets, and separators.
    /(?:\+?\d{1,4}[\s.-]?)?(?:\(?\d{1,5}\)?[\s.-]?)?[\d\s.-]{7,}\d/.source
].join('|'), 'gi');


// Helper to parse and sanitize markdown, with special handling for LTR text in RTL contexts
const createMarkup = (markdownText: string | undefined) => {
    if (!markdownText) {
        return { __html: '<em class="text-muted-foreground opacity-75">No response generated or response was empty.</em>' };
    }

    try {
        // Pre-process to fix malformed links like [https...](https...) where both parts are the same URL.
        const correctedMarkdown = markdownText.replace(/\[(https?:\/\/[^\]]+)\]\(\1\)/g, '$1');

        const rawMarkup = marked(correctedMarkdown, { breaks: true, gfm: true });
        
        // Sanitize the HTML and return a DOM fragment, which is safer for manipulation
        const sanitizedFragment = DOMPurify.sanitize(rawMarkup as string, { RETURN_DOM_FRAGMENT: true });

        // Function to walk the DOM and wrap LTR text nodes
        const walkAndWrap = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const textContent = node.textContent;
                if (textContent && LTR_REGEX.test(textContent)) {
                    LTR_REGEX.lastIndex = 0; // Reset regex state
                    const fragment = document.createDocumentFragment();
                    let lastIndex = 0;
                    let match;

                    while ((match = LTR_REGEX.exec(textContent)) !== null) {
                        if (match.index > lastIndex) {
                            fragment.appendChild(document.createTextNode(textContent.substring(lastIndex, match.index)));
                        }
                        const span = document.createElement('span');
                        span.dir = 'ltr';
                        span.style.unicodeBidi = 'isolate';
                        span.style.display = 'inline-block';
                        span.textContent = match[0];
                        fragment.appendChild(span);
                        lastIndex = LTR_REGEX.lastIndex;
                    }
                    if (lastIndex < textContent.length) {
                        fragment.appendChild(document.createTextNode(textContent.substring(lastIndex)));
                    }
                    node.parentNode?.replaceChild(fragment, node);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Don't traverse into nodes that are already LTR or links
                const el = node as HTMLElement;
                if (el.tagName === 'A' || el.dir === 'ltr') return;
                
                // Recursively call for child nodes
                Array.from(el.childNodes).forEach(walkAndWrap);
            }
        };

        walkAndWrap(sanitizedFragment);

        // Convert the modified DOM fragment back to an HTML string
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(sanitizedFragment);
        return { __html: tempDiv.innerHTML };

    } catch (e) {
        console.error("Error during markdown processing for RTL/LTR:", e);
        // Fallback to simple sanitization on error
        const rawMarkup = marked(markdownText, { breaks: true, gfm: true });
        const sanitizedMarkup = DOMPurify.sanitize(rawMarkup as string);
        return { __html: sanitizedMarkup };
    }
};

export const ResponseCard: React.FC<ResponseCardProps> = ({ title, response, languageName, languageCode, isLoading, generationTime }) => {
    const [copied, setCopied] = useState(false);
    const isRtl = languageCode ? RTL_LANG_CODES.includes(languageCode) : false;
    const wordCount = response && !response.isError ? (response.text?.trim().split(/\s+/).filter(Boolean).length || 0) : 0;
    
    const handleCopy = () => {
        if (response?.text && !response.isError) {
            navigator.clipboard.writeText(response.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    return (
        <div className="bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border flex-1 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-3.5 border-b border-border pb-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                    {title} 
                    {languageName && <span className="text-sm text-muted-foreground ml-2">({languageName})</span>}
                </h3>
                 <div className="flex items-center space-x-4">
                    {generationTime != null && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Generation Time">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary/70"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>
                            <span>{generationTime.toFixed(2)}s</span>
                        </div>
                    )}
                    {wordCount > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Word Count">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-primary/70"><path d="M5.75 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0V2.75z" /><path d="M9.5 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0V2.75z" /><path d="M13.25 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0V2.75z" /><path d="M17 6.5a.75.75 0 01.75.75v6.5a.75.75 0 01-1.5 0v-6.5A.75.75 0 0117 6.5z" /></svg>
                            <span>{wordCount} words</span>
                        </div>
                    )}
                    <button
                        type="button"
                        title={copied ? "Copied!" : "Copy to Clipboard"}
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || !response || response.isError}
                        onClick={handleCopy}
                        aria-label={`Copy ${title} response to clipboard`}
                    >
                        {copied ? <CheckIcon className="text-accent" /> : <CopyIcon />}
                    </button>
                </div>
            </div>
            {isLoading ? (
                <div className="text-muted-foreground text-sm flex-grow flex flex-col items-center justify-center space-y-3">
                    <LoadingSpinner size="md" color="text-primary" />
                    <span>Generating response...</span>
                </div>
            ) : response ? (
                 <div
                    dir={isRtl ? 'rtl' : 'ltr'}
                    className="flex-grow overflow-y-auto custom-scrollbar"
                >
                    {response.isError ? (
                        <div className="whitespace-pre-wrap text-destructive selection:bg-red-700 selection:text-white">
                            {response.text || <em className="text-muted-foreground opacity-75">No response generated or response was empty.</em>}
                        </div>
                    ) : (
                        <div
                            className="prose dark:prose-invert max-w-none prose-p:my-4 prose-ul:my-3 prose-ol:my-3 prose-headings:text-foreground prose-strong:text-foreground text-card-foreground text-base leading-relaxed"
                            dangerouslySetInnerHTML={createMarkup(response.text)}
                        />
                    )}
                </div>
            ) : (
                <div className="text-muted-foreground text-sm flex-grow flex items-center justify-center italic">Awaiting prompt submission...</div>
            )}
        </div>
    );
};

const ResultViewer: React.FC<{
  nativeResponse: ChatMessage | null;
  englishResponse: ChatMessage | null;
  isLoadingNative?: boolean;
  isLoadingEnglish?: boolean;
  nativeLanguageName?: string;
  generationTimeNative?: number | null;
  generationTimeEnglish?: number | null;
  selectedNativeLanguageCode?: string;
}> = ({ nativeResponse, englishResponse, isLoadingNative, isLoadingEnglish, nativeLanguageName, generationTimeNative, generationTimeEnglish, selectedNativeLanguageCode }) => {
  return (
     <section aria-labelledby="llm-responses-heading" className="mt-10">
      <h2 id="llm-responses-heading" className="text-xl sm:text-2xl font-bold text-center text-foreground mb-8">2. LLM Responses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <ResponseCard title="English Response" response={englishResponse} isLoading={isLoadingEnglish} generationTime={generationTimeEnglish}/>
        <ResponseCard title="Native Language Response" response={nativeResponse} isLoading={isLoadingNative} languageName={nativeLanguageName} languageCode={selectedNativeLanguageCode} generationTime={generationTimeNative}/>
      </div>
    </section>
  );
};

export default ResultViewer;
