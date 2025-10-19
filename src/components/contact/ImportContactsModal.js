import { useState, useRef, useEffect } from 'react';
import { X, Loader, AlertCircle, Upload, ArrowLeft, CheckCircle, FileText } from 'lucide-react';
import Papa from 'papaparse';

export default function ImportContactsModal({ brandId, listId, method = 'manual', onClose, onSuccess }) {
    const [currentMethod, setCurrentMethod] = useState(method);
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const [batchProgress, setBatchProgress] = useState(0);
    const [batchStats, setBatchStats] = useState({
        processed: 0,
        imported: 0,
        skipped: 0,
        total: 0,
    });
    const [isBatchImporting, setIsBatchImporting] = useState(false);

    // Manual contact form
    const [manualContact, setManualContact] = useState({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
    });

    // CSV import
    const [file, setFile] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [mappedFields, setMappedFields] = useState({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
    });
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [parsedContacts, setParsedContacts] = useState([]);
    const [importResult, setImportResult] = useState(null);

    useEffect(() => {
        setCurrentMethod(method);
    }, [method]);

    const handleManualChange = (e) => {
        const { name, value } = e.target;
        setManualContact({
            ...manualContact,
            [name]: value,
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            // Parse the CSV file
            Papa.parse(selectedFile, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    setCsvData(results.data);
                    setCsvHeaders(results.meta.fields);

                    // Try to auto-map fields if headers match
                    const mappings = {};
                    results.meta.fields.forEach((header) => {
                        const lowerHeader = header.toLowerCase();
                        if (lowerHeader.includes('email')) mappings.email = header;
                        if (lowerHeader.includes('first') && lowerHeader.includes('name')) mappings.firstName = header;
                        if (lowerHeader.includes('last') && lowerHeader.includes('name')) mappings.lastName = header;
                        if (lowerHeader.includes('phone') || lowerHeader.includes('mobile')) mappings.phone = header;
                    });

                    setMappedFields(mappings);
                },
                error: function (error) {
                    console.error('Error parsing CSV:', error);
                    setError('Failed to parse CSV file. Please check the format.');
                },
            });
        }
    };

    const handleMappingChange = (e) => {
        const { name, value } = e.target;
        setMappedFields({
            ...mappedFields,
            [name]: value,
        });
    };

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    };

    const processCSVData = () => {
        if (!mappedFields.email) {
            setError('Email field mapping is required');
            return false;
        }

        // Parse contacts from CSV data using the mapped fields
        const contacts = csvData.map((row) => {
            const contact = {
                email: row[mappedFields.email],
                firstName: mappedFields.firstName ? row[mappedFields.firstName] : '',
                lastName: mappedFields.lastName ? row[mappedFields.lastName] : '',
                phone: mappedFields.phone ? row[mappedFields.phone] : '',
            };

            return contact;
        });

        // Validate emails
        const validContacts = contacts.filter((contact) => validateEmail(contact.email));

        if (validContacts.length === 0) {
            setError('No valid email addresses found in the CSV');
            return false;
        }

        setParsedContacts(validContacts);
        return true;
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();

        // Validate email
        if (!validateEmail(manualContact.email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/brands/${brandId}/contact-lists/${listId}/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contacts: [manualContact],
                    skipDuplicates: true,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to add contact');
            }

            const result = await response.json();

            if (result.skipped > 0) {
                setSuccess(`Contact already exists in this list.`);
            } else {
                setSuccess(`Contact added successfully!`);
            }

            // Clear form
            setManualContact({
                email: '',
                firstName: '',
                lastName: '',
                phone: '',
            });

            // After short delay, close modal
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (error) {
            console.error('Error adding contact:', error);

            if (error.message && error.message.includes('duplicate')) {
                setError('This email already exists in the contact list.');
            } else {
                setError(error.message || 'An unexpected error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCsvNextStep = () => {
        if (step === 1 && !file) {
            setError('Please select a CSV file');
            return;
        }

        if (step === 2) {
            if (processCSVData()) {
                setStep(3);
                setError('');
            }
        } else {
            setStep(step + 1);
            setError('');
        }
    };

    const handleCsvImport = async () => {
        try {
            setIsLoading(true);
            setIsBatchImporting(true);
            setError('');

            const totalContacts = parsedContacts.length;
            const batchSize = 1000;

            // Initialize batch stats
            setBatchStats({
                processed: 0,
                imported: 0,
                skipped: 0,
                total: totalContacts,
            });

            let totalImported = 0;
            let totalSkipped = 0;

            // Process in batches
            for (let i = 0; i < totalContacts; i += batchSize) {
                const endIndex = Math.min(i + batchSize, totalContacts);
                const currentBatch = parsedContacts.slice(i, endIndex);

                try {
                    const response = await fetch(`/api/brands/${brandId}/contact-lists/${listId}/contacts`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            contacts: currentBatch,
                            skipDuplicates: true,
                        }),
                        credentials: 'same-origin',
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `Failed to import batch ${Math.floor(i / batchSize) + 1}`);
                    }

                    const batchResult = await response.json();

                    totalImported += batchResult.imported;
                    totalSkipped += batchResult.skipped;

                    // Update progress stats
                    setBatchStats({
                        processed: endIndex,
                        imported: totalImported,
                        skipped: totalSkipped,
                        total: totalContacts,
                    });

                    // Calculate and update progress percentage
                    const progressPercent = Math.round((endIndex / totalContacts) * 100);
                    setBatchProgress(progressPercent);
                } catch (error) {
                    console.error(`Error importing batch (contacts ${i + 1}-${Math.min(i + batchSize, totalContacts)}):`, error);
                    setError((prev) => (prev ? `${prev}; ${error.message}` : error.message));
                }
            }

            // Compile final results
            const finalResult = {
                total: totalContacts,
                imported: totalImported,
                skipped: totalSkipped,
            };

            setImportResult(finalResult);
            setStep(4);
        } catch (error) {
            console.error('Error in import process:', error);
            setError(error.message || 'An unexpected error occurred during the import process');
        } finally {
            setIsLoading(false);
            setIsBatchImporting(false);
        }
    };

    const renderMethodTitle = () => {
        if (currentMethod === 'manual') return 'Add Contact Manually';
        if (currentMethod === 'csv') {
            if (step === 1) return 'Import Contacts from CSV';
            if (step === 2) return 'Map CSV Fields';
            if (step === 3) return 'Review Contacts';
            if (step === 4) return 'Import Complete';
        }
    };

    return (
        <div className="form-modal-overlay">
            <div className="form-modal">
                <div className="modal-form-container">
                    <div className="modal-form-header">
                        <h2>{renderMethodTitle()}</h2>
                        <button
                            className="modal-form-close"
                            onClick={onClose}
                            aria-label="Close form"
                            type="button"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert--error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="alert alert--success">
                            <CheckCircle size={16} />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Manual Contact Form */}
                    {currentMethod === 'manual' && (
                        <form
                            onSubmit={handleManualSubmit}
                            className="form"
                        >
                            <div className="form-group">
                                <label
                                    htmlFor="email"
                                    className="form-label"
                                >
                                    Email<span className="form-required">*</span>
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={manualContact.email}
                                    onChange={handleManualChange}
                                    placeholder="contact@example.com"
                                    disabled={isLoading}
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label
                                        htmlFor="firstName"
                                        className="form-label"
                                    >
                                        First Name
                                    </label>
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        value={manualContact.firstName}
                                        onChange={handleManualChange}
                                        placeholder="John"
                                        disabled={isLoading}
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label
                                        htmlFor="lastName"
                                        className="form-label"
                                    >
                                        Last Name
                                    </label>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        value={manualContact.lastName}
                                        onChange={handleManualChange}
                                        placeholder="Doe"
                                        disabled={isLoading}
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label
                                    htmlFor="phone"
                                    className="form-label"
                                >
                                    Phone Number
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={manualContact.phone}
                                    onChange={handleManualChange}
                                    placeholder="+1 (555) 123-4567"
                                    disabled={isLoading}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="button button--secondary"
                                    onClick={onClose}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="button button--primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader
                                                size={16}
                                                className="spinner-icon"
                                            />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add Contact'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* CSV Import */}
                    {currentMethod === 'csv' && (
                        <div>
                            {/* Step 1: File Upload */}
                            {step === 1 && (
                                <div>
                                    <div
                                        style={{
                                            border: file ? '2px solid #2e7d32' : '2px dashed #d0d0d0',
                                            borderRadius: '0.5rem',
                                            padding: '2rem',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: file ? '#f1f8f4' : '#fafafa',
                                            marginBottom: '1rem',
                                        }}
                                        onClick={() => fileInputRef.current.click()}
                                        onMouseEnter={(e) => {
                                            if (!file) e.currentTarget.style.borderColor = '#999';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!file) e.currentTarget.style.borderColor = '#d0d0d0';
                                        }}
                                    >
                                        {file ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                                <FileText
                                                    size={32}
                                                    color="#2e7d32"
                                                />
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontWeight: '500', color: '#1a1a1a' }}>{file.name}</div>
                                                    <div style={{ fontSize: '0.875rem', color: '#666' }}>{(file.size / 1024).toFixed(1)} KB</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload
                                                    size={32}
                                                    color="#666"
                                                    style={{ marginBottom: '0.5rem' }}
                                                />
                                                <p style={{ margin: '0.5rem 0', color: '#1a1a1a', fontWeight: '500' }}>Click to select or drag and drop CSV file</p>
                                                <small style={{ color: '#666' }}>Your CSV should have a header row with column names</small>
                                            </>
                                        )}
                                    </div>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".csv"
                                        style={{ display: 'none' }}
                                    />

                                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
                                        Need a template?{' '}
                                        <a
                                            href="/csv-template.csv"
                                            download
                                            style={{ color: '#1a1a1a', textDecoration: 'underline' }}
                                        >
                                            Download CSV template
                                        </a>
                                    </p>

                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="button button--secondary"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="button button--primary"
                                            onClick={handleCsvNextStep}
                                            disabled={!file}
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Field Mapping */}
                            {step === 2 && (
                                <div className="form">
                                    <p
                                        className="form-help"
                                        style={{ marginBottom: '1rem' }}
                                    >
                                        Map the columns from your CSV file to contact fields. Email is required.
                                    </p>

                                    <div className="form-group">
                                        <label className="form-label">
                                            Email<span className="form-required">*</span>
                                        </label>
                                        <select
                                            name="email"
                                            value={mappedFields.email}
                                            onChange={handleMappingChange}
                                            required
                                            className="form-select"
                                        >
                                            <option value="">Select a column</option>
                                            {csvHeaders.map((header) => (
                                                <option
                                                    key={header}
                                                    value={header}
                                                >
                                                    {header}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">First Name</label>
                                        <select
                                            name="firstName"
                                            value={mappedFields.firstName}
                                            onChange={handleMappingChange}
                                            className="form-select"
                                        >
                                            <option value="">Select a column (optional)</option>
                                            {csvHeaders.map((header) => (
                                                <option
                                                    key={header}
                                                    value={header}
                                                >
                                                    {header}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Last Name</label>
                                        <select
                                            name="lastName"
                                            value={mappedFields.lastName}
                                            onChange={handleMappingChange}
                                            className="form-select"
                                        >
                                            <option value="">Select a column (optional)</option>
                                            {csvHeaders.map((header) => (
                                                <option
                                                    key={header}
                                                    value={header}
                                                >
                                                    {header}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <select
                                            name="phone"
                                            value={mappedFields.phone}
                                            onChange={handleMappingChange}
                                            className="form-select"
                                        >
                                            <option value="">Select a column (optional)</option>
                                            {csvHeaders.map((header) => (
                                                <option
                                                    key={header}
                                                    value={header}
                                                >
                                                    {header}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="button button--secondary"
                                            onClick={() => setStep(1)}
                                        >
                                            <ArrowLeft size={16} />
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            className="button button--primary"
                                            onClick={handleCsvNextStep}
                                            disabled={!mappedFields.email}
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Review Contacts */}
                            {step === 3 && (
                                <div>
                                    <p
                                        className="form-help"
                                        style={{ marginBottom: '1rem' }}
                                    >
                                        {parsedContacts.length} contacts found in your CSV file. These will be imported into your contact list. Duplicate emails will be skipped.
                                    </p>

                                    <div style={{ overflowX: 'auto', marginBottom: '1.5rem', border: '1px solid #f0f0f0', borderRadius: '0.5rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: '600', color: '#1a1a1a' }}>Email</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: '600', color: '#1a1a1a' }}>First Name</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: '600', color: '#1a1a1a' }}>Last Name</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: '600', color: '#1a1a1a' }}>Phone</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedContacts.slice(0, 5).map((contact, index) => (
                                                    <tr
                                                        key={index}
                                                        style={{ borderBottom: '1px solid #f0f0f0' }}
                                                    >
                                                        <td style={{ padding: '0.75rem', fontSize: '0.8125rem', color: '#1a1a1a' }}>{contact.email}</td>
                                                        <td style={{ padding: '0.75rem', fontSize: '0.8125rem', color: '#666' }}>{contact.firstName}</td>
                                                        <td style={{ padding: '0.75rem', fontSize: '0.8125rem', color: '#666' }}>{contact.lastName}</td>
                                                        <td style={{ padding: '0.75rem', fontSize: '0.8125rem', color: '#666' }}>{contact.phone}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {parsedContacts.length > 5 && <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>+{parsedContacts.length - 5} more contacts</p>}

                                    {isBatchImporting && (
                                        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fafafa', borderRadius: '0.5rem' }}>
                                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9375rem', fontWeight: '500' }}>Importing Contacts in Batches</h4>
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '0.5rem',
                                                    backgroundColor: '#e0e0e0',
                                                    borderRadius: '0.25rem',
                                                    overflow: 'hidden',
                                                    marginBottom: '1rem',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${batchProgress}%`,
                                                        height: '100%',
                                                        backgroundColor: '#2e7d32',
                                                        transition: 'width 0.3s ease',
                                                    }}
                                                ></div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#666' }}>
                                                <span>
                                                    Processed: {batchStats.processed} of {batchStats.total}
                                                </span>
                                                <span>Imported: {batchStats.imported}</span>
                                                <span>Skipped: {batchStats.skipped}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="button button--secondary"
                                            onClick={() => setStep(2)}
                                            disabled={isBatchImporting}
                                        >
                                            <ArrowLeft size={16} />
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            className="button button--primary"
                                            onClick={handleCsvImport}
                                            disabled={isLoading || isBatchImporting}
                                        >
                                            {isLoading || isBatchImporting ? (
                                                <>
                                                    <Loader
                                                        size={16}
                                                        className="spinner-icon"
                                                    />
                                                    {isBatchImporting ? `Importing... ${batchProgress}%` : 'Preparing...'}
                                                </>
                                            ) : (
                                                'Import Contacts'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Import Complete */}
                            {step === 4 && importResult && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                        <CheckCircle
                                            size={48}
                                            color="#2e7d32"
                                        />
                                    </div>

                                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '500', color: '#1a1a1a' }}>Import Complete!</h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#fafafa', borderRadius: '0.375rem' }}>
                                            <span style={{ fontSize: '0.875rem', color: '#666' }}>Total Processed:</span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1a1a1a' }}>{importResult.total}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#e8f5e9', borderRadius: '0.375rem' }}>
                                            <span style={{ fontSize: '0.875rem', color: '#2e7d32' }}>Successfully Added:</span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#2e7d32' }}>{importResult.imported}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#fff3e0', borderRadius: '0.375rem' }}>
                                            <span style={{ fontSize: '0.875rem', color: '#f57c00' }}>Duplicates Skipped:</span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#f57c00' }}>{importResult.skipped}</span>
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="button button--primary"
                                            onClick={onSuccess}
                                            style={{ width: '100%' }}
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
