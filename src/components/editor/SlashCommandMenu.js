// src/components/editor/SlashCommandMenu.js
import { useState, useEffect, useRef } from 'react';
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code,
    Minus,
    Image,
    Link,
    Square,
} from 'lucide-react';

const COMMANDS = [
    {
        id: 'heading1',
        label: 'Heading 1',
        description: 'Large section heading',
        icon: Heading1,
        keywords: ['h1', 'heading', 'title', 'large'],
    },
    {
        id: 'heading2',
        label: 'Heading 2',
        description: 'Medium section heading',
        icon: Heading2,
        keywords: ['h2', 'heading', 'subtitle'],
    },
    {
        id: 'heading3',
        label: 'Heading 3',
        description: 'Small section heading',
        icon: Heading3,
        keywords: ['h3', 'heading', 'small'],
    },
    {
        id: 'bulletList',
        label: 'Bullet List',
        description: 'Create a bulleted list',
        icon: List,
        keywords: ['ul', 'unordered', 'list', 'bullet'],
    },
    {
        id: 'orderedList',
        label: 'Numbered List',
        description: 'Create a numbered list',
        icon: ListOrdered,
        keywords: ['ol', 'ordered', 'list', 'number'],
    },
    {
        id: 'blockquote',
        label: 'Quote',
        description: 'Add a quote block',
        icon: Quote,
        keywords: ['quote', 'blockquote', 'citation'],
    },
    {
        id: 'divider',
        label: 'Divider',
        description: 'Add a horizontal line',
        icon: Minus,
        keywords: ['hr', 'divider', 'line', 'separator'],
    },
    {
        id: 'image',
        label: 'Image',
        description: 'Insert an image from URL',
        icon: Image,
        keywords: ['image', 'picture', 'photo', 'img'],
    },
    {
        id: 'link',
        label: 'Link',
        description: 'Insert a hyperlink',
        icon: Link,
        keywords: ['link', 'url', 'href', 'anchor'],
    },
    {
        id: 'button',
        label: 'Button',
        description: 'Add a call-to-action button',
        icon: Square,
        keywords: ['button', 'cta', 'action'],
    },
];

export default function SlashCommandMenu({ query, position, onSelect, onClose }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef(null);

    // Filter commands based on query
    const filteredCommands = COMMANDS.filter((command) => {
        if (!query) return true;
        const searchText = query.toLowerCase();
        return (
            command.label.toLowerCase().includes(searchText) ||
            command.description.toLowerCase().includes(searchText) ||
            command.keywords.some((keyword) => keyword.includes(searchText))
        );
    });

    // Reset selection when filtered results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    onSelect(filteredCommands[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredCommands, selectedIndex, onSelect, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (menuRef.current) {
            const selectedElement = menuRef.current.querySelector('.slash-menu__item--selected');
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (filteredCommands.length === 0) {
        return (
            <div
                ref={menuRef}
                className="slash-menu"
                style={{
                    position: 'fixed',
                    top: position.top,
                    left: position.left,
                }}
            >
                <div className="slash-menu__empty">No commands found</div>
            </div>
        );
    }

    return (
        <div
            ref={menuRef}
            className="slash-menu"
            style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
            }}
        >
            <div className="slash-menu__header">
                <span>Commands</span>
                <kbd>↑↓</kbd>
            </div>
            <div className="slash-menu__list">
                {filteredCommands.map((command, index) => {
                    const Icon = command.icon;
                    return (
                        <button
                            key={command.id}
                            className={`slash-menu__item ${index === selectedIndex ? 'slash-menu__item--selected' : ''}`}
                            onClick={() => onSelect(command)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="slash-menu__item-icon">
                                <Icon size={18} />
                            </div>
                            <div className="slash-menu__item-content">
                                <span className="slash-menu__item-label">{command.label}</span>
                                <span className="slash-menu__item-description">{command.description}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
