import Link from 'next/link';

export default function BrandList({ brands, onCreateClick }) {
    const getBadgeClass = (status) => {
        switch (status) {
            case 'active':
                return 'badge-success';
            case 'inactive':
                return 'badge-inactive';
            case 'pending_setup':
                return 'badge-setup';
            case 'pending_verification':
                return 'badge-pending';
            default:
                return 'badge-inactive';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active':
                return 'Active';
            case 'inactive':
                return 'Inactive';
            case 'pending_setup':
                return 'Needs Setup';
            case 'pending_verification':
                return 'Pending Verification';
            default:
                return status;
        }
    };

    if (!brands || brands.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📧</div>
                <h2>No brands found</h2>
                <p>Create your first brand to start sending emails with Maillayer.</p>
                <button
                    className="btn btn-primary"
                    onClick={onCreateClick}
                >
                    Create Your First Brand
                </button>
            </div>
        );
    }

    return (
        <div className="brand-list">
            <div className="brand-list-header">
                <h2>Your Brands</h2>
                <button
                    className="btn btn-primary"
                    onClick={onCreateClick}
                >
                    Create New Brand
                </button>
            </div>

            <div className="brand-grid">
                {brands.map((brand) => (
                    <Link
                        href={`/brands/${brand._id}`}
                        key={brand._id}
                        className="brand-card"
                    >
                        <div className="brand-card-content">
                            <div className="brand-header">
                                <h3>{brand.name}</h3>
                                <span className={`badge ${getBadgeClass(brand.status)}`}>{getStatusText(brand.status)}</span>
                            </div>
                            <div className="brand-details">
                                <p>
                                    <strong>Website:</strong> {brand.website}
                                </p>
                                <p>
                                    <strong>Created:</strong> {new Date(brand.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
