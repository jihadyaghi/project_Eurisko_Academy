import {useEffect,useMemo,useState,} from 'react';
import {Bot,Building2,CircleCheck,Clock3,Eye,FileText,Filter,ListChecks,LogOut,RefreshCw,Search,Send,Sparkles,Tags,TriangleAlert,UserCheck,} from 'lucide-react';
import {analyzeRequest} from '../api/request-intake.api';
import {createServiceRequest,getMyRequests,getRequestDetails,} from '../api/service-requests.api';
import type { AuthUser } from '../types/auth.types';
import type {IntakeResult} from '../types/request-intake.types';
import type {ServiceRequest,ServiceRequestDetails} from '../types/service-request.types';
import RequestDetailsModal from '../components/RequestDetailsModal';
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
function formatLabel(value: string | null | undefined,) {
  if (!value) {
    return '-';
  }
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}
function formatDate(date: string) {
  return new Date(date,).toLocaleString();
}
function EmployeePortal({token,user,onLogout}: EmployeePortalProps) {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<IntakeResult | null>(null,);
  const [submittedRequest, setSubmittedRequest] = useState<ServiceRequest | null>(null);
  const [myRequests, setMyRequests] = useState<ServiceRequest[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestDetails | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  async function loadMyRequests() {
    try {
      setLoadingRequests(true);
      setError(null);
      const requests = await getMyRequests(token);
      setMyRequests(requests);
    } 
    catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load your requests',);
    } 
    finally {
      setLoadingRequests(false);
    }
  }
  useEffect(() => {
    loadMyRequests();
  }, []);
  const totalCount = myRequests.length;
  const submittedCount = useMemo(() => myRequests.filter(
          (request) => request.status === 'submitted',).length,
      [myRequests],
    );
  const inProgressCount = useMemo(() => myRequests.filter(
          (request) => request.status === 'in_progress',).length,
      [myRequests],
    );
  const completedCount = useMemo(() => myRequests.filter(
          (request) => request.status === 'completed').length,
      [myRequests],
    );
  const filteredRequests = useMemo(() => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      return myRequests.filter(
        (serviceRequest) => {
          const matchesSearch = normalizedSearch === '' || serviceRequest.title.toLowerCase().includes(normalizedSearch,) || serviceRequest.description.toLowerCase().includes(normalizedSearch) || String(serviceRequest.id,).includes(normalizedSearch,);
          const matchesStatus = statusFilter === 'ALL' || serviceRequest.status === statusFilter;
          const matchesPriority = priorityFilter === 'ALL' || serviceRequest.priority === priorityFilter;
          return (
            matchesSearch && matchesStatus && matchesPriority
          );
        },
      );
    }, [
      myRequests,
      searchTerm,
      statusFilter,
      priorityFilter,
    ]);
  async function handleAnalyze() {
    if (text.trim().length < 3) {
      return;
    }
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setSubmittedRequest(null);
    try {
      const result = await analyzeRequest({text}, token,);
      setAnalysis(result,);
    } 
    catch (error) {
      setError(error instanceof Error ? error.message : 'AI analysis failed',);
    } 
    finally {
      setAnalyzing(false);
    }
  }
  async function handleSubmitRequest() {
    if (!analysis) {
      return;
    }
    if (analysis.needsReview || !analysis.department || !analysis.category) {
      setError('This request requires manual review before submission.');
      return;
    }
    const departmentId = departmentIdMap[analysis.department];
    if (!departmentId) {
      setError('Unable to map the selected department.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await createServiceRequest(
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
    } 
    catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit request',);
    } 
    finally {
      setSubmitting(false);
    }
  }
  async function handleViewDetails(requestId: number,) {
    try {
      setLoadingDetailsId(requestId,);
      setError(null);
      const details = await getRequestDetails(requestId,token,);
      setSelectedRequest(details);
    } 
    catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load request details',);
    } 
    finally {
      setLoadingDetailsId(null);
    }
  }
  return (
    <main className="portal-page">
      <header className="portal-header">
        <div>
          <span className="portal-eyebrow">Employee Workspace</span>
          <h1>Welcome, {user.name}</h1>
          <p>Submit internal requests and track their progress from one workspace.</p>
        </div>
        <div className="portal-header-actions">
          <button
            type="button"
            className="secondary-button icon-button"
            onClick={onLogout}>
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </header>
      <section className="portal-grid">
        <div className="portal-card employee-intake-card">
          <div className="card-heading">
            <span className="step-badge"><FileText size={17}/></span>
            <div>
              <h2>Describe your request</h2>
              <p>Explain what you need help with in natural language.</p>
            </div>
          </div>
          <div className="employee-ai-hint">
            <Sparkles size={16}/>
            <span>AI will suggest the department, category,priority, and summary.</span>
          </div>
          <textarea
            className="request-textarea"
            value={text}
            onChange={(event) => setText(event.target.value,)}
            placeholder="Example: My laptop keeps shutting down and I cannot work."
            rows={7}/>
          <div className="employee-intake-footer">
            <span className="character-count">{text.length} characters</span>
            <button
              type="button"
              className="primary-button icon-button ai-analyze-button"
              onClick={handleAnalyze}
              disabled={analyzing || text.trim().length < 3}>
              <Sparkles size={17} className={analyzing ? 'spin-icon' : ''}/>
              {analyzing ? 'Analyzing request...' : 'Analyze with AI'}
            </button>
          </div>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
        <div className="portal-card employee-ai-review-card">
          <div className="card-heading">
            <span className="step-badge"><Bot size={17} /></span>
            <div>
              <h2>Review AI suggestion</h2>
              <p>Review the structured intake before submitting.</p>
            </div>
          </div>
          {!analysis && !submittedRequest && (
              <div className="empty-state employee-ai-empty">
                <Bot size={34}/>
                <h2>Waiting for analysis</h2>
                <p>Analyze a request to see the AI suggestion here.
                </p>
              </div>
            )}
          {analysis && (
            <div className="suggestion-card enhanced-suggestion-card">
              <div className="ai-suggestion-header">
                <div className="ai-suggestion-title">
                  <div className="ai-suggestion-icon">
                    <Sparkles size={18}/>
                  </div>
                  <div>
                    <strong>AI Intake Suggestion</strong>
                    <span>Structured from your request</span>
                  </div>
                </div>
                {!analysis.needsReview && (
                  <span className="ai-ready-badge">
                    <CircleCheck size={14}/>
                    Ready
                  </span>
                )}
              </div>
              {analysis.needsReview ? (
                <div className="review-warning icon-review-warning">
                  <TriangleAlert size={19}/>
                  <div>
                    <strong>Manual review required</strong>
                    <p>The request could not be classified safely.</p>
                  </div>
                </div>
              ) : (
                <div className="ai-classification-grid">
                  <div className="ai-classification-item">
                    <Building2 size={17}/>
                    <div>
                      <span>Department</span>
                      <strong>{analysis.department}</strong>
                    </div>
                  </div>
                  <div className="ai-classification-item">
                    <Tags size={17}/>
                    <div>
                      <span>Category</span>
                      <strong>{formatLabel(analysis.category)}
                      </strong>
                    </div>
                  </div>
                  <div className="ai-classification-item">
                    <TriangleAlert size={17}/>
                    <div>
                      <span>Priority</span>
                      <strong className={`priority-badge priority-${analysis.priority}`}>
                        <span className="priority-dot" />
                        {formatLabel(analysis.priority)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
              <div className="suggestion-summary enhanced-suggestion-summary">
                <span>Suggested Summary</span>
                <p>{analysis.summary}
                </p>
              </div>
              <div className="ai-advisory-note">
                <Bot size={15} />
                <span>AI suggestions are advisory. Review the result before submitting.
                </span>
              </div>
              {!analysis.needsReview && (
                <button
                  type="button"
                  className="success-button icon-button ai-submit-button"
                  onClick={handleSubmitRequest}
                  disabled={submitting}>
                  <Send size={17}/>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              )}
            </div>
          )}
          {submittedRequest && (
            <div className="success-state employee-submit-success">
              <div className="success-state-heading">
                <CircleCheck size={22}/>
                <strong>Request submitted successfully</strong>
              </div>
              <p>
                Request #
                {submittedRequest.id}{' '}
                has been sent to the appropriat department.
              </p>
              <div className="submitted-details">
                <span>Status</span>
                <strong>{formatLabel(submittedRequest.status,)}</strong>
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="my-requests-section">
        <div className="section-heading">
          <div>
            <span className="portal-eyebrow">Tracking</span>
            <h2>My Request</h2>
            <p>Track the current status of your submitted requests.</p>
          </div>
          <button
            type="button"
            className="secondary-button icon-button"
            onClick={loadMyRequests}
            disabled={loadingRequests}>
            <RefreshCw size={17} className={loadingRequests ? 'spin-icon' : ''}/>
            {loadingRequests ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <section className="employee-request-stats">
          <div className="employee-stat-card">
            <div className="employee-stat-icon employee-stat-purple">
              <ListChecks size={20}/>
            </div>
            <div>
              <span>Total Requests</span>
              <strong>{totalCount}</strong>
            </div>
          </div>
          <div className="employee-stat-card">
            <div className="employee-stat-icon employee-stat-blue">
              <Clock3 size={20}/>
            </div>
            <div>
              <span>Submitted</span>
              <strong>{submittedCount}</strong>
            </div>
          </div>
          <div className="employee-stat-card">
            <div className="employee-stat-icon employee-stat-orange">
              <RefreshCw size={20}/>
            </div>
            <div>
              <span>In Progress</span>
              <strong>{inProgressCount}</strong>
            </div>
          </div>
          <div className="employee-stat-card">
            <div className="employee-stat-icon employee-stat-green">
              <CircleCheck size={20}/>
            </div>
            <div>
              <span>Completed</span>
              <strong>{completedCount}</strong>
            </div>
          </div>
        </section>
        <div className="employee-request-toolbar">
          <div className="employee-request-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search your requests by title, description, or ID..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value,)}/>
          </div>
          <div className="employee-filter-label">
            <Filter size={16} />
            <span>Filter Requests</span>
          </div>
          <div className="employee-request-filters">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value,)}>
              <option value="ALL">All Priorities</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="employee-results-summary">
            Showing{' '}
            <strong>{filteredRequests.length}</strong>{' '}
            of{' '}
            <strong>{myRequests.length}
            </strong>{' '}
            requests
          </div>
        </div>
        {loadingRequests ? (
          <div className="loading-state">
            Loading your requests...
          </div>
        ) : myRequests.length === 0 ? (
          <div className="portal-card empty-state employee-request-empty">
            <ListChecks size={32}/>
            <h2>No requests yet</h2>
            <p>Your submitted requests will appear here.</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="portal-card employee-filter-empty">
            <Search size={30} />
            <h2>No matching requests</h2>
            <p>Try changing your search term or filters.</p>
          </div>
        ) : (
          <div className="employee-request-list">
            {filteredRequests.map(
              (serviceRequest) => {
                const isAssigned = Boolean(serviceRequest.handlerId,);
                const isLoadingDetails = loadingDetailsId === serviceRequest.id;
                return (
                  <article
                    className="employee-request-card"
                    key={serviceRequest.id}>
                    <div className="request-card-header">
                      <div>
                        <span className="request-number">Request # {serviceRequest.id}</span>
                        <h2>{serviceRequest.title}</h2>
                      </div>
                      <span className={`status-badge status-${serviceRequest.status}`}>{formatLabel(serviceRequest.status,)}</span>
                    </div>
                    <p className="request-description">{serviceRequest.description}</p>
                    <div className="request-metadata">
                      <div>
                        <span>Category</span>
                        <strong>{formatLabel(serviceRequest.category,)}</strong>
                      </div>
                      <div>
                        <span>Priority</span>
                        <strong className={`priority-badge priority-${serviceRequest.priority}`}>
                          <span className="priority-dot" />
                          {formatLabel(serviceRequest.priority,)}
                        </strong>
                      </div>
                      <div>
                        <span>Handler</span>
                        <strong className={`employee-handler-badge ${isAssigned ? 'employee-handler-assigned' : 'employee-handler-waiting'}`}>
                          <UserCheck size={14}/>
                          {isAssigned ? 'Assigned' : 'Waiting for Assignment'}
                        </strong>
                      </div>
                    </div>
                    <div className="request-footer">
                      <span>Submitted</span>
                      <strong>{formatDate(serviceRequest.createdAt,)}</strong>
                    </div>
                    <div className="employee-request-actions">
                      <button
                        type="button"
                        className="secondary-button icon-button"
                        onClick={() => handleViewDetails(serviceRequest.id)}
                        disabled={isLoadingDetails}>
                        <Eye size={16}/>
                        {isLoadingDetails ? 'Loading...' : 'View Details'}
                      </button>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
      {selectedRequest && (
        <RequestDetailsModal request={selectedRequest}
          onClose={() => setSelectedRequest(null,)}/>
      )}
    </main>
  );
}
export default EmployeePortal;