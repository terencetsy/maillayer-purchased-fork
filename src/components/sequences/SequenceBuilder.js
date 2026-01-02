// src/components/sequences/SequenceBuilder.js
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import CanvasNode from './canvas/CanvasNode';
import NodeDetailPanel from './canvas/NodeDetailPanel';
import { ArrowLeft, Plus, Play, Pause, Check, Loader2 } from 'lucide-react';

export default function SequenceBuilder({ sequence, onUpdate, onSave, onToggleActive, isSaving, hasUnsavedChanges, error, onClearError, brandId }) {
    const [selectedNode, setSelectedNode] = useState('trigger'); // Default to trigger
    const [nodePositions, setNodePositions] = useState({});
    const [draggingNode, setDraggingNode] = useState(null);
    const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0 });
    const [hasDragged, setHasDragged] = useState(false);

    const canvasRef = useRef(null);
    const savePositionsTimeoutRef = useRef(null);

    const NODE_WIDTH = 260;
    const NODE_HEIGHT = 56;
    const NODE_GAP = 60;
    const START_X = 40;
    const START_Y = 30;

    useEffect(() => {
        if (sequence) {
            if (sequence.canvasPositions && Object.keys(sequence.canvasPositions).length > 0) {
                setNodePositions(sequence.canvasPositions);
            } else {
                const positions = {
                    trigger: { x: START_X, y: START_Y },
                };

                sequence.emails?.forEach((email, index) => {
                    positions[email.id] = {
                        x: START_X,
                        y: START_Y + NODE_HEIGHT + NODE_GAP + index * (NODE_HEIGHT + NODE_GAP),
                    };
                });

                setNodePositions(positions);
                savePositionsToDatabase(positions);
            }
        }
    }, [sequence?._id]);

    useEffect(() => {
        if (sequence?.emails && nodePositions['trigger']) {
            let hasNewNodes = false;
            const updatedPositions = { ...nodePositions };

            sequence.emails.forEach((email, index) => {
                if (!updatedPositions[email.id]) {
                    const lastNodeY = index === 0
                        ? nodePositions['trigger'].y
                        : nodePositions[sequence.emails[index - 1]?.id]?.y || nodePositions['trigger'].y;

                    updatedPositions[email.id] = {
                        x: START_X,
                        y: lastNodeY + NODE_HEIGHT + NODE_GAP,
                    };
                    hasNewNodes = true;
                }
            });

            if (hasNewNodes) {
                setNodePositions(updatedPositions);
                savePositionsToDatabase(updatedPositions);
            }
        }
    }, [sequence?.emails?.length]);

    const savePositionsToDatabase = async (positions) => {
        if (savePositionsTimeoutRef.current) {
            clearTimeout(savePositionsTimeoutRef.current);
        }

        savePositionsTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`/api/brands/${brandId}/email-sequences/${sequence._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ canvasPositions: positions }),
                });

                if (!response.ok) {
                    console.error('Failed to save canvas positions');
                }
            } catch (error) {
                console.error('Error saving canvas positions:', error);
            }
        }, 500);
    };

    const handleCanvasMouseMove = (e) => {
        if (draggingNode) {
            setHasDragged(true);
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left - nodeDragStart.offsetX + canvasRef.current.scrollLeft;
            const y = e.clientY - rect.top - nodeDragStart.offsetY + canvasRef.current.scrollTop;

            setNodePositions({
                ...nodePositions,
                [draggingNode]: { x: Math.max(0, x), y: Math.max(0, y) },
            });
        }
    };

    const handleCanvasMouseUp = () => {
        if (draggingNode) {
            savePositionsToDatabase(nodePositions);
            setDraggingNode(null);
            setTimeout(() => setHasDragged(false), 100);
        }
    };

    const handleNodeDragStart = (nodeId, e, nodeElement) => {
        e.stopPropagation();
        setHasDragged(false);
        const rect = nodeElement.getBoundingClientRect();
        setDraggingNode(nodeId);
        setNodeDragStart({
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
        });
    };

    const handleNodeClick = (nodeId) => {
        if (!hasDragged) {
            setSelectedNode(nodeId);
        }
    };

    const validateForActivation = () => {
        if (sequence.triggerType === 'contact_list') {
            if (!sequence.triggerConfig?.contactListIds?.length) {
                return 'Configure trigger lists first';
            }
        }
        if (!sequence.emails || sequence.emails.length === 0) {
            return 'Add at least one email';
        }
        const incompleteEmails = sequence.emails.filter((email) => !email.subject || !email.content);
        if (incompleteEmails.length > 0) {
            return `Complete Email ${incompleteEmails[0].order}`;
        }
        return null;
    };

    const handleToggleClick = async () => {
        if (sequence.status !== 'active') {
            const error = validateForActivation();
            if (error) {
                alert(error);
                return;
            }
        }
        await onToggleActive();
    };

    const handleAddEmail = () => {
        const newEmailId = `email-${Date.now()}`;
        const currentEmails = sequence.emails || [];

        let newY = START_Y + NODE_HEIGHT + NODE_GAP;
        if (currentEmails.length > 0) {
            const lastEmail = currentEmails[currentEmails.length - 1];
            const lastPos = nodePositions[lastEmail.id];
            if (lastPos) {
                newY = lastPos.y + NODE_HEIGHT + NODE_GAP;
            }
        } else if (nodePositions['trigger']) {
            newY = nodePositions['trigger'].y + NODE_HEIGHT + NODE_GAP;
        }

        const newPositions = {
            ...nodePositions,
            [newEmailId]: { x: START_X, y: newY },
        };
        setNodePositions(newPositions);

        const newEmail = {
            id: newEmailId,
            order: currentEmails.length + 1,
            subject: '',
            content: '',
            delayAmount: 1,
            delayUnit: 'days',
        };

        onUpdate({ emails: [...currentEmails, newEmail] });
        savePositionsToDatabase(newPositions);
        setTimeout(() => setSelectedNode(newEmailId), 100);
    };

    const handleDeleteEmail = (emailId) => {
        if (sequence.emails.length === 1) {
            alert('Sequence must have at least one email.');
            return;
        }

        if (!window.confirm('Delete this email?')) return;

        const updatedEmails = sequence.emails.filter((e) => e.id !== emailId).map((e, index) => ({ ...e, order: index + 1 }));
        const newPositions = { ...nodePositions };
        delete newPositions[emailId];

        setNodePositions(newPositions);
        setSelectedNode('trigger');
        onUpdate({ emails: updatedEmails });
        savePositionsToDatabase(newPositions);
    };

    useEffect(() => {
        return () => {
            if (savePositionsTimeoutRef.current) {
                clearTimeout(savePositionsTimeoutRef.current);
            }
        };
    }, []);

    const getConnectionPath = (fromPos, toPos) => {
        if (!fromPos || !toPos) return '';

        const fromX = fromPos.x + NODE_WIDTH / 2;
        const fromY = fromPos.y + NODE_HEIGHT;
        const toX = toPos.x + NODE_WIDTH / 2;
        const toY = toPos.y;

        return `M ${fromX} ${fromY} L ${fromX} ${fromY + 15} L ${toX} ${toY - 15} L ${toX} ${toY}`;
    };

    return (
        <>
            <div className="sequence-builder">
                {/* Header */}
                <header className="builder-header">
                    <div className="header-left">
                        <Link href={`/brands/${brandId}/sequences`} className="back-btn">
                            <ArrowLeft size={16} />
                        </Link>
                        <span className="sequence-name">{sequence.name}</span>
                        <span className={`status-badge ${sequence.status}`}>
                            {sequence.status}
                        </span>
                    </div>
                    <div className="header-right">
                        <span className="save-status">
                            {isSaving ? (
                                <><Loader2 size={12} className="spin" /> Saving</>
                            ) : hasUnsavedChanges ? (
                                'Unsaved'
                            ) : (
                                <><Check size={12} /> Saved</>
                            )}
                        </span>
                        <button
                            className={`header-btn ${sequence.status === 'active' ? 'secondary' : 'primary'}`}
                            onClick={handleToggleClick}
                        >
                            {sequence.status === 'active' ? (
                                <><Pause size={14} /> Pause</>
                            ) : (
                                <><Play size={14} /> Activate</>
                            )}
                        </button>
                    </div>
                </header>

                {/* Error Banner */}
                {error && (
                    <div className="error-banner">
                        <span>{error}</span>
                        <button onClick={onClearError}>&times;</button>
                    </div>
                )}

                {/* Main Content - Two Column Layout */}
                <div className="builder-content">
                    {/* Left: Canvas with Nodes */}
                    <div className="canvas-section">
                        <div
                            ref={canvasRef}
                            className="canvas"
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                        >
                            <div className="grid-pattern" />

                            <svg className="connections-svg">
                                {sequence.emails?.length > 0 && nodePositions['trigger'] && nodePositions[sequence.emails[0].id] && (
                                    <path
                                        d={getConnectionPath(nodePositions['trigger'], nodePositions[sequence.emails[0].id])}
                                        className="connection-line"
                                    />
                                )}

                                {sequence.emails?.map((email, index) => {
                                    if (index === 0) return null;
                                    const prevEmail = sequence.emails[index - 1];
                                    if (!nodePositions[prevEmail.id] || !nodePositions[email.id]) return null;

                                    return (
                                        <path
                                            key={`line-${email.id}`}
                                            d={getConnectionPath(nodePositions[prevEmail.id], nodePositions[email.id])}
                                            className="connection-line"
                                        />
                                    );
                                })}
                            </svg>

                            <div className="nodes-layer">
                                {nodePositions['trigger'] && (
                                    <CanvasNode
                                        type="trigger"
                                        data={sequence}
                                        isSelected={selectedNode === 'trigger'}
                                        onClick={() => handleNodeClick('trigger')}
                                        onDragStart={(e, element) => handleNodeDragStart('trigger', e, element)}
                                        position={nodePositions['trigger']}
                                        isDragging={draggingNode === 'trigger'}
                                    />
                                )}

                                {sequence.emails?.map((email, index) => {
                                    if (!nodePositions[email.id]) return null;
                                    return (
                                        <CanvasNode
                                            key={email.id}
                                            type="email"
                                            data={email}
                                            index={index}
                                            isSelected={selectedNode === email.id}
                                            onClick={() => handleNodeClick(email.id)}
                                            onDelete={() => handleDeleteEmail(email.id)}
                                            onDragStart={(e, element) => handleNodeDragStart(email.id, e, element)}
                                            position={nodePositions[email.id]}
                                            isDragging={draggingNode === email.id}
                                        />
                                    );
                                })}

                                {nodePositions['trigger'] && (() => {
                                    const lastNodeId = sequence.emails?.length > 0
                                        ? sequence.emails[sequence.emails.length - 1].id
                                        : 'trigger';
                                    const lastNodePos = nodePositions[lastNodeId] || nodePositions['trigger'];

                                    return (
                                        <button
                                            className="add-email-btn"
                                            onClick={handleAddEmail}
                                            style={{
                                                position: 'absolute',
                                                left: `${lastNodePos.x}px`,
                                                top: `${lastNodePos.y + NODE_HEIGHT + 20}px`,
                                            }}
                                        >
                                            <Plus size={14} />
                                            <span>Add Email</span>
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Right: Detail Panel */}
                    <div className="detail-section">
                        <NodeDetailPanel
                            nodeId={selectedNode}
                            sequence={sequence}
                            onUpdate={onUpdate}
                            brandId={brandId}
                        />
                    </div>
                </div>
            </div>

            <style jsx>{`
                .sequence-builder {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #0a0a0a;
                    overflow: hidden;
                }

                .builder-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 16px;
                    height: 48px;
                    background: #0a0a0a;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    flex-shrink: 0;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .back-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 6px;
                    color: #71717a;
                    text-decoration: none;
                    transition: all 0.15s;
                }

                .back-btn:hover {
                    background: rgba(255,255,255,0.08);
                    color: #fafafa;
                }

                .sequence-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: #fafafa;
                }

                .status-badge {
                    padding: 2px 8px;
                    font-size: 11px;
                    font-weight: 500;
                    border-radius: 4px;
                    text-transform: capitalize;
                }

                .status-badge.active {
                    background: rgba(34, 197, 94, 0.15);
                    color: #22c55e;
                }

                .status-badge.paused {
                    background: rgba(245, 158, 11, 0.15);
                    color: #f59e0b;
                }

                .status-badge.draft {
                    background: rgba(255,255,255,0.08);
                    color: #71717a;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .save-status {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: #52525b;
                }

                .header-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    font-size: 13px;
                    font-weight: 500;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .header-btn.primary {
                    background: #fafafa;
                    color: #0a0a0a;
                }

                .header-btn.primary:hover {
                    background: #e4e4e7;
                }

                .header-btn.secondary {
                    background: rgba(255,255,255,0.08);
                    color: #a1a1aa;
                }

                .header-btn.secondary:hover {
                    background: rgba(255,255,255,0.12);
                    color: #fafafa;
                }

                .error-banner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 16px;
                    background: rgba(239, 68, 68, 0.1);
                    border-bottom: 1px solid rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    font-size: 13px;
                    flex-shrink: 0;
                }

                .error-banner button {
                    background: none;
                    border: none;
                    font-size: 16px;
                    color: #ef4444;
                    cursor: pointer;
                }

                .builder-content {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                }

                .canvas-section {
                    width: 50%;
                    flex-shrink: 0;
                    border-right: 1px solid rgba(255,255,255,0.08);
                    overflow: hidden;
                }

                .canvas {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    overflow: auto;
                }

                .grid-pattern {
                    position: absolute;
                    inset: 0;
                    background-color: #0a0a0a;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
                    background-size: 20px 20px;
                    pointer-events: none;
                }

                .connections-svg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    overflow: visible;
                }

                :global(.connection-line) {
                    fill: none;
                    stroke: rgba(255,255,255,0.12);
                    stroke-width: 2;
                    stroke-dasharray: 4 4;
                }

                .nodes-layer {
                    position: relative;
                    min-width: 100%;
                    min-height: 100%;
                    padding: 20px;
                    padding-bottom: 200px;
                }

                .add-email-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    width: 260px;
                    padding: 8px;
                    background: transparent;
                    border: 1px dashed rgba(255,255,255,0.12);
                    border-radius: 8px;
                    color: #52525b;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .add-email-btn:hover {
                    border-color: rgba(255,255,255,0.2);
                    color: #a1a1aa;
                    background: rgba(255,255,255,0.02);
                }

                .detail-section {
                    flex: 1;
                    overflow: hidden;
                    background: #0a0a0a;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                :global(.spin) {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </>
    );
}
