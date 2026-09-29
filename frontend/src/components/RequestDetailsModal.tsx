import {Building2,CalendarClock,CheckCircle2,Clock3,FileText,History,Tag,UserRound,X,} from 'lucide-react';
import type {ServiceRequestDetails} from '../types/service-request.types';
import '../styles/portal.css';
interface RequestDetailModalProps {
  request: ServiceRequestDetails;
  onClose: () => void;
}
function formatLabel(value: string | null | undefined,) {
  if (!value) {
    return '-';
  }
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}
function formatDate(date: string) {
  return new Date(date).toLocaleString();
}
function RequestDetailsModal({request,onClose,}: RequestDetailModalProps) {
  return (
    <div className="request-modal-backdrop" onClick={onClose}>
      <section className="request-modal enhanced-request-modal" onClick={(event) => event.stopPropagation()}>
        <div className="request-modal-header">
          <div>
            <span className="request-number"> Request #{request.id}</span>
            <h2>{request.title}</h2>
          </div>
          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close request details">
            <X size={19} />
          </button>
        </div>
        <div className="request-modal-status">
          <span className={`status-badge status-${request.status}`}>
            {formatLabel(request.status)}
          </span>
        </div>
        <div className="request-details-grid">
          <div>
            <span>Department</span>
            <strong className="request-detail-value">
              <Building2 size={15}/>
              {request.department.name}
            </strong>
          </div>
          <div>
            <span>Category</span>
            <strong className="request-detail-value">
              <Tag size={15} />
              {formatLabel(request.category,)}
            </strong>
          </div>
          <div>
            <span>Priority</span>
            <strong className={`priority-badge priority-${request.priority}`}>
              <span className="priority-dot" />
              {formatLabel(request.priority)}
            </strong>
          </div>
          <div>
            <span>Assigned Handler</span>
            <strong className="request-detail-value">
              <UserRound size={15}/>
              {request.handler ?.name ?? 'Unassigned'}
            </strong>
          </div>
          <div>
            <span>Created</span>
            <strong className="request-detail-value">
              <Clock3 size={15}/>
              {formatDate(request.createdAt,)}
            </strong>
          </div>
          <div>
            <span>Last Updated</span>
            <strong className="request-detail-value">
              <CalendarClock size={15}/>
              {formatDate(request.updatedAt)}
            </strong>
          </div>
        </div>
        <div className="request-modal-description">
          <div className="request-description-heading">
            <FileText size={16}/>
            <span>Description</span>
          </div>
          <p>{request.description}
          </p>
        </div>
        <div className="request-history-section">
          <div className="request-history-heading enhanced-history-heading">
            <div className="history-heading-icon">
              <History size={18}/>
            </div>
            <div>
              <h3>Status History</h3>
              <p>Complete audit trail for this request.
              </p>
            </div>
          </div>
          <div className="request-timeline">
            <div className="timeline-item">
              <div className="timeline-dot timeline-dot-submitted">
                <CheckCircle2 size={10}/>
              </div>
              <div className="timeline-content">
                <strong>Submitted</strong>
                <span>{formatDate(request.createdAt,)}</span>
                <small>Request created by employee</small>
              </div>
            </div>
            {request.statusHistory.map(
              (historyItem,index) => {
                const isCompleted = historyItem.toStatus === 'completed';
                const isLatest = index === request.statusHistory.length -1;
                return (
                  <div className="timeline-item" key={historyItem.id}>
                    <div className={`timeline-dot ${isCompleted ? 'timeline-dot-completed' : 'timeline-dot-progress'} ${ isLatest ? 'timeline-dot-latest' : ''}`}>
                      <CheckCircle2 size={10}/>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title-row">
                        <strong>{formatLabel(historyItem.toStatus,)}</strong>
                        {isLatest && (
                          <span className="timeline-current-badge">Latest</span>
                        )}
                      </div>
                      <span>{formatDate(historyItem.createdAt)}</span>
                      <small>Changed by{' '}{historyItem.changedByUser.name}</small>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
export default RequestDetailsModal;