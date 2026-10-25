import { Filter, RefreshCw, Search, ShieldAlert, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../api';
import { toApiError } from '../api/client';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { Field, Input, Select } from '../components/common/Field';
import { PageHeader } from '../components/common/PageHeader';
import { Pagination } from '../components/common/Pagination';
import { EmptyState, ErrorState, TableSkeleton } from '../components/common/States';
import type { IncidentStatus, IncidentSummary, IncidentType, PageResponse, PriorityLevel } from '../types/api';
import { INCIDENT_TYPES, PRIORITIES, STATUSES } from '../utils/constants';
import { dayBoundaryIso, formatDateTime, relativeTime } from '../utils/format';

const PAGE_SIZE = 12;

export default function IncidentManagementPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<PageResponse<IncidentSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [type, setType] = useState<IncidentType | ''>((params.get('type') as IncidentType) ?? '');
  const [priority, setPriority] = useState<PriorityLevel | ''>((params.get('priority') as PriorityLevel) ?? '');
  const [status, setStatus] = useState<IncidentStatus | ''>((params.get('status') as IncidentStatus) ?? '');
  const [from, setFrom] = useState(params.get('from') ?? '');
  const [to, setTo] = useState(params.get('to') ?? '');
  const [sort, setSort] = useState(params.get('sort') ?? 'severity');
  const [direction, setDirection] = useState(params.get('direction') ?? 'desc');
  const [page, setPage] = useState(Number(params.get('page') ?? 0));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.incidents({
        q: query || undefined,
        type: type || undefined,
        priority: priority || undefined,
        status: status || undefined,
        from: from ? dayBoundaryIso(from) : undefined,
        to: to ? dayBoundaryIso(to, true) : undefined,
        sort,
        direction,
        page,
        size: PAGE_SIZE,
      });
      setData(result);
    } catch (problem) {
      setError(toApiError(problem).detail ?? 'The incident queue could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [query, type, priority, status, from, to, sort, direction, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyFilters = () => {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    if (type) next.set('type', type);
    if (priority) next.set('priority', priority);
    if (status) next.set('status', status);
    if (from) next.set('from', from);
    if (to) next.set('to', to);
    next.set('sort', sort);
    next.set('direction', direction);
    next.set('page', '0');
    setPage(0);
    setParams(next, { replace: true });
  };

  const reset = () => {
    setQuery('');
    setType('');
    setPriority('');
    setStatus('');
    setFrom('');
    setTo('');
    setSort('severity');
    setDirection('desc');
    setPage(0);
    setParams({}, { replace: true });
  };

  const activeFilters = [query, type, priority, status, from, to].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Incident management"
        title="Case queue"
        description="Search, filter and triage every report. The default order prioritises CRITICAL and HIGH cases without hiding anything else."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} icon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        }
      />

      <Card>
        <CardHeader
          title="Filters"
          description={activeFilters ? `${activeFilters} filter${activeFilters === 1 ? '' : 's'} active` : 'Showing all reports'}
          actions={
            activeFilters ? (
              <Button variant="ghost" size="sm" onClick={reset} icon={<X className="h-4 w-4" />}>
                Clear
              </Button>
            ) : null
          }
        />
        <div className="grid gap-4 px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Search" htmlFor="filter-q" className="xl:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="filter-q"
                className="pl-9"
                placeholder="Report ID, zone or description"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyFilters();
                }}
              />
            </div>
          </Field>
          <Field label="Category" htmlFor="filter-type">
            <Select id="filter-type" value={type} onChange={(event) => setType(event.target.value as IncidentType | '')}>
              <option value="">All categories</option>
              {INCIDENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Priority" htmlFor="filter-priority">
            <Select id="filter-priority" value={priority} onChange={(event) => setPriority(event.target.value as PriorityLevel | '')}>
              <option value="">All priorities</option>
              {PRIORITIES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="filter-status">
            <Select id="filter-status" value={status} onChange={(event) => setStatus(event.target.value as IncidentStatus | '')}>
              <option value="">All statuses</option>
              {STATUSES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="From date" htmlFor="filter-from">
            <Input id="filter-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </Field>
          <Field label="To date" htmlFor="filter-to">
            <Input id="filter-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </Field>
          <Field label="Sort by" htmlFor="filter-sort">
            <Select
              id="filter-sort"
              value={`${sort}:${direction}`}
              onChange={(event) => {
                const [nextSort, nextDirection] = event.target.value.split(':');
                setSort(nextSort);
                setDirection(nextDirection);
              }}
            >
              <option value="severity:desc">Priority (highest first)</option>
              <option value="created:desc">Newest first</option>
              <option value="created:asc">Oldest first</option>
              <option value="updated:desc">Recently updated</option>
            </Select>
          </Field>
          <div className="flex items-end gap-2 xl:col-span-4">
            <Button onClick={applyFilters} icon={<Filter className="h-4 w-4" />}>Apply filters</Button>
            <span className="text-xs text-slate-500">Default: severity score, highest first.</span>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={data ? `${data.totalElements} incident${data.totalElements === 1 ? '' : 's'}` : 'Loading incidents'}
          description="Anonymous reports never show an identity. Responder names are shown once assigned."
        />
        {loading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No incidents match these filters"
            description="Adjust the filters, or clear them to see the full queue."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Report ID</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Zone</th>
                    <th className="px-5 py-3 font-medium">Occurred</th>
                    <th className="px-5 py-3 font-medium">Score</th>
                    <th className="px-5 py-3 font-medium">Priority</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Responder</th>
                    <th className="px-5 py-3 font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.content.map((incident) => (
                    <tr key={incident.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <Link to={`/admin/incidents/${incident.id}`} className="font-mono text-xs font-semibold text-brand-700 hover:text-brand-800">
                          {incident.reportId}
                        </Link>
                        <p className="mt-0.5 text-[11px] text-slate-400" title={formatDateTime(incident.submittedAt)}>
                          {relativeTime(incident.submittedAt)}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{incident.typeLabel}</td>
                      <td className="px-5 py-3 text-slate-500">{incident.zoneName ?? '—'}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{formatDateTime(incident.occurredAt)}</td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-slate-900">{incident.severityScore}</span>
                        <span className="text-xs text-slate-400">/100</span>
                      </td>
                      <td className="px-5 py-3"><PriorityBadge priority={incident.priority} /></td>
                      <td className="px-5 py-3"><StatusBadge status={incident.status} label={incident.statusLabel} /></td>
                      <td className="px-5 py-3 text-xs text-slate-600">{incident.responderName ?? <span className="text-slate-400">Unassigned</span>}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {incident.sosTriggered ? <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">SOS</span> : null}
                          {incident.anonymous ? <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">Anon</span> : null}
                          {incident.escalated ? <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">Escalated</span> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={(next) => {
                  setPage(next);
                  const nextParams = new URLSearchParams(params);
                  nextParams.set('page', String(next));
                  setParams(nextParams, { replace: true });
                }}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
