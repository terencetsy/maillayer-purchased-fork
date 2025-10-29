// src/components/sequences/SequenceCanvas.js
import { useRef } from 'react';
import { Plus, Zap } from 'lucide-react';
import TriggerBlock from './blocks/TriggerBlock';
import EmailBlock from './blocks/EmailBlock';
import AddEmailButton from './blocks/AddEmailButton';

export default function SequenceCanvas({ sequence, onUpdate, selectedStep, setSelectedStep }) {
    const canvasRef = useRef(null);

    const handleAddEmail = () => {
        const newEmailId = `email-${Date.now()}`;
        const newEmail = {
            id: newEmailId,
            order: (sequence.emails?.length || 0) + 1,
            subject: '',
            content: '',
            delayAmount: 1,
            delayUnit: 'days',
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
                <div className="canvas-flow">
                    {/* Trigger Block */}
                    <TriggerBlock
                        sequence={sequence}
                        isSelected={selectedStep === 'trigger'}
                        onClick={() => setSelectedStep('trigger')}
                    />

                    {/* Email Blocks with Connectors */}
                    {sequence.emails?.map((email, index) => (
                        <div key={email.id}>
                            {/* Connector */}
                            <div className="flow-connector">
                                <div className="connector-line" />
                                <div className="connector-time">
                                    {email.delayAmount} {email.delayUnit}
                                    {index > 0 ? ' after previous' : ' after trigger'}
                                </div>
                            </div>

                            {/* Email Block */}
                            <EmailBlock
                                email={email}
                                index={index}
                                isSelected={selectedStep === email.id}
                                onClick={() => setSelectedStep(email.id)}
                                totalEmails={sequence.emails.length}
                            />
                        </div>
                    ))}

                    {/* Connector before Add Button */}
                    {sequence.emails?.length > 0 && (
                        <div className="flow-connector">
                            <div className="connector-line" />
                        </div>
                    )}

                    {/* Add Email Button */}
                    <AddEmailButton onClick={handleAddEmail} />
                </div>
            </div>
        </div>
    );
}
