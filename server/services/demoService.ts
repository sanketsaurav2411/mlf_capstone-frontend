export interface DemoRequest {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  requestedBy: string;
  createdAt: string;
}

export const demoRequestsStore: DemoRequest[] = [];

export function createDemoRequest({
  name,
  email,
  company,
  message,
  requestedBy,
}: {
  name: string;
  email: string;
  company?: string;
  message: string;
  requestedBy: string;
}): DemoRequest {
  const demoRequest: DemoRequest = {
    id: Date.now().toString(36),
    name,
    email,
    company: company || 'Not provided',
    message,
    requestedBy,
    createdAt: new Date().toISOString(),
  };

  demoRequestsStore.push(demoRequest);
  return demoRequest;
}
