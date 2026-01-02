// src/components/sequences/canvas/CanvasNode.js
import { useRef } from 'react';
import { Users, Mail, Clock, Trash2, AlertCircle, Check } from 'lucide-react';

export default function CanvasNode({ type, data, index, isSelected, onClick, onDelete, onDragStart, position, isDragging }) {
    const nodeRef = useRef(null);

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        if (onDragStart && nodeRef.current) {
            onDragStart(e, nodeRef.current);
        }
    };

    if (type === 'trigger') {
        const isConfigured = data.triggerConfig?.contactListIds?.length > 0;
        const listCount = data.triggerConfig?.contactListIds?.length || 0;

        return (
            <div
                ref={nodeRef}
                className={`node ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
                onClick={onClick}
                onMouseDown={handleMouseDown}
                style={{
                    position: 'absolute',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            >
                <div className="node-icon trigger">
                    <Users size={16} />
                </div>
                <div className="node-body">
                    <span className="node-label">Trigger</span>
                    <span className="node-title">
                        {isConfigured ? `${listCount} Contact List${listCount > 1 ? 's' : ''}` : 'Select lists'}
                    </span>
                </div>
                <div className={`node-status ${isConfigured ? 'success' : 'warning'}`}>
                    {isConfigured ? <Check size={12} /> : <AlertCircle size={12} />}
                </div>

                <style jsx>{`
                    .node {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 10px 12px;
                        background: #111;
                        border: 1px solid rgba(255,255,255,0.08);
                        border-radius: 10px;
                        width: 260px;
                        cursor: grab;
                        transition: all 0.15s;
                        user-select: none;
                    }

                    .node:hover {
                        border-color: rgba(255,255,255,0.15);
                        background: #141414;
                    }

                    .node.selected {
                        border-color: rgba(255,255,255,0.3);
                        background: #171717;
                    }

                    .node.dragging {
                        cursor: grabbing;
                        opacity: 0.9;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    }

                    .node-icon {
                        width: 32px;
                        height: 32px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }

                    .node-icon.trigger {
                        background: rgba(99, 102, 241, 0.15);
                        color: #818cf8;
                    }

                    .node-body {
                        flex: 1;
                        min-width: 0;
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }

                    .node-label {
                        font-size: 10px;
                        color: #52525b;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        font-weight: 500;
                    }

                    .node-title {
                        font-size: 13px;
                        font-weight: 500;
                        color: #fafafa;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .node-status {
                        width: 22px;
                        height: 22px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }

                    .node-status.success {
                        background: rgba(34, 197, 94, 0.15);
                        color: #22c55e;
                    }

                    .node-status.warning {
                        background: rgba(245, 158, 11, 0.15);
                        color: #f59e0b;
                    }
                `}</style>
            </div>
        );
    }

    if (type === 'email') {
        const isConfigured = data.subject && data.content;
        const delayText = `${data.delayAmount || 1} ${data.delayUnit || 'days'}`;

        return (
            <div
                ref={nodeRef}
                className={`node ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
                onClick={onClick}
                onMouseDown={handleMouseDown}
                style={{
                    position: 'absolute',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            >
                <div className="node-icon email">
                    <Mail size={16} />
                </div>
                <div className="node-body">
                    <div className="node-header">
                        <span className="node-label">Email {index + 1}</span>
                        <span className="delay-badge">
                            <Clock size={10} />
                            {delayText}
                        </span>
                    </div>
                    <span className="node-title">{data.subject || 'No subject'}</span>
                </div>
                <div className={`node-status ${isConfigured ? 'success' : 'warning'}`}>
                    {isConfigured ? <Check size={12} /> : <AlertCircle size={12} />}
                </div>

                {onDelete && (
                    <button
                        className="delete-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <Trash2 size={12} />
                    </button>
                )}

                <style jsx>{`
                    .node {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 10px 12px;
                        background: #111;
                        border: 1px solid rgba(255,255,255,0.08);
                        border-radius: 10px;
                        width: 260px;
                        cursor: grab;
                        transition: all 0.15s;
                        position: relative;
                        user-select: none;
                    }

                    .node:hover {
                        border-color: rgba(255,255,255,0.15);
                        background: #141414;
                    }

                    .node.selected {
                        border-color: rgba(255,255,255,0.3);
                        background: #171717;
                    }

                    .node.dragging {
                        cursor: grabbing;
                        opacity: 0.9;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    }

                    .node-icon {
                        width: 32px;
                        height: 32px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }

                    .node-icon.email {
                        background: rgba(236, 72, 153, 0.15);
                        color: #f472b6;
                    }

                    .node-body {
                        flex: 1;
                        min-width: 0;
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }

                    .node-header {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }

                    .node-label {
                        font-size: 10px;
                        color: #52525b;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        font-weight: 500;
                    }

                    .delay-badge {
                        display: flex;
                        align-items: center;
                        gap: 3px;
                        font-size: 10px;
                        color: #71717a;
                        background: rgba(255,255,255,0.05);
                        padding: 2px 6px;
                        border-radius: 4px;
                    }

                    .node-title {
                        font-size: 13px;
                        font-weight: 500;
                        color: #fafafa;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .node-status {
                        width: 22px;
                        height: 22px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }

                    .node-status.success {
                        background: rgba(34, 197, 94, 0.15);
                        color: #22c55e;
                    }

                    .node-status.warning {
                        background: rgba(245, 158, 11, 0.15);
                        color: #f59e0b;
                    }

                    .delete-btn {
                        position: absolute;
                        top: -8px;
                        right: -8px;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #1c1c1c;
                        border: 1px solid rgba(255,255,255,0.1);
                        color: #71717a;
                        display: none;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.15s;
                    }

                    .node:hover .delete-btn {
                        display: flex;
                    }

                    .delete-btn:hover {
                        background: rgba(239, 68, 68, 0.2);
                        border-color: rgba(239, 68, 68, 0.3);
                        color: #ef4444;
                    }
                `}</style>
            </div>
        );
    }

    return null;
}
