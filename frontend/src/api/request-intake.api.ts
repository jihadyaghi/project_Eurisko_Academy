import type {AnalyzeRequestPayload,IntakeResult,} from '../types/request-intake.types';
const API_URL = 'http://localhost:3000';
export async function analyzeRequest(
  payload: AnalyzeRequestPayload,
  token: string,
): Promise<IntakeResult> {
  const response = await fetch(
    `${API_URL}/request-intake/analyze`,
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
    throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || 'AI analysis failed',);
  }
  return data;
}