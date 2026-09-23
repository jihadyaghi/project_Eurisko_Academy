import type {CreateServiceRequestPayload,ServiceRequest,ServiceRequestStatus,} from '../types/service-request.types';
const API_URL = 'http://localhost:3000';
export async function createServiceRequest(
  payload: CreateServiceRequestPayload,
  token: string,
): Promise<ServiceRequest> {
  const response = await fetch(
    `${API_URL}/service-requests`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create request',);
  }
  return data;
}

export async function getHandlerInbox(
  token: string,
): Promise<ServiceRequest[]> {
  const response = await fetch(
    `${API_URL}/service-requests/handler/inbox`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to load handler inbox',);
  }
  return data;
}

export async function claimRequest(
  requestId: number,
  token: string,
): Promise<ServiceRequest> {
  const response = await fetch(
    `${API_URL}/service-requests/${requestId}/assign`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to claim request',);
  }
  return data;
}

export async function updateRequestStatus(
  requestId: number,
  status: ServiceRequestStatus,
  token: string,
): Promise<ServiceRequest> {
  const response = await fetch(
    `${API_URL}/service-requests/${requestId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status,
      }),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update request status',);
  }
  return data;
}