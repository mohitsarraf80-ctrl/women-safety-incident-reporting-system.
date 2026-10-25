export type UserRole = 'CITIZEN' | 'ADMIN' | 'RESPONDER';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export type IncidentType =
  | 'VERBAL_HARASSMENT'
  | 'CYBER_HARASSMENT'
  | 'STALKING'
  | 'ASSAULT'
  | 'SEXUAL_ASSAULT'
  | 'OTHER';

export type ResponderAvailability = 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';

export type AlertStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SIMULATED';

export type NotificationChannel = 'IN_APP' | 'SMS' | 'EMAIL';

export interface User {
  id: number;
  displayName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  roleLabel: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresAt: string;
  user: User;
}

export interface CreatedReport {
  reportId: string;
  trackingCode: string;
  status: IncidentStatus;
  statusLabel: string;
  priority: PriorityLevel;
  priorityLabel: string;
  severityScore: number;
  submittedAt: string;
  anonymous: boolean;
  evidenceAttached: boolean;
  alertsCreated: number;
  trackingHint: string;
  disclaimer: string;
}

export interface IncidentSummary {
  id: number;
  reportId: string;
  type: IncidentType;
  typeLabel: string;
  zoneName?: string | null;
  occurredAt: string;
  submittedAt: string;
  severityScore: number;
  priority: PriorityLevel;
  priorityLabel: string;
  status: IncidentStatus;
  statusLabel: string;
  anonymous: boolean;
  sosTriggered: boolean;
  responderName?: string | null;
  escalated: boolean;
  updatedAt: string;
}

export interface SeverityBreakdown {
  baseScore: number;
  nightBonus: number;
  repeatBonus: number;
  evidenceBonus: number;
  sosBonus: number;
  totalScore: number;
  priority: PriorityLevel;
  formula: string;
}

export interface EvidenceItem {
  id: number;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  downloadUrl: string;
}

export interface HistoryItem {
  status: IncidentStatus;
  statusLabel: string;
  changedAt: string;
  note?: string | null;
  actorLabel: string;
}

export interface NoteItem {
  id: number;
  author: string;
  body: string;
  createdAt: string;
}

export interface AlertItem {
  id: number;
  alertType: string;
  recipientCategory: string;
  channel: string;
  recipientRef: string;
  message: string;
  status: AlertStatus;
  errorDetail?: string | null;
  attempts: number;
  createdAt: string;
  sentAt?: string | null;
}

export interface ContactDetails {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface IncidentDetail {
  id: number;
  reportId: string;
  type: IncidentType;
  typeLabel: string;
  description: string;
  occurredAt: string;
  submittedAt: string;
  latitude?: number | null;
  longitude?: number | null;
  zoneName?: string | null;
  gridCell?: string | null;
  severityScore: number;
  priority: PriorityLevel;
  priorityLabel: string;
  status: IncidentStatus;
  statusLabel: string;
  anonymous: boolean;
  sosTriggered: boolean;
  requiresImmediateAssistance: boolean;
  escalated: boolean;
  escalationReason?: string | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  updatedAt: string;
  severity: SeverityBreakdown;
  contact?: ContactDetails | null;
  reporter?: { id: number; displayName: string } | null;
  responder?: {
    id: number;
    badgeCode: string;
    displayName: string;
    organisation: string;
    availability: string;
  } | null;
  evidence: EvidenceItem[];
  history: HistoryItem[];
  notes: NoteItem[];
  alerts: AlertItem[];
  allowedNextStatuses: IncidentStatus[];
}

export interface TrackingEvent {
  status: IncidentStatus;
  statusLabel: string;
  changedAt: string;
  note?: string | null;
}

export interface TrackingResponse {
  reportId: string;
  type: IncidentType;
  typeLabel: string;
  status: IncidentStatus;
  statusLabel: string;
  priority: PriorityLevel;
  priorityLabel: string;
  submittedAt: string;
  occurredAt: string;
  zoneName?: string | null;
  anonymous: boolean;
  history: TrackingEvent[];
  privacyNote: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DashboardSummary {
  totalIncidents: number;
  todayIncidents: number;
  pendingIncidents: number;
  inProgressIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  activeSosAlerts: number;
  hotspotsDetected: number;
  failedAlerts: number;
  unassignedActive: number;
  priorityBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  generatedAt: string;
}

export interface Responder {
  id: number;
  badgeCode: string;
  displayName: string;
  organisation: string;
  contactPhone?: string | null;
  availability: ResponderAvailability;
  loginEmail?: string | null;
  activeAssignments: number;
  totalAssignments: number;
  createdAt: string;
}

export interface AlertRecord {
  id: number;
  incidentId: number;
  reportId: string;
  alertType: string;
  recipientCategory: string;
  channel: NotificationChannel;
  recipientRef: string;
  message: string;
  status: AlertStatus;
  errorDetail?: string | null;
  attempts: number;
  createdAt: string;
  sentAt?: string | null;
}

export interface Hotspot {
  cellKey: string;
  centerLatitude: number;
  centerLongitude: number;
  reportCount: number;
  intensity: number;
  zoneName?: string | null;
  reportIds: string[];
}

export interface HotspotAnalysis {
  windowStart: string;
  windowEnd: string;
  windowDays: number;
  eligibleReports: number;
  cellsWithReports: number;
  meanCount: number;
  standardDeviation: number;
  threshold: number;
  insufficientData: boolean;
  methodNote: string;
  hotspots: Hotspot[];
}

export interface GridPoint {
  cellKey: string;
  latitude: number;
  longitude: number;
  count: number;
  hotspot: boolean;
  intensity: number;
}

export interface HotspotMapData {
  cells: GridPoint[];
  hotspots: Hotspot[];
  eligibleReports: number;
  threshold: number;
  disclaimer: string;
}

export interface CountItem {
  key: string;
  label: string;
  count: number;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface AnalyticsOverview {
  totalIncidents: number;
  resolvedIncidents: number;
  pendingIncidents: number;
  sosIncidents: number;
  criticalIncidents: number;
  averageResolutionHours: number;
  resolvedSamples: number;
  from: string;
  to: string;
}

export interface AnalyticsCharts {
  byCategory: CountItem[];
  byPriority: CountItem[];
  byStatus: CountItem[];
  overTime: TimeSeriesPoint[];
  responderWorkload: { responder: string; activeAssignments: number; totalAssignments: number }[];
  resolved: number;
  pending: number;
  sos: number;
  from: string;
  to: string;
}

export interface ResponseTimes {
  averageResolutionHours: number;
  medianResolutionHours: number;
  resolvedSamples: number;
  byPriority: CountItem[];
  from: string;
  to: string;
}

export interface SosResponse {
  referenceId: string;
  reportId: string;
  trackingCode: string;
  activatedAt: string;
  status: string;
  priority: string;
  severityScore: number;
  locationCaptured: boolean;
  locationNote: string;
  notificationStatus: string;
  notificationDetail: string;
  alerts: string[];
  disclaimer: string;
}

export interface ApiProblem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  errors?: Record<string, string>;
}
