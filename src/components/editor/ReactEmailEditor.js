// src/components/editor/ReactEmailEditor.js
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Play, Eye, EyeOff, AlertCircle, Copy, Check, RefreshCw } from 'lucide-react';

// Dynamically import Monaco to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const DEFAULT_TEMPLATE = `import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
  Img,
  Hr,
  Heading,
} from '@react-email/components';

export default function Email() {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome!</Heading>
          <Text style={text}>
            Hello, this is your email template built with React Email.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href="https://example.com">
              Get Started
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Best regards,<br />
            Your Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 20px',
};

const text = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
};

const buttonContainer = {
  textAlign: 'center',
  margin: '30px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
  display: 'inline-block',
};

const hr = {
  borderColor: '#e6e6e6',
  margin: '30px 0',
};

const footer = {
  color: '#8c8c8c',
  fontSize: '14px',
  lineHeight: '22px',
};
`;

export default function ReactEmailEditor({ value, onChange, editable = true }) {
    const [code, setCode] = useState(DEFAULT_TEMPLATE);
    const [preview, setPreview] = useState('');
    const [error, setError] = useState(null);
    const [showPreview, setShowPreview] = useState(true);
    const [isCompiling, setIsCompiling] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [language, setLanguage] = useState('javascript');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Compile code to HTML via API
    const compileCode = useCallback(async (sourceCode) => {
        if (!sourceCode) return;

        setIsCompiling(true);
        setError(null);

        try {
            const res = await fetch('/api/compile-react-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: sourceCode }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Compilation failed');
            }

            setPreview(data.html);
            if (onChange) {
                onChange(data.html);
            }
        } catch (err) {
            setError(err.message);
            setPreview('');
        } finally {
            setIsCompiling(false);
        }
    }, [onChange]);

    // Initial compile on mount
    useEffect(() => {
        if (isMounted) {
            compileCode(code);
        }
    }, [isMounted]);

    const handleCodeChange = (newCode) => {
        setCode(newCode);
    };

    const handleCompile = () => {
        compileCode(code);
    };

    const handleCopyHtml = async () => {
        if (preview) {
            await navigator.clipboard.writeText(preview);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const editorOptions = {
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        automaticLayout: true,
        readOnly: !editable,
        theme: 'vs-dark',
    };

    // Configure Monaco TypeScript settings to disable module errors
    const handleEditorMount = (editor, monaco) => {
        // Configure TypeScript/JavaScript compiler options
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types'],
        });

        // Disable semantic validation to avoid module not found errors
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: false,
        });

        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
        });

        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: false,
        });
    };

    if (!isMounted) {
        return (
            <div className="react-email-editor react-email-editor--loading">
                <div className="react-email-loading">Loading editor...</div>
            </div>
        );
    }

    return (
        <div className="react-email-editor">
            {/* Toolbar */}
            <div className="react-email-toolbar">
                <div className="react-email-toolbar__left">
                    <button
                        type="button"
                        className="react-email-toolbar__btn react-email-toolbar__btn--primary"
                        onClick={handleCompile}
                        disabled={isCompiling || !editable}
                    >
                        {isCompiling ? (
                            <RefreshCw size={14} className="spin" />
                        ) : (
                            <Play size={14} />
                        )}
                        <span>{isCompiling ? 'Compiling...' : 'Compile'}</span>
                    </button>

                    <button
                        type="button"
                        className={`react-email-toolbar__btn ${showPreview ? 'active' : ''}`}
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                        <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                    </button>
                </div>

                <div className="react-email-toolbar__right">
                    <div className="react-email-toolbar__lang-toggle">
                        <button
                            type="button"
                            className={`react-email-toolbar__lang-btn ${language === 'javascript' ? 'active' : ''}`}
                            onClick={() => setLanguage('javascript')}
                        >
                            JS
                        </button>
                        <button
                            type="button"
                            className={`react-email-toolbar__lang-btn ${language === 'typescript' ? 'active' : ''}`}
                            onClick={() => setLanguage('typescript')}
                        >
                            TS
                        </button>
                    </div>

                    {preview && (
                        <button
                            type="button"
                            className="react-email-toolbar__btn"
                            onClick={handleCopyHtml}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copied ? 'Copied!' : 'Copy HTML'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="react-email-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Editor Content */}
            <div className={`react-email-content ${showPreview ? 'react-email-content--split' : ''}`}>
                {/* Code Editor */}
                <div className="react-email-code">
                    <Editor
                        height="100%"
                        language={language === 'typescript' ? 'typescript' : 'javascript'}
                        path={language === 'typescript' ? 'email.tsx' : 'email.jsx'}
                        value={code}
                        onChange={handleCodeChange}
                        options={editorOptions}
                        theme="vs-dark"
                        onMount={handleEditorMount}
                    />
                </div>

                {/* Preview Pane */}
                {showPreview && (
                    <div className="react-email-preview">
                        <div className="react-email-preview__header">
                            <span>Preview</span>
                        </div>
                        <div className="react-email-preview__content">
                            {preview ? (
                                <iframe
                                    srcDoc={preview}
                                    title="Email Preview"
                                    className="react-email-preview__iframe"
                                />
                            ) : (
                                <div className="react-email-preview__empty">
                                    {isCompiling ? 'Compiling...' : 'Click "Compile" to preview your email'}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
