// src/components/editor/HtmlEditor.js
import { useState, useEffect } from 'react';
import { Code, Eye, EyeOff, AlertCircle, Wand2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Monaco to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const HtmlEditor = ({ value, onChange, placeholder = 'Enter HTML content...', editable = true }) => {
    const [htmlContent, setHtmlContent] = useState(value || '');
    const [showPreview, setShowPreview] = useState(true);
    const [error, setError] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setHtmlContent(value || '');
    }, [value]);

    const handleCodeChange = (newValue) => {
        setHtmlContent(newValue || '');

        // Basic HTML validation
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newValue;
            setError('');
        } catch (err) {
            setError('Invalid HTML structure');
        }

        onChange(newValue || '');
    };

    const formatHtml = () => {
        try {
            // Basic HTML formatting using prettier-like logic
            let formatted = htmlContent;

            // Remove extra whitespace between tags
            formatted = formatted.replace(/>\s+</g, '><');

            // Add newlines after closing tags and self-closing tags
            formatted = formatted.replace(/(<\/[^>]+>)/g, '$1\n');
            formatted = formatted.replace(/(<[^/][^>]*\/>)/g, '$1\n');

            // Add newlines before opening tags (except inline elements)
            const blockElements = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside', 'form', 'fieldset', 'blockquote', 'pre', 'hr', 'br'];
            blockElements.forEach(tag => {
                const regex = new RegExp(`(<${tag}[^>]*>)`, 'gi');
                formatted = formatted.replace(regex, '\n$1');
            });

            // Clean up multiple newlines
            formatted = formatted.replace(/\n{3,}/g, '\n\n');
            formatted = formatted.trim();

            // Simple indentation
            const lines = formatted.split('\n');
            let indent = 0;
            const indentedLines = lines.map(line => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return '';

                // Decrease indent for closing tags
                if (trimmedLine.match(/^<\//)) {
                    indent = Math.max(0, indent - 1);
                }

                const indentedLine = '  '.repeat(indent) + trimmedLine;

                // Increase indent for opening tags (not self-closing)
                if (trimmedLine.match(/^<[^/!][^>]*[^/]>$/) && !trimmedLine.match(/<(br|hr|img|input|meta|link)/i)) {
                    indent++;
                }

                return indentedLine;
            });

            formatted = indentedLines.join('\n');

            setHtmlContent(formatted);
            onChange(formatted);
            setError('');
        } catch (err) {
            setError('Could not format HTML');
        }
    };

    // Monaco editor options
    const editorOptions = {
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        automaticLayout: true,
        readOnly: !editable,
        theme: 'vs-dark',
        formatOnPaste: true,
        formatOnType: true,
    };

    // Configure Monaco HTML settings
    const handleEditorMount = (editor, monaco) => {
        // Configure HTML formatting options
        monaco.languages.html.htmlDefaults.setOptions({
            format: {
                tabSize: 2,
                insertSpaces: true,
                wrapLineLength: 120,
                unformatted: '',
                contentUnformatted: 'pre,code,textarea',
                indentInnerHtml: true,
                preserveNewLines: true,
                maxPreserveNewLines: 2,
                indentHandlebars: false,
                endWithNewline: false,
                extraLiners: 'head, body, /html',
                wrapAttributes: 'auto',
            },
        });
    };

    if (!isMounted) {
        return (
            <div className="html-editor-container html-editor-container--loading">
                <div className="html-editor-loading">Loading editor...</div>
            </div>
        );
    }

    return (
        <div className="html-editor-container">
            <div className="html-editor-toolbar html-editor-toolbar--compact">
                <div className="toolbar-left">
                    <button
                        type="button"
                        className="toolbar-btn toolbar-btn--primary"
                        onClick={formatHtml}
                        title="Format HTML"
                        disabled={!editable}
                    >
                        <Wand2 size={14} />
                        <span>Format</span>
                    </button>

                    <button
                        type="button"
                        className={`toolbar-btn ${showPreview ? 'active' : ''}`}
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                        <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                    </button>
                </div>

                <div className="toolbar-right">
                    {/* Future: Add more tools here */}
                </div>
            </div>

            {error && (
                <div className="html-editor-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className={`html-editor-content ${showPreview ? 'html-editor-content--split' : ''}`}>
                {/* Code Editor */}
                <div className="html-editor-code">
                    <Editor
                        height="100%"
                        language="html"
                        value={htmlContent}
                        onChange={handleCodeChange}
                        options={editorOptions}
                        theme="vs-dark"
                        onMount={handleEditorMount}
                    />
                </div>

                {/* Preview Pane */}
                {showPreview && (
                    <div className="html-editor-preview">
                        <div className="html-editor-preview__header">
                            <span>Preview</span>
                        </div>
                        <div className="html-editor-preview__content">
                            <div
                                className="html-editor-preview__frame"
                                dangerouslySetInnerHTML={{ __html: htmlContent }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HtmlEditor;
