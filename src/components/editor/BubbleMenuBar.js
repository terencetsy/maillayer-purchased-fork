// src/components/editor/BubbleMenuBar.js
import { useState, useRef, useEffect } from 'react';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Code,
    Link as LinkIcon,
    ChevronDown,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Type,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Code2,
    Quote,
    Palette,
    Highlighter,
    X,
    Check,
    Unlink,
} from 'lucide-react';

const TEXT_OPTIONS = [
    { id: 'paragraph', label: 'Text', icon: Type },
    { id: 'heading1', label: 'Heading 1', icon: Heading1 },
    { id: 'heading2', label: 'Heading 2', icon: Heading2 },
    { id: 'heading3', label: 'Heading 3', icon: Heading3 },
    { id: 'bulletList', label: 'Bullet List', icon: List },
    { id: 'orderedList', label: 'Numbered List', icon: ListOrdered },
    { id: 'taskList', label: 'Todo List', icon: CheckSquare },
    { id: 'codeBlock', label: 'Code Block', icon: Code2 },
    { id: 'blockquote', label: 'Quote', icon: Quote },
];

const FONT_OPTIONS = [
    { label: 'Default', value: null },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Tahoma', value: 'Tahoma, sans-serif' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
];

const TEXT_COLORS = [
    { name: 'Default', value: null },
    { name: 'Gray', value: '#9ca3af' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
];

const HIGHLIGHT_COLORS = [
    { name: 'None', value: null },
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Purple', value: '#e9d5ff' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Red', value: '#fecaca' },
    { name: 'Orange', value: '#fed7aa' },
];

export default function BubbleMenuBar({ editor }) {
    const [showTextDropdown, setShowTextDropdown] = useState(false);
    const [showFontDropdown, setShowFontDropdown] = useState(false);
    const [showColorDropdown, setShowColorDropdown] = useState(false);
    const [showHighlightDropdown, setShowHighlightDropdown] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const dropdownRef = useRef(null);
    const fontRef = useRef(null);
    const colorRef = useRef(null);
    const highlightRef = useRef(null);
    const linkInputRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowTextDropdown(false);
            }
            if (fontRef.current && !fontRef.current.contains(e.target)) {
                setShowFontDropdown(false);
            }
            if (colorRef.current && !colorRef.current.contains(e.target)) {
                setShowColorDropdown(false);
            }
            if (highlightRef.current && !highlightRef.current.contains(e.target)) {
                setShowHighlightDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus link input when shown
    useEffect(() => {
        if (showLinkInput && linkInputRef.current) {
            linkInputRef.current.focus();
        }
    }, [showLinkInput]);

    if (!editor) return null;

    const getCurrentTextType = () => {
        if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
        if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
        if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
        if (editor.isActive('bulletList')) return 'Bullet List';
        if (editor.isActive('orderedList')) return 'Numbered List';
        if (editor.isActive('taskList')) return 'Todo List';
        if (editor.isActive('codeBlock')) return 'Code Block';
        if (editor.isActive('blockquote')) return 'Quote';
        return 'Text';
    };

    const getCurrentFont = () => {
        const fontFamily = editor.getAttributes('textStyle').fontFamily;
        if (!fontFamily) return 'Default';
        const found = FONT_OPTIONS.find(f => f.value === fontFamily);
        return found ? found.label : 'Default';
    };

    const handleTextOption = (optionId) => {
        switch (optionId) {
            case 'paragraph':
                editor.chain().focus().setParagraph().run();
                break;
            case 'heading1':
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                break;
            case 'heading2':
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                break;
            case 'heading3':
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                break;
            case 'bulletList':
                editor.chain().focus().toggleBulletList().run();
                break;
            case 'orderedList':
                editor.chain().focus().toggleOrderedList().run();
                break;
            case 'taskList':
                editor.chain().focus().toggleTaskList().run();
                break;
            case 'codeBlock':
                editor.chain().focus().toggleCodeBlock().run();
                break;
            case 'blockquote':
                editor.chain().focus().toggleBlockquote().run();
                break;
        }
        setShowTextDropdown(false);
    };

    const handleFontChange = (fontValue) => {
        if (fontValue === null) {
            editor.chain().focus().unsetFontFamily().run();
        } else {
            editor.chain().focus().setFontFamily(fontValue).run();
        }
        setShowFontDropdown(false);
    };

    const handleLinkClick = () => {
        const previousUrl = editor.getAttributes('link').href || '';
        setLinkUrl(previousUrl);
        setShowLinkInput(true);
    };

    const applyLink = () => {
        if (linkUrl === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
        }
        setShowLinkInput(false);
        setLinkUrl('');
    };

    const removeLink = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        setShowLinkInput(false);
        setLinkUrl('');
    };

    const cancelLink = () => {
        setShowLinkInput(false);
        setLinkUrl('');
        editor.chain().focus().run();
    };

    const handleLinkKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyLink();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelLink();
        }
    };

    const setTextColor = (color) => {
        if (color === null) {
            editor.chain().focus().unsetColor().run();
        } else {
            editor.chain().focus().setColor(color).run();
        }
        setShowColorDropdown(false);
    };

    const setHighlight = (color) => {
        if (color === null) {
            editor.chain().focus().unsetHighlight().run();
        } else {
            editor.chain().focus().setHighlight({ color }).run();
        }
        setShowHighlightDropdown(false);
    };

    const getCurrentColor = () => {
        const color = editor.getAttributes('textStyle').color;
        return color || null;
    };

    const getCurrentHighlight = () => {
        const highlight = editor.getAttributes('highlight').color;
        return highlight || null;
    };

    // If showing link input, render the inline link editor
    if (showLinkInput) {
        return (
            <div className="bubble-menu-bar bubble-menu-bar--link">
                <input
                    ref={linkInputRef}
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={handleLinkKeyDown}
                    placeholder="Enter URL..."
                    className="bubble-menu-bar__link-input"
                />
                <button
                    onClick={applyLink}
                    className="bubble-menu-bar__btn bubble-menu-bar__btn--confirm"
                    title="Apply link"
                >
                    <Check size={16} />
                </button>
                {editor.isActive('link') && (
                    <button
                        onClick={removeLink}
                        className="bubble-menu-bar__btn bubble-menu-bar__btn--remove"
                        title="Remove link"
                    >
                        <Unlink size={16} />
                    </button>
                )}
                <button
                    onClick={cancelLink}
                    className="bubble-menu-bar__btn"
                    title="Cancel"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="bubble-menu-bar">
            {/* Font Dropdown */}
            <div className="bubble-menu-bar__dropdown" ref={fontRef}>
                <button
                    className="bubble-menu-bar__dropdown-btn bubble-menu-bar__dropdown-btn--font"
                    onClick={() => setShowFontDropdown(!showFontDropdown)}
                    title="Font Family"
                >
                    <span>{getCurrentFont()}</span>
                    <ChevronDown size={12} />
                </button>

                {showFontDropdown && (
                    <div className="bubble-menu-bar__dropdown-menu bubble-menu-bar__dropdown-menu--font">
                        {FONT_OPTIONS.map((font) => {
                            const currentFont = editor.getAttributes('textStyle').fontFamily;
                            const isActive = font.value === currentFont || (font.value === null && !currentFont);

                            return (
                                <button
                                    key={font.label}
                                    className={`bubble-menu-bar__dropdown-item ${isActive ? 'is-active' : ''}`}
                                    onClick={() => handleFontChange(font.value)}
                                    style={{ fontFamily: font.value || 'inherit' }}
                                >
                                    <span>{font.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bubble-menu-bar__divider" />

            {/* Text Type Dropdown */}
            <div className="bubble-menu-bar__dropdown" ref={dropdownRef}>
                <button
                    className="bubble-menu-bar__dropdown-btn"
                    onClick={() => setShowTextDropdown(!showTextDropdown)}
                >
                    <Type size={14} />
                    <span>{getCurrentTextType()}</span>
                    <ChevronDown size={12} />
                </button>

                {showTextDropdown && (
                    <div className="bubble-menu-bar__dropdown-menu">
                        {TEXT_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const isActive =
                                (option.id === 'paragraph' && !editor.isActive('heading') && !editor.isActive('bulletList') && !editor.isActive('orderedList') && !editor.isActive('taskList') && !editor.isActive('codeBlock') && !editor.isActive('blockquote')) ||
                                (option.id === 'heading1' && editor.isActive('heading', { level: 1 })) ||
                                (option.id === 'heading2' && editor.isActive('heading', { level: 2 })) ||
                                (option.id === 'heading3' && editor.isActive('heading', { level: 3 })) ||
                                (option.id === 'bulletList' && editor.isActive('bulletList')) ||
                                (option.id === 'orderedList' && editor.isActive('orderedList')) ||
                                (option.id === 'taskList' && editor.isActive('taskList')) ||
                                (option.id === 'codeBlock' && editor.isActive('codeBlock')) ||
                                (option.id === 'blockquote' && editor.isActive('blockquote'));

                            return (
                                <button
                                    key={option.id}
                                    className={`bubble-menu-bar__dropdown-item ${isActive ? 'is-active' : ''}`}
                                    onClick={() => handleTextOption(option.id)}
                                >
                                    <Icon size={16} />
                                    <span>{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bubble-menu-bar__divider" />

            {/* Bold */}
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`bubble-menu-bar__btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                title="Bold (Ctrl+B)"
            >
                <Bold size={15} />
            </button>

            {/* Italic */}
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`bubble-menu-bar__btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                title="Italic (Ctrl+I)"
            >
                <Italic size={15} />
            </button>

            {/* Underline */}
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`bubble-menu-bar__btn ${editor.isActive('underline') ? 'is-active' : ''}`}
                title="Underline (Ctrl+U)"
            >
                <Underline size={15} />
            </button>

            {/* Strikethrough */}
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`bubble-menu-bar__btn ${editor.isActive('strike') ? 'is-active' : ''}`}
                title="Strikethrough"
            >
                <Strikethrough size={15} />
            </button>

            {/* Code */}
            <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`bubble-menu-bar__btn ${editor.isActive('code') ? 'is-active' : ''}`}
                title="Inline Code"
            >
                <Code size={15} />
            </button>

            <div className="bubble-menu-bar__divider" />

            {/* Text Color Dropdown */}
            <div className="bubble-menu-bar__dropdown" ref={colorRef}>
                <button
                    className={`bubble-menu-bar__btn ${getCurrentColor() ? 'is-active' : ''}`}
                    onClick={() => setShowColorDropdown(!showColorDropdown)}
                    title="Text Color"
                >
                    <Palette size={15} />
                    {getCurrentColor() && (
                        <span
                            className="bubble-menu-bar__color-indicator"
                            style={{ backgroundColor: getCurrentColor() }}
                        />
                    )}
                </button>

                {showColorDropdown && (
                    <div className="bubble-menu-bar__color-menu">
                        <div className="bubble-menu-bar__color-label">Text Color</div>
                        <div className="bubble-menu-bar__color-grid">
                            {TEXT_COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    className={`bubble-menu-bar__color-swatch ${getCurrentColor() === color.value ? 'is-active' : ''}`}
                                    style={{ backgroundColor: color.value || '#fafafa' }}
                                    onClick={() => setTextColor(color.value)}
                                    title={color.name}
                                >
                                    {color.value === null && <span className="bubble-menu-bar__color-default">A</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Highlight Color Dropdown */}
            <div className="bubble-menu-bar__dropdown" ref={highlightRef}>
                <button
                    className={`bubble-menu-bar__btn ${getCurrentHighlight() ? 'is-active' : ''}`}
                    onClick={() => setShowHighlightDropdown(!showHighlightDropdown)}
                    title="Highlight"
                >
                    <Highlighter size={15} />
                    {getCurrentHighlight() && (
                        <span
                            className="bubble-menu-bar__color-indicator"
                            style={{ backgroundColor: getCurrentHighlight() }}
                        />
                    )}
                </button>

                {showHighlightDropdown && (
                    <div className="bubble-menu-bar__color-menu">
                        <div className="bubble-menu-bar__color-label">Highlight</div>
                        <div className="bubble-menu-bar__color-grid">
                            {HIGHLIGHT_COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    className={`bubble-menu-bar__color-swatch ${getCurrentHighlight() === color.value ? 'is-active' : ''}`}
                                    style={{ backgroundColor: color.value || 'transparent' }}
                                    onClick={() => setHighlight(color.value)}
                                    title={color.name}
                                >
                                    {color.value === null && <X size={12} />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bubble-menu-bar__divider" />

            {/* Link */}
            <button
                onClick={handleLinkClick}
                className={`bubble-menu-bar__btn ${editor.isActive('link') ? 'is-active' : ''}`}
                title="Link (Ctrl+K)"
            >
                <LinkIcon size={15} />
            </button>

            <div className="bubble-menu-bar__divider" />

            {/* Alignment */}
            <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`bubble-menu-bar__btn ${editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}`}
                title="Align Left"
            >
                <AlignLeft size={15} />
            </button>

            <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`bubble-menu-bar__btn ${editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}`}
                title="Align Center"
            >
                <AlignCenter size={15} />
            </button>

            <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`bubble-menu-bar__btn ${editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}`}
                title="Align Right"
            >
                <AlignRight size={15} />
            </button>
        </div>
    );
}
