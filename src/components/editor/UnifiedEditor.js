// src/components/editor/UnifiedEditor.js
import { useState, useEffect } from 'react';
import { Edit3, Code, Blocks } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import HtmlEditor from './HtmlEditor';
import ReactEmailEditor from './ReactEmailEditor';

const UnifiedEditor = ({
    value,
    onChange,
    onModeChange,
    placeholder = 'Start writing...',
    editable = true,
    defaultMode = 'visual', // 'visual', 'html', or 'react'
}) => {
    const [editorMode, setEditorMode] = useState(defaultMode);
    const [content, setContent] = useState(value || '');

    useEffect(() => {
        setContent(value || '');
    }, [value]);

    useEffect(() => {
        setEditorMode(defaultMode);
    }, [defaultMode]);

    const handleContentChange = (newContent) => {
        setContent(newContent);
        onChange(newContent);
    };

    const handleModeChange = (newMode) => {
        setEditorMode(newMode);
        if (onModeChange) {
            onModeChange(newMode);
        }
    };

    const switchToVisual = () => {
        if (editorMode !== 'visual') {
            handleModeChange('visual');
        }
    };

    const switchToHtml = () => {
        if (editorMode !== 'html') {
            handleModeChange('html');
        }
    };

    const switchToReact = () => {
        if (editorMode !== 'react') {
            handleModeChange('react');
        }
    };

    return (
        <div className="unified-editor">
            <div className="editor-mode-selector editor-mode-selector--compact">
                <div className="mode-tabs">
                    <button
                        type="button"
                        className={`mode-tab ${editorMode === 'visual' ? 'active' : ''}`}
                        onClick={switchToVisual}
                        disabled={!editable}
                    >
                        <Edit3 size={14} />
                        <span>Visual</span>
                    </button>

                    <button
                        type="button"
                        className={`mode-tab ${editorMode === 'html' ? 'active' : ''}`}
                        onClick={switchToHtml}
                        disabled={!editable}
                    >
                        <Code size={14} />
                        <span>HTML</span>
                    </button>

                    <button
                        type="button"
                        className={`mode-tab ${editorMode === 'react' ? 'active' : ''}`}
                        onClick={switchToReact}
                        disabled={!editable}
                    >
                        <Blocks size={14} />
                        <span>React Email</span>
                    </button>
                </div>
            </div>

            <div className="editor-content-area">
                {editorMode === 'visual' && (
                    <RichTextEditor
                        value={content}
                        onChange={handleContentChange}
                        placeholder={placeholder}
                        editable={editable}
                    />
                )}
                {editorMode === 'html' && (
                    <HtmlEditor
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Enter your HTML content here..."
                        editable={editable}
                    />
                )}
                {editorMode === 'react' && (
                    <ReactEmailEditor
                        value={content}
                        onChange={handleContentChange}
                        editable={editable}
                    />
                )}
            </div>
        </div>
    );
};

export default UnifiedEditor;
