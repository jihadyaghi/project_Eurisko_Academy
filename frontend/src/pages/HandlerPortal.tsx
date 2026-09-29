import {useEffect,useMemo,useState,} from 'react';
import {CircleCheck,ClipboardList,Eye,Filter,Hand,LogOut,Play,RefreshCw,Search,UserCheck,UsersRound,} from 'lucide-react';
import {claimRequest,getHandlerInbox,getRequestDetails,updateRequestStatus} from '../api/service-requests.api';
import type { AuthUser } from '../types/auth.types';
import type {ServiceRequest,ServiceRequestDetails,ServiceRequestStatus,} from '../types/service-request.types';
import RequestDetailsModal from '../components/RequestDetailsModal';
import '../styles/handler.css';
import '../styles/portal-base.css';
interface HandlerPortalProps {
  token: string;
  user: AuthUser;
  onLogout: () => void;
}
function formatLabel(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}
function HandlerPortal({token,user,onLogout}: HandlerPortalProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionRequestId, setActionRequestId,] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestDetails | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [ownershipFilter, setOwnershipFilter] = useState('ALL');
  async function loadInbox() {
    try {
      setLoading(true);
      setError(null);
      const data = await getHandlerInbox(token);
      setRequests(data);
    } 
    catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load inbox');
    } 
    finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadInbox();
  }, []);
  const totalCount = requests.length;
  const unassignedCount = useMemo(() => requests.filter(
          (request) => request.handlerId === null).length,
      [requests],
    );
  const mineCount = useMemo(() => requests.filter(
          (request) => request.handlerId === user.id,).length,
      [requests, user.id],
    );
  const inProgressCount = useMemo(() => requests.filter(
          (request) => request.status === 'in_progress').length,
      [requests],
    );
  const filteredRequests = useMemo(() => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      return requests.filter((serviceRequest) => {
          const isMine = serviceRequest.handlerId === user.id;
          const isUnassigned = serviceRequest.handlerId === null;
          const matchesSearch = normalizedSearch === '' || serviceRequest.title.toLowerCase().includes(normalizedSearch,) || serviceRequest.description.toLowerCase().includes(normalizedSearch,) || String(serviceRequest.id).includes(normalizedSearch);
          const matchesStatus = statusFilter === 'ALL' || serviceRequest.status === statusFilter;
          const matchesPriority = priorityFilter === 'ALL' || serviceRequest.priority === priorityFilter;
          const matchesOwnership = ownershipFilter === 'ALL' || (ownershipFilter === 'MINE' && isMine) || (ownershipFilter === 'UNASSIGNED' && isUnassigned) || (ownershipFilter === 'ASSIGNED' && !isMine && !isUnassigned);
          return (
            matchesSearch && matchesStatus && matchesPriority && matchesOwnership
          );
        },
      );
    }, [
      requests,
      searchTerm,
      statusFilter,
      priorityFilter,
      ownershipFilter,
      user.id,
    ]);
  async function handleClaim(requestId: number,) {
    try {
      setActionRequestId(requestId,);
      setError(null);
      await claimRequest(requestId,token);
      await loadInbox();
    } 
    catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to claim request');
    } 
    finally {
      setActionRequestId(null);
    }
  }
  async function handleStatusChange(requestId: number, status: ServiceRequestStatus,) {
    try {
      setActionRequestId(requestId);
      setError(null);
      await updateRequestStatus(requestId,status,token);
      await loadInbox();
    } 
    catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update request');
    } 
    finally {
      setActionRequestId(null);
    }
  }
  async function handleViewDetails(requestId: number,) {
    try {
      setLoadingDetailsId(requestId,);
      setError(null);
      const details = await getRequestDetails(requestId,token);
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
          <span className="portal-eyebrow">Department Handler</span>
          <h1>{user.department ?? 'Department'}{' '}Inbox</h1>
          <p>Welcome, {user.name}. Review and manage requests assigned to your department.</p>
        </div>
        <div className="portal-header-actions">
          <button
            type="button"
            className="secondary-button icon-button"
            onClick={loadInbox}
            disabled={loading}>
            <RefreshCw size={17} className={loading ? 'spin-icon' : ''}/>
            Refresh
          </button>
          <button
            type="button"
            className="secondary-button icon-button"
            onClick={onLogout}>
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </header>
      <section className="handler-stats">
        <div className="handler-stat-card">
          <div className="handler-stat-icon handler-stat-purple">
            <ClipboardList size={20}/>
          </div>
          <div>
            <span>Total</span>
            <strong>{totalCount}</strong>
          </div>
        </div>
        <div className="handler-stat-card">
          <div className="handler-stat-icon handler-stat-blue">
            <UsersRound size={20}/>
          </div>
          <div>
            <span>Unassigned</span>
            <strong>{unassignedCount}</strong>
          </div>
        </div>
        <div className="handler-stat-card">
          <div className="handler-stat-icon handler-stat-orange">
            <UserCheck size={20}/>
          </div>
          <div>
            <span>Assigned to Me</span>
            <strong>{mineCount}</strong>
          </div>
        </div>
        <div className="handler-stat-card">
          <div className="handler-stat-icon handler-stat-green">
            <Play size={20} />
          </div>
          <div>
            <span>In Progress</span>
            <strong>{inProgressCount}</strong>
          </div>
        </div>
      </section>
      {error && (
        <section className="handler-message-section">
          <div className="error-message">
            {error}
          </div>
        </section>
      )}
      <section className="handler-toolbar-section">
        <div className="handler-toolbar">
          <div className="handler-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search requests by title, description, or ID..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}/>
          </div>
          <div className="handler-filter-label">
            <Filter size={16} />
            <span>Filter Inbox</span>
          </div>
          <div className="handler-filters">
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
              onChange={(event) => setPriorityFilter(event.target.value)}>
              <option value="ALL">All Priorities</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
            <select
              value={ownershipFilter}
              onChange={(event) => setOwnershipFilter(event.target.value)}>
              <option value="ALL">All Ownership</option>
              <option value="UNASSIGNED">Unassigned</option>
              <option value="MINE">Assigned to Me</option>
              <option value="ASSIGNED">Assigned to Others</option>
            </select>
          </div>
          <div className="handler-results-summary">
            Showing{' '}
            <strong>{filteredRequests.length}
            </strong>{' '}
            of{' '}
            <strong>{requests.length}
            </strong>{' '}
            requests
          </div>
        </div>
      </section>
      {loading ? (
        <div className="loading-state">
          Loading department requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="portal-card empty-state handler-empty-state">
          <ClipboardList size={32}/>
          <h2>No requests</h2>
          <p>There are currently no requests for your department.</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="portal-card handler-filter-empty">
          <Search size={30} />
          <h2>No matching requests</h2>
          <p>Try changing the search term or filters.</p>
        </div>
      ) : (
        <section className="request-list">
          {filteredRequests.map(
            (serviceRequest) => {
              const isMine = serviceRequest.handlerId === user.id;
              const isUnassigned = serviceRequest.handlerId === null;
              const isBusy = actionRequestId === serviceRequest.id;
              const isLoadingDetails = loadingDetailsId === serviceRequest.id;
              return (
                <article
                  className="handler-request-card"
                  key={serviceRequest.id}>
                  <div className="request-card-header">
                    <div>
                      <span className="request-number">
                        Request #
                        {serviceRequest.id}
                      </span>
                      <h2>{serviceRequest.title}</h2>
                    </div>
                    <span className={`status-badge status-${serviceRequest.status}`}>{formatLabel(serviceRequest.status)}</span>
                  </div>
                  <p className="request-description">{serviceRequest.description}</p>
                  <div className="request-metadata">
                    <div>
                      <span>Category</span>
                      <strong>{formatLabel(serviceRequest.category)}</strong>
                    </div>
                    <div>
                      <span>Priority</span>
                      <strong className={`priority-badge priority-${serviceRequest.priority}`}>
                        <span className="priority-dot" />
                        {formatLabel(serviceRequest.priority)}
                      </strong>
                    </div>
                    <div>
                      <span>Ownership</span>
                      <strong className={`ownership-badge ${isMine ? 'ownership-mine' : isUnassigned ? 'ownership-unassigned' : 'ownership-assigned'}`}>
                        {isMine ? 'Assigned to You' : isUnassigned ? 'Unassigned' : 'Assigned'}
                      </strong>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button
                      type="button"
                      className="secondary-button icon-button"
                      onClick={() => handleViewDetails(serviceRequest.id)}
                      disabled={isLoadingDetails}>
                      <Eye size={16} />
                      {isLoadingDetails ? 'Loading...' : 'View Details'}
                    </button>
                    {isUnassigned && (
                      <button
                        type="button"
                        className="primary-button icon-button"
                        disabled={isBusy}
                        onClick={() => handleClaim(serviceRequest.id)}>
                        <Hand size={16}/>
                        {isBusy ? 'Claiming...' : 'Claim Request'}
                      </button>
                    )}
                    {isMine && serviceRequest.status === 'submitted' && (
                        <button
                          type="button"
                          className="primary-button icon-button"
                          disabled={isBusy}
                          onClick={() => handleStatusChange(serviceRequest.id, 'in_progress',)}>
                          <Play size={16}/>
                          {isBusy ? 'Updating...' : 'Start Progress'}
                        </button>
                      )}
                    {isMine && serviceRequest.status === 'in_progress' && (
                        <button
                          type="button"
                          className="success-button icon-button"
                          disabled={isBusy}
                          onClick={() => handleStatusChange(serviceRequest.id, 'completed')}>
                          <CircleCheck size={16}/>
                          {isBusy ? 'Updating...' : 'Complete Request'}
                        </button>
                      )}
                    {!isMine && !isUnassigned && (
                        <span className="assigned-note icon-inline-note">
                          <UsersRound size={15}/>
                          Assigned to another handler
                        </span>
                      )}
                    {isMine && serviceRequest.status === 'completed' && (
                        <span className="completed-note icon-inline-note">
                          <CircleCheck size={15}/>
                          Request completed
                        </span>
                      )}
                  </div>
                </article>
              );
            },
          )}
        </section>
      )}
      {selectedRequest && (
        <RequestDetailsModal request={selectedRequest}
          onClose={() => setSelectedRequest(null)}/>
      )}
    </main>
  );
}
export default HandlerPortal;