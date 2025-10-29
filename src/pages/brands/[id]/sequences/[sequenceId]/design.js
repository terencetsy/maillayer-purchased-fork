// src/pages/brands/[id]/sequences/[sequenceId]/design.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import SequenceCanvas from '@/components/sequences/SequenceCanvas';
import SequenceSidebar from '@/components/sequences/SequenceSidebar';
import { getEmailSequence, updateEmailSequence } from '@/services/clientEmailSequenceService';

export default function SequenceDesign() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id, sequenceId } = router.query;

    const [sequence, setSequence] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [selectedStep, setSelectedStep] = useState('trigger');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && id && sequenceId) {
            fetchSequence();
        }
    }, [status, id, sequenceId]);

    const fetchSequence = async () => {
        try {
            const data = await getEmailSequence(id, sequenceId);
            setSequence(data);
        } catch (error) {
            console.error('Error fetching sequence:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = (updates) => {
        setSequence((prev) => ({ ...prev, ...updates }));
        setHasUnsavedChanges(true);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await updateEmailSequence(id, sequenceId, sequence);
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Error saving sequence:', error);
            setError(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async () => {
        const newStatus = sequence.status === 'active' ? 'paused' : 'active';
        try {
            await updateEmailSequence(id, sequenceId, { status: newStatus });
            setSequence((prev) => ({ ...prev, status: newStatus }));
        } catch (error) {
            console.error('Error toggling status:', error);
            setError(error.message);
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div>Loading...</div>
            </div>
        );
    }

    if (!sequence) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div>Sequence not found</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <SequenceCanvas
                sequence={sequence}
                onUpdate={handleUpdate}
                selectedStep={selectedStep}
                setSelectedStep={setSelectedStep}
            />
            <SequenceSidebar
                sequence={sequence}
                onUpdate={handleUpdate}
                selectedStep={selectedStep}
                setSelectedStep={setSelectedStep}
                onSave={handleSave}
                onToggleActive={handleToggleActive}
                saving={isSaving}
                hasUnsavedChanges={hasUnsavedChanges}
                userObj={session?.user}
            />
        </div>
    );
}
