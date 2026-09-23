import { useEffect, useState } from 'react';
import { analyzeRequest } from '../api/request-intake.api';
import {createServiceRequest,getMyRequests,} from '../api/service-requests.api';
import type { AuthUser } from '../types/auth.types';
import type { IntakeResult } from '../types/request-intake.types';
import type { ServiceRequest } from '../types/service-request.types';
import '../styles/portal.css';
interface EmployeePortalProps {
  token: string;
  user: AuthUser;
  onLogout: () => void;
}
const departmentIdMap: Record<string, number> = {
  IT: 1,
  HR: 2,
  Finance: 3,
};
function EmployeePortal({
  token,
  user,
  onLogout,
}: EmployeePortalProps) {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<IntakeResult | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<ServiceRequest | null>(null);
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState<string | null>(null);
  async function loadMyRequests() {
    try {
      setLoadingRequests(true);
      const requests = await getMyRequests(token);
      setMyRequests(requests);
    } catch (error) {
      setError( error instanceof Error ? error.message : 'Failed to load your requests',);
    } finally {
      setLoadingRequests(false);
    }
  }
  useEffect(() => {
    loadMyRequests();
  }, []);
  async function handleAnalyze() {
    if (text.trim().length < 3) {
      return;
    }
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setSubmittedRequest(null);
    try {
      const result = await analyzeRequest(
        {
          text,
        },
        token,
      );
      setAnalysis(result);
    } catch (error) {
      setError( error instanceof Error ? error.message : 'AI analysis failed',);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmitRequest() {
    if (!analysis) {
      return;
    }

    if (analysis.needsReview || !analysis.department || !analysis.category) {
      setError('This request requires manual review before submission.',);
      return;
    }
    const departmentId =
      departmentIdMap[analysis.department];
    if (!departmentId) {
      setError('Unable to map the selected department.',);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created =
        await createServiceRequest(
          {
            title: analysis.summary,
            description: text,
            departmentId,
            category: analysis.category,
            priority: analysis.priority,
          },
          token,
        );
      setSubmittedRequest(created);
      setAnalysis(null);
      setText('');
      await loadMyRequests();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit request',);
    } finally {
      setSubmitting(false);
    }
  }

  function formatStatus(status: string) {
    return status.replace('_', ' ');
  }
  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }
  return (
    <main className="portal-page">
      <header className="portal-header">
        <div>
          <span className="portal-eyebrow">
            Employee Workspace
          </span>
          <h1>
            Welcome, {user.name}
          </h1>
          <p>
            Submit internal requests and track their
            progress from one workspace.
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={onLogout}>
          Sign Out
        </button>
      </header>
      <section className="portal-grid">
        <div className="portal-card">
          <div className="card-heading">
            <span className="step-badge">
              1
            </span>
            <div>
              <h2>
                Describe your request
              </h2>
              <p>
                Explain what you need help with.
              </p>
            </div>
          </div>
          <textarea
            className="request-textarea"
            value={text}
            onChange={(event) =>
              setText(event.target.value)}
            placeholder="Example: My laptop keeps shutting down and I cannot work."
            rows={7}/>
          <button
            className="primary-button"
            onClick={handleAnalyze}
            disabled={analyzing || text.trim().length < 3}>
            {analyzing ? 'Analyzing request...' : 'Analyze with AI'}
          </button>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
        <div className="portal-card">
          <div className="card-heading">
            <span className="step-badge">
              2
            </span>
            <div>
              <h2>
                Review AI suggestion
              </h2>
              <p>
                Review the structured intake before
                submitting.
              </p>
            </div>
          </div>
          {!analysis && !submittedRequest && (
            <div className="empty-state">
              <p>
                Analyze a request to see the AI
                suggestion here.
              </p>
            </div>
          )}
          {analysis && (
            <div className="suggestion-card">
              {analysis.needsReview ? (
                <div className="review-warning">
                  <strong>
                    Manual review required
                  </strong>
                  <p>
                    The request could not be classified
                    safely.
                  </p>
                </div>
              ) : (
                <>
                  <div className="suggestion-row">
                    <span>
                      Department
                    </span>
                    <strong>
                      {analysis.department}
                    </strong>
                  </div>
                  <div className="suggestion-row">
                    <span>
                      Category
                    </span>
                    <strong>
                      {analysis.category}
                    </strong>
                  </div>
                </>
              )}
              <div className="suggestion-row">
                <span>
                  Priority
                </span>
                <strong>
                  {analysis.priority}
                </strong>
              </div>
              <div className="suggestion-summary">
                <span>
                  Summary
                </span>
                <p>
                  {analysis.summary}
                </p>
              </div>
              {!analysis.needsReview && (
                <button
                  className="success-button"
                  onClick={handleSubmitRequest}
                  disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              )}
            </div>
          )}
          {submittedRequest && (
            <div className="success-state">
              <strong>
                Request submitted successfully
              </strong>
              <p>
                Request #{submittedRequest.id} has been
                sent to the appropriate department.
              </p>
              <div className="submitted-details">
                <span>
                  Status
                </span>
                <strong>
                  {formatStatus(
                    submittedRequest.status,
                  )}
                </strong>
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="my-requests-section">
        <div className="section-heading">
          <div>
            <span className="portal-eyebrow">
              Tracking
            </span>
            <h2>
              My Requests
            </h2>
            <p>
              Track the current status of your submitted
              requests.
            </p>
          </div>
          <button
            className="secondary-button"
            onClick={loadMyRequests}
            disabled={loadingRequests}>
            {loadingRequests ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {loadingRequests ? (
          <div className="loading-state">
            Loading your requests...
          </div>
        ) : myRequests.length === 0 ? (
          <div className="portal-card empty-state">
            <h2>No requests yet</h2>
            <p>
              Your submitted requests will appear here.
            </p>
          </div>
        ) : (
          <div className="employee-request-list">
            {myRequests.map((serviceRequest) => (
              <article
                className="employee-request-card"
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
                    {formatStatus(
                      serviceRequest.status,
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
                    <span>Handler</span>
                    <strong>
                      {serviceRequest.handlerId ? 'Assigned' : 'Waiting for assignment'}
                    </strong>
                  </div>
                </div>
                <div className="request-footer">
                  <span>
                    Submitted
                  </span>
                  <strong>
                    {formatDate(
                      serviceRequest.createdAt,
                    )}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
export default EmployeePortal;