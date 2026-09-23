import { useEffect, useState } from 'react';
import {claimRequest,getHandlerInbox,updateRequestStatus,} from '../api/service-requests.api';
import type { AuthUser } from '../types/auth.types';
import type {ServiceRequest,ServiceRequestStatus,} from '../types/service-request.types';
import '../styles/portal.css';
interface HandlerPortalProps {
  token: string;
  user: AuthUser;
  onLogout: () => void;
}

function HandlerPortal({
  token,
  user,
  onLogout,
}: HandlerPortalProps) {
  const [requests, setRequests] =
    useState<ServiceRequest[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [actionRequestId, setActionRequestId] =
    useState<number | null>(null);
  async function loadInbox() {
    try {
      setLoading(true);
      setError(null);
      const data = await getHandlerInbox(token);
      setRequests(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load inbox',);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadInbox();
  }, []);
  async function handleClaim(
    requestId: number,
  ) {
    try {
      setActionRequestId(requestId);
      setError(null);
      await claimRequest(
        requestId,
        token,
      );
      await loadInbox();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to claim request',);
    } finally {
      setActionRequestId(null);
    }
  }

  async function handleStatusChange(
    requestId: number,
    status: ServiceRequestStatus,
  ) {
    try {
      setActionRequestId(requestId);
      setError(null);
      await updateRequestStatus(
        requestId,
        status,
        token,
      );
      await loadInbox();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update request',);
    } finally {
      setActionRequestId(null);
    }
  }

  return (
    <main className="portal-page">
      <header className="portal-header">
        <div>
          <span className="portal-eyebrow">
            Department Handler
          </span>
          <h1>
            {user.department ?? 'Department'} Inbox
          </h1>
          <p>
            Welcome, {user.name}. Review and manage
            requests assigned to your department.
          </p>
        </div>
        <div className="portal-header-actions">
          <button
            className="secondary-button"
            onClick={loadInbox}
            disabled={loading}>
            Refresh
          </button>
          <button
            className="secondary-button"
            onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </header>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      {loading ? (
        <div className="loading-state">
          Loading department requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="portal-card empty-state">
          <h2>No requests</h2>
          <p>
            There are currently no requests for your
            department.
          </p>
        </div>
      ) : (
        <section className="request-list">
          {requests.map((serviceRequest) => {
            const isMine = serviceRequest.handlerId === user.id;
            const isUnassigned = serviceRequest.handlerId === null;
            const isBusy = actionRequestId === serviceRequest.id;
            return (
              <article
                className="handler-request-card"
                key={serviceRequest.id}>
                <div className="request-card-header">
                  <div>
                    <span className="request-number">
                      Request #{serviceRequest.id}
                    </span>
                    <h2>
                      {serviceRequest.title}
                    </h2>
                  </div>
                  <span
                    className={`status-badge status-${serviceRequest.status}`}>
                    {serviceRequest.status.replace(
                      '_',
                      ' ',
                    )}
                  </span>
                </div>
                <p className="request-description">
                  {serviceRequest.description}
                </p>
                <div className="request-metadata">
                  <div>
                    <span>Category</span>
                    <strong>
                      {serviceRequest.category ?? '-'}
                    </strong>
                  </div>
                  <div>
                    <span>Priority</span>
                    <strong>
                      {serviceRequest.priority}
                    </strong>
                  </div>
                  <div>
                    <span>Ownership</span>
                    <strong>
                      {isMine ? 'Assigned to you' : isUnassigned ? 'Unassigned' : 'Assigned'}
                    </strong>
                  </div>
                </div>
                <div className="request-actions">
                  {isUnassigned && (
                    <button
                      className="primary-button"
                      disabled={isBusy}
                      onClick={() =>
                        handleClaim(serviceRequest.id,)}>
                      {isBusy ? 'Claiming...' : 'Claim Request'}
                    </button>
                  )}
                  {isMine &&
                    serviceRequest.status ===
                      'submitted' && (
                      <button
                        className="primary-button"
                        disabled={isBusy}
                        onClick={() =>
                          handleStatusChange(
                            serviceRequest.id,
                            'in_progress',
                          )}>
                        {isBusy ? 'Updating...' : 'Start Progress'}
                      </button>
                    )}
                  {isMine &&
                    serviceRequest.status ===
                      'in_progress' && (
                      <button
                        className="success-button"
                        disabled={isBusy}
                        onClick={() =>
                          handleStatusChange(
                            serviceRequest.id,
                            'completed',
                          )}>
                        {isBusy
                          ? 'Updating...'
                          : 'Complete Request'}
                      </button>
                    )}
                  {!isMine &&
                    !isUnassigned && (
                      <span className="assigned-note">
                        This request is already assigned
                        to another handler.
                      </span>
                    )}
                  {isMine &&
                    serviceRequest.status ===
                      'completed' && (
                      <span className="completed-note">
                        Request completed
                      </span>
                    )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default HandlerPortal;