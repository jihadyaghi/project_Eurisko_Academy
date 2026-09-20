import { useEffect, useState } from 'react';
import './App.css'
interface ServiceRequest {
  id: number;
  employeeId: number;
  departmentId: number;
  title: string;
  description: string;
  status: string;
}
interface IntakeResult {
  department: 'IT' | 'HR' | 'Finance' | null;
  category: 'hardware' | 'software' | 'access' | 'employment_document' | 'leave' | 'employee_support' | 'reimbursement' | 'payroll' | 'expense' | null;
  priority: 'low' | 'normal' | 'high';
  summary: string;
  needsReview: boolean;
}
function App() {
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intakeText, setIntakeText] = useState('');
  const [intakeResult, setIntakeResult] = useState<IntakeResult | null>(null);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  useEffect(()=>{
    fetch('http://localhost:3000/service-requests/1')
    .then(response => response.json())
    .then(data => setRequest(data))
    .catch((error)=> console.error('Error fetching service request:', error));
  }, []);
  const startProgress = async () => {
  const response = await fetch(
    `http://localhost:3000/service-requests/${request?.id}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'in_progress',
        handlerId: 201,
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    setError(data.message || 'Failed to update status');
    return;
  }
  setError(null);
  setRequest(data);
};
const completeRequest = async () => {
  const response = await fetch(
    `http://localhost:3000/service-requests/${request?.id}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'completed',
        handlerId: 201,
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    setError(data.message || 'Failed to update status');
    return;
  }
  setError(null);
  setRequest(data);
};
const analyzeRequest = async () => {
  setAnalyzing(true);
  setIntakeError(null);
  setIntakeResult(null);
  try {
    const response = await fetch('http://localhost:3000/request-intake/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: intakeText
      }),
    },);
    const data = await response.json();
    if (!response.ok){
      setIntakeError(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'AI analysis failed');
      return;
    }
    setIntakeResult(data);
  }
  catch {
    setIntakeError('Unable to reach AI assistance')
  }
  finally {
    setAnalyzing(false);
  }
};
  if (!request) {
    return <div className="loading">Loading...</div>
  }
  return (
    <main className="page-container">
      <section className="employee-section">
        <div className="section-header">
          <span className="role-label">Employee</span>
          <h1>Request Intake</h1>
          <p>Describe your internal request and receive an AI-assisted suggestion.</p>
        </div>
        <textarea className="ai-intake-textarea" value={intakeText} onChange={(event) => setIntakeText(event.target.value)} placeholder='Example: My laptop keeps shutting down and I cannot work.' rows={5} />
        <button className="analyze-button" onClick={analyzeRequest} disabled={analyzing || intakeText.trim().length < 3}>{analyzing ? 'Analyzing...' : 'Analyze with AI'}</button>
        {intakeError && (
          <div className="error-message"><strong>AI Error:</strong> {intakeError}</div>
        )}
        {intakeResult && (
          <div className="ai-result">
            <h2>AI Suggestion</h2>
            {intakeResult.needsReview ? (
              <div className="review-message">This request is unclear and needs manual review.</div>
            ) : (
              <>
              <p><strong>Department:</strong> {intakeResult.department}</p>
              <p><strong>Category:</strong> {intakeResult.category}</p>
              </> 
            )}
            <p><strong>Priority:</strong> {intakeResult.priority}</p>
            <p><strong>Summary:</strong> {intakeResult.summary}</p>
          </div>
        )}
      </section>
      <section className="handler-section">
        <div className="section-header">
          <span className="role-label">Department Handler</span>
          <h1>Request Handling</h1>
          <p>Demo handler: 201</p>
        </div>
        <div className="request-info">
          <p><strong>Title:</strong> {request.title}</p>
          <p><strong>Description:</strong> {request.description}</p>
          <p><strong>Status:</strong> {request.status}</p>
        </div>
        <div className="actions">
          <button className="start-button" onClick={startProgress}>Start Progress</button>
          <button className="complete-button" onClick={completeRequest}>Complete Request</button>
        </div>
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}
      </section>
    </main>
  )
}

export default App
