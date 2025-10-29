// src/components/sequences/SequenceCanvas.js
import { useState, useRef, useEffect } from 'react';
import { Plus, Mail, AlertCircle } from 'lucide-react';
import TriggerBlock from './blocks/TriggerBlock';
import EmailBlock from './blocks/EmailBlock';
import AddEmailButton from './blocks/AddEmailButton';

export default function SequenceCanvas({ sequence, onUpdate, selectedStep, setSelectedStep }) {
    const canvasRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleAddEmail = () => {
        const newEmailId = `email-${Date.now()}`;
        const newEmail = {
            id: newEmailId,
            order: (sequence.emails?.length || 0) + 1,
            subject: '',
            content: '',
            delayAmount: 1,
            delayUnit: 'days',
            position: {
                x: 0,
                y: (sequence.emails?.length || 0) * 200 + 300,
            },
        };

        onUpdate({
            emails: [...(sequence.emails || []), newEmail],
        });

        setSelectedStep(newEmailId);
    };

    return (
        <div
            className="sequence-canvas"
            ref={canvasRef}
        >
            <div className="canvas-content">
                {/* Trigger Block */}
                <div
                    className="canvas-block-wrapper"
                    style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}
                >
                    <TriggerBlock
                        sequence={sequence}
                        isSelected={selectedStep === 'trigger'}
                        onClick={() => setSelectedStep('trigger')}
                    />
                </div>

                {/* Connection Line */}
                {sequence.emails && sequence.emails.length > 0 && (
                    <div
                        className="canvas-connection-line"
                        style={{ top: 100, left: '50%', height: 60 }}
                    />
                )}

                {/* Email Blocks */}
                {sequence.emails?.map((email, index) => (
                    <div key={email.id}>
                        <div
                            className="canvas-block-wrapper"
                            style={{
                                top: 160 + index * 180,
                                left: '50%',
                                transform: 'translateX(-50%)',
                            }}
                        >
                            <EmailBlock
                                email={email}
                                index={index}
                                isSelected={selectedStep === email.id}
                                onClick={() => setSelectedStep(email.id)}
                                totalEmails={sequence.emails.length}
                            />
                        </div>

                        {/* Connection Line to next email */}
                        {index < sequence.emails.length - 1 && (
                            <div
                                className="canvas-connection-line"
                                style={{
                                    top: 160 + index * 180 + 80,
                                    left: '50%',
                                    height: 100,
                                }}
                            />
                        )}
                    </div>
                ))}

                {/* Add Email Button */}
                <div
                    className="canvas-block-wrapper"
                    style={{
                        top: 160 + (sequence.emails?.length || 0) * 180,
                        left: '50%',
                        transform: 'translateX(-50%)',
                    }}
                >
                    <AddEmailButton onClick={handleAddEmail} />
                </div>
            </div>

            <style jsx>{`
                .sequence-canvas {
                    flex: 1;
                    position: relative;
                    background: #fafafa;
                    overflow: auto;
                    min-height: 100vh;
                }

                .canvas-content {
                    position: relative;
                    width: 100%;
                    min-height: 100%;
                    padding: 40px;
                }

                .canvas-block-wrapper {
                    position: absolute;
                    z-index: 1;
                }

                .canvas-connection-line {
                    position: absolute;
                    width: 2px;
                    background: #e0e0e0;
                    transform: translateX(-1px);
                    z-index: 0;
                }
            `}</style>
        </div>
    );
}
