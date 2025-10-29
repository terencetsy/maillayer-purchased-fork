// src/services/clientEmailSequenceService.js
export async function getEmailSequences(brandId) {
    const response = await fetch(`/api/brands/${brandId}/email-sequences`, {
        credentials: 'same-origin',
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch email sequences');
    }

    return response.json();
}

export async function getEmailSequence(brandId, sequenceId) {
    const response = await fetch(`/api/brands/${brandId}/email-sequences/${sequenceId}`, {
        credentials: 'same-origin',
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch email sequence');
    }

    return response.json();
}

export async function createEmailSequence(brandId, sequenceData) {
    const response = await fetch(`/api/brands/${brandId}/email-sequences`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sequenceData),
        credentials: 'same-origin',
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create email sequence');
    }

    return response.json();
}

export async function updateEmailSequence(brandId, sequenceId, sequenceData) {
    const response = await fetch(`/api/brands/${brandId}/email-sequences/${sequenceId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sequenceData),
        credentials: 'same-origin',
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update email sequence');
    }

    return response.json();
}

export async function deleteEmailSequence(brandId, sequenceId) {
    const response = await fetch(`/api/brands/${brandId}/email-sequences/${sequenceId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete email sequence');
    }

    return response.json();
}

export async function getSequenceEnrollments(brandId, sequenceId, options = {}) {
    const params = new URLSearchParams({
        page: options.page || 1,
        limit: options.limit || 50,
        status: options.status || '',
    });

    const response = await fetch(`/api/brands/${brandId}/email-sequences/${sequenceId}/enrollments?${params}`, {
        credentials: 'same-origin',
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch enrollments');
    }

    return response.json();
}
