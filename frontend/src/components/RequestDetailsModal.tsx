import type { ServiceRequestDetails } from "../types/service-request.types";
import '../styles/portal.css';
interface RequestDetailModalProps {
    request: ServiceRequestDetails;
    onClose: () => void;
}
function formatStatus(status: string) {
    return status.replace('_', '');
}
function formatDate(date: string) {
    return new Date(date).toLocaleString();
}
function RequestDetailsModal({request, onClose} : RequestDetailModalProps) {
    return (
        <div className="request-modal-backdrop" onClick={onClose}>
            <section className="request-modal" onClick={(event) => event.stopPropagation()}>
                <div className="request-modal-header">
                    <div>
                        <span className="request-number">Request #{request.id}</span>
                        <h2>{request.title}</h2>
                    </div>
                    <button type="button" className="modal-close-button" onClick={onClose} aria-label="Close request details">×</button>
                </div>
                <div className="request-modal-status">
                    <span className={`status-badge status-${request.status}`}>{formatStatus(request.status)}</span>
                </div>
                <div className="request-details-grid">
                    <div>
                        <span>Department</span>
                        <strong>{request.department.name}</strong>
                    </div>
                    <div>
                        <span>Category</span>
                        <strong>{request.category ?? '-'}</strong>
                    </div>
                    <div>
                        <span>Priority</span>
                        <strong>{request.priority}</strong>
                    </div>
                    <div>
                        <span>Assigned Handler</span>
                        <strong>{request.handler?.name ?? 'Unassigned'}</strong>
                    </div>
                    <div>
                        <span>Created</span>
                        <strong>{formatDate(request.createdAt)}</strong>
                    </div>
                    <div>
                        <span>Last Updated</span>
                        <strong>{formatDate(request.updatedAt)}</strong>
                    </div>
                </div>
                <div className="request-modal-description">
                    <span>Description</span>
                    <p>{request.description}</p>
                </div>
                <div className="request-history-section">
                    <div className="request-history-heading">
                        <h3>Status History</h3>
                        <p>Lifecycle changes recorded by the system.</p>
                    </div>
                    <div className="request-timeline">
                        <div className="timeline-item">
                            <div className="timeline-dot" />
                            <div className="timeline-content">
                                <strong>Submitted</strong>
                                <span>{formatDate(request.createdAt)}</span>
                            </div>
                        </div>
                        {request.statusHistory.map(
                            (historyItem) => (
                                <div className="timeline-item"  key={historyItem.id}>
                                    <div className="timeline-dot" />
                                    <div className="timeline-content">
                                        <strong>{formatStatus(historyItem.toStatus)}</strong>
                                        <span>{formatDate(historyItem.createdAt)}</span>
                                        <small>Changed by {' '} {historyItem.changedByUser.name}</small>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
export default RequestDetailsModal;