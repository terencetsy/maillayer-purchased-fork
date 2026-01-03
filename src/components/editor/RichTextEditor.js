// src/components/editor/RichTextEditor.js
import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { NodeSelection } from 'prosemirror-state';
import { uploadImageToSpaces } from '@/lib/imageUploadService';
import { ImageUpload } from './ImageUploadExtension';
import { ImageResize } from './ImageResizeExtension';
import { CustomButton } from './ButtonExtension';
import SlashCommandMenu from './SlashCommandMenu';
import BubbleMenuBar from './BubbleMenuBar';

export default function RichTextEditor({ value = '', onChange, placeholder = 'Start writing or type / for commands...', editable = true }) {
    const [isMounted, setIsMounted] = useState(false);
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
    const [slashQuery, setSlashQuery] = useState('');

    // Handle image uploads
    const handleImageUpload = async (file) => {
        try {
            const imageUrl = await uploadImageToSpaces(file);
            return imageUrl;
        } catch (error) {
            console.log('Failed to upload image. Please try again.', 'error');
            throw error;
        }
    };

    // Create a custom image extension with proper node view
    const CustomImage = Image.extend({
        addAttributes() {
            return {
                ...this.parent?.(),
                width: {
                    default: null,
                    parseHTML: (element) => element.getAttribute('width'),
                    renderHTML: (attributes) => {
                        if (!attributes.width) {
                            return {};
                        }
                        return { width: attributes.width };
                    },
                },
                height: {
                    default: null,
                    parseHTML: (element) => element.getAttribute('height'),
                    renderHTML: (attributes) => {
                        if (!attributes.height) {
                            return {};
                        }
                        return { height: attributes.height };
                    },
                },
                'data-resizable': {
                    default: 'true',
                    renderHTML: () => ({ 'data-resizable': 'true' }),
                },
            };
        },
        addNodeView() {
            return ({ node, editor, getPos }) => {
                const container = document.createElement('div');
                container.classList.add('image-container');

                const img = document.createElement('img');
                img.src = node.attrs.src;
                img.alt = node.attrs.alt || '';
                img.className = 'editor-image';

                if (node.attrs.width) {
                    img.width = node.attrs.width;
                    img.style.width = `${node.attrs.width}px`;
                }

                if (node.attrs.height) {
                    img.height = node.attrs.height;
                    img.style.height = `${node.attrs.height}px`;
                }

                img.setAttribute('data-resizable', 'true');

                container.addEventListener('click', (event) => {
                    if (typeof getPos === 'function') {
                        const pos = getPos();
                        const { state, dispatch } = editor.view;
                        const nodeSelection = NodeSelection.create(state.doc, pos);
                        dispatch(state.tr.setSelection(nodeSelection));
                        editor.view.focus();
                    }
                });

                container.appendChild(img);

                return {
                    dom: container,
                    update: (updatedNode) => {
                        const img = container.querySelector('img');
                        if (img) {
                            img.src = updatedNode.attrs.src;
                            img.alt = updatedNode.attrs.alt || '';

                            if (updatedNode.attrs.width) {
                                img.width = updatedNode.attrs.width;
                                img.style.width = `${updatedNode.attrs.width}px`;
                            }

                            if (updatedNode.attrs.height) {
                                img.height = updatedNode.attrs.height;
                                img.style.height = `${updatedNode.attrs.height}px`;
                            }
                        }
                        return true;
                    },
                };
            };
        },
    });

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            FontFamily.configure(),
            Underline,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'editor-link',
                },
                allowStyle: true,
            }),
            CustomImage.configure({
                inline: false,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'editor-image',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder,
            }),
            ImageUpload.configure({
                uploadImage: handleImageUpload,
            }),
            ImageResize,
            CustomButton,
        ],
        editable,
        content: value || getDefaultEmailTemplate(),
        onUpdate: ({ editor }) => {
            if (onChange) {
                onChange(editor.getHTML());
            }

            // Check for slash command
            const { selection } = editor.state;
            const { $from } = selection;
            const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

            // Check if we're typing a slash command
            const slashMatch = textBefore.match(/\/(\w*)$/);

            if (slashMatch) {
                setSlashQuery(slashMatch[1] || '');

                // Get cursor position for menu
                const coords = editor.view.coordsAtPos(selection.from);
                setSlashMenuPosition({
                    top: coords.bottom + 8,
                    left: coords.left,
                });
                setShowSlashMenu(true);
            } else {
                setShowSlashMenu(false);
                setSlashQuery('');
            }
        },
    });

    // Handle slash command selection
    const handleSlashCommand = useCallback((command) => {
        if (!editor) return;

        // Delete the slash and query
        const { selection } = editor.state;
        const { $from } = selection;
        const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
        const slashMatch = textBefore.match(/\/(\w*)$/);

        if (slashMatch) {
            const deleteFrom = selection.from - slashMatch[0].length;
            editor.chain().focus().deleteRange({ from: deleteFrom, to: selection.from }).run();
        }

        // Execute the command
        switch (command.id) {
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
            case 'blockquote':
                editor.chain().focus().toggleBlockquote().run();
                break;
            case 'codeBlock':
                editor.chain().focus().toggleCodeBlock().run();
                break;
            case 'divider':
                editor.chain().focus().setHorizontalRule().run();
                break;
            case 'image':
                const url = window.prompt('Enter the URL of the image:');
                if (url) {
                    editor.chain().focus().setImage({ src: url }).run();
                }
                break;
            case 'link':
                const linkUrl = window.prompt('Enter the URL:');
                if (linkUrl) {
                    editor.chain().focus().setLink({ href: linkUrl }).run();
                }
                break;
            case 'button':
                const text = window.prompt('Button text:');
                const btnUrl = window.prompt('Button URL:');
                if (text && btnUrl) {
                    editor.chain().focus().insertContent({
                        type: 'button',
                        attrs: {
                            href: btnUrl,
                            buttonText: text,
                            buttonStyle: 'primary',
                        },
                    }).run();
                }
                break;
            default:
                break;
        }

        setShowSlashMenu(false);
        setSlashQuery('');
    }, [editor]);

    // Close slash menu on escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showSlashMenu) {
                setShowSlashMenu(false);
                setSlashQuery('');
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showSlashMenu]);

    // Initialize when component mounts
    useEffect(() => {
        setIsMounted(true);

        return () => {
            if (editor) {
                editor.destroy();
            }
        };
    }, []);

    // Update content when value prop changes
    useEffect(() => {
        if (editor && value !== undefined && value !== editor.getHTML()) {
            editor.commands.setContent(value || getDefaultEmailTemplate(), false);
        }
    }, [value, editor]);

    const handleDrop = (e) => {
        // Editor's extensions will handle the drop event
    };

    const handlePaste = (e) => {
        // Editor's extensions will handle the paste event
    };

    if (!isMounted) {
        return <div className="editorLoading">Loading editor...</div>;
    }

    return (
        <div className="editorContainer editorContainer--minimal">
            {/* Bubble Menu - appears when text is selected */}
            {editor && (
                <BubbleMenu
                    editor={editor}
                    tippyOptions={{
                        duration: 150,
                        placement: 'top',
                        maxWidth: 'none',
                    }}
                    className="bubble-menu-wrapper"
                >
                    <BubbleMenuBar editor={editor} />
                </BubbleMenu>
            )}

            {/* Slash Command Menu */}
            {showSlashMenu && (
                <SlashCommandMenu
                    query={slashQuery}
                    position={slashMenuPosition}
                    onSelect={handleSlashCommand}
                    onClose={() => {
                        setShowSlashMenu(false);
                        setSlashQuery('');
                    }}
                />
            )}

            <div
                className="editorWrapper resizeHandleWrapper"
                onDrop={handleDrop}
                onPaste={handlePaste}
            >
                <EditorContent
                    editor={editor}
                    className="tipTapEditor tipTapEditor--focused"
                />
            </div>
        </div>
    );
}

// Default email template with a standard email font
function getDefaultEmailTemplate() {
    return `
    <div style="font-family: Arial, sans-serif; color: #ffffff; max-width: 600px; margin: 0 auto;">
        <h2>Email Title</h2>
        <p>Hello,</p>
        <p>Edit this template to create your email content.</p>
        <p>Best regards,</p>
        <p>Your Name</p>
    </div>
    `;
}
