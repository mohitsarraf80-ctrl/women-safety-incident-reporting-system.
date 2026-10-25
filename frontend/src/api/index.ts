import type {
  AlertRecord,
  AlertStatus,
  AnalyticsCharts,
  AnalyticsOverview,
  AuthResponse,
  CreatedReport,
  DashboardSummary,
  HotspotAnalysis,
  HotspotMapData,
  IncidentDetail,
  IncidentStatus,
  IncidentSummary,
  IncidentType,
  NotificationChannel,
  PageResponse,
  PriorityLevel,
  Responder,
  ResponseTimes,
  SosResponse,
  TrackingResponse,
  User,
} from '../types/api';
import { api } from './client';

/* ------------------------------------------------------------------ auth */

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },
  async register(displayName: string, email: string, password: string, phone?: string) {
    const { data } = await api.post<AuthResponse>('/auth/register', {
      displayName,
      email,
      password,
      phone: phone || undefined,
    });
    return data;
  },
  async me() {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
  async logout() {
    await api.post('/auth/logout');
  },
  async updateProfile(displayName: string, phone?: string) {
    const { data } = await api.patch<User>('/auth/profile', { displayName, phone: phone || undefined });
    return data;
  },
  async changePassword(currentPassword: string, newPassword: string) {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },
};

/* ------------------------------------------------------------- incidents */

export interface ReportPayload {
  type: IncidentType;
  description: string;
  occurredAt: string;
  zoneName?: string;
  latitude?: number;
  longitude?: number;
  anonymous: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  requiresImmediateAssistance: boolean;
}

export const incidentApi = {
  async submit(payload: ReportPayload, evidence?: File | null) {
    const form = new FormData();
    form.append('payload', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (evidence) {
      form.append('evidence', evidence);
    }
    const { data } = await api.post<CreatedReport>('/incidents', form);
    return data;
  },
  async myReports() {
    const { data } = await api.get<IncidentSummary[]>('/incidents/my');
    return data;
  },
  async detail(id: number) {
    const { data } = await api.get<IncidentDetail>(`/incidents/${id}`);
    return data;
  },
  async track(reportId: string, trackingCode: string) {
    const { data } = await api.post<TrackingResponse>('/reports/track', {
      reportId: reportId.trim(),
      trackingCode: trackingCode.trim(),
    });
    return data;
  },
  async uploadEvidence(reportId: string, file: File, trackingCode?: string) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post(`/incidents/${reportId}/evidence`, form, {
      headers: trackingCode ? { 'X-Tracking-Code': trackingCode } : undefined,
    });
    return data;
  },
};

/* -------------------------------------------------------------------- sos */

export const sosApi = {
  async activate(payload: { latitude?: number; longitude?: number; zoneName?: string; description?: string }) {
    const { data } = await api.post<SosResponse>('/sos', payload);
    return data;
  },
};

/* ------------------------------------------------------------------ admin */

export interface IncidentFilters {
  q?: string;
  type?: IncidentType | '';
  priority?: PriorityLevel | '';
  status?: IncidentStatus | '';
  from?: string;
  to?: string;
  sort?: string;
  direction?: string;
  page?: number;
  size?: number;
}

export const adminApi = {
  async summary() {
    const { data } = await api.get<DashboardSummary>('/admin/dashboard/summary');
    return data;
  },
  async incidents(filters: IncidentFilters) {
    const params: Record<string, string | number> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });
    const { data } = await api.get<PageResponse<IncidentSummary>>('/admin/incidents', { params });
    return data;
  },
  async incident(id: number) {
    const { data } = await api.get<IncidentDetail>(`/admin/incidents/${id}`);
    return data;
  },
  async updateStatus(id: number, status: IncidentStatus, note?: string) {
    const { data } = await api.patch<IncidentDetail>(`/admin/incidents/${id}/status`, { status, note });
    return data;
  },
  async assign(id: number, responderId: number) {
    const { data } = await api.patch<IncidentDetail>(`/admin/incidents/${id}/assign`, { responderId });
    return data;
  },
  async escalate(id: number, reason: string) {
    const { data } = await api.post<IncidentDetail>(`/admin/incidents/${id}/escalate`, { reason });
    return data;
  },
  async addNote(id: number, note: string) {
    const { data } = await api.post<IncidentDetail>(`/admin/incidents/${id}/notes`, { note });
    return data;
  },
  async responders() {
    const { data } = await api.get<Responder[]>('/admin/responders');
    return data;
  },
  async createResponder(payload: {
    displayName: string;
    organisation: string;
    contactPhone?: string;
    availability?: string;
    loginEmail?: string;
    loginPassword?: string;
  }) {
    const { data } = await api.post<Responder>('/admin/responders', payload);
    return data;
  },
  async updateResponder(
    id: number,
    payload: { displayName: string; organisation: string; contactPhone?: string; availability: string },
  ) {
    const { data } = await api.patch<Responder>(`/admin/responders/${id}`, payload);
    return data;
  },
  async responderIncidents(id: number) {
    const { data } = await api.get<PageResponse<IncidentSummary>>(`/admin/responders/${id}/incidents`);
    return data;
  },
  async alerts(params: { status?: AlertStatus | ''; channel?: NotificationChannel | ''; page?: number; size?: number }) {
    const query: Record<string, string | number> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        query[key] = value as string | number;
      }
    });
    const { data } = await api.get<PageResponse<AlertRecord>>('/admin/alerts', { params: query });
    return data;
  },
  async retryAlert(id: number) {
    const { data } = await api.post<AlertRecord>(`/admin/alerts/${id}/retry`);
    return data;
  },
  async hotspots(days: number) {
    const { data } = await api.get<HotspotAnalysis>('/admin/hotspots', { params: { days } });
    return data;
  },
  async hotspotMap(days: number) {
    const { data } = await api.get<HotspotMapData>('/admin/hotspots/map', { params: { days } });
    return data;
  },
  async analyticsOverview(from?: string, to?: string) {
    const { data } = await api.get<AnalyticsOverview>('/admin/analytics/overview', { params: { from, to } });
    return data;
  },
  async analyticsCharts(from?: string, to?: string) {
    const { data } = await api.get<AnalyticsCharts>('/admin/analytics/incidents', { params: { from, to } });
    return data;
  },
  async responseTimes(from?: string, to?: string) {
    const { data } = await api.get<ResponseTimes>('/admin/analytics/response-times', { params: { from, to } });
    return data;
  },
  async exportCsv(from?: string, to?: string) {
    const response = await api.get<Blob>('/admin/analytics/export.csv', {
      params: { from, to },
      responseType: 'blob',
    });
    return response.data;
  },
};

/* -------------------------------------------------------------- responder */

export const responderApi = {
  async profile() {
    const { data } = await api.get<Responder>('/responder/profile');
    return data;
  },
  async incidents(page = 0, size = 20) {
    const { data } = await api.get<PageResponse<IncidentSummary>>('/responder/incidents', {
      params: { page, size },
    });
    return data;
  },
  async incident(id: number) {
    const { data } = await api.get<IncidentDetail>(`/responder/incidents/${id}`);
    return data;
  },
  async updateStatus(id: number, status: IncidentStatus, note?: string) {
    const { data } = await api.patch<IncidentDetail>(`/responder/incidents/${id}/status`, { status, note });
    return data;
  },
};
