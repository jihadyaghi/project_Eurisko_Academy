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
function App() {
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
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
  if (!request) {
    return <div>Loading...</div>
  }
  return (
    <div>
      <h1>Service Request</h1>
      <p>
        <strong>Title:</strong> {request.title}
      </p>
      <p>
        <strong>Description:</strong> {request.description}
      </p>
      <p>
        <strong>Status:</strong> {request.status}
      </p>
      <button onClick={startProgress}>Start Progress</button>
      <button onClick={completeRequest}>Complete Request</button>
      {error && (
      <p>
       <strong>Error:</strong> {error}
      </p>
)}
    </div>
  )
}

export default App
