import { BellRing, Radio, RefreshCw, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api';
import { toApiError } from '../api/client';
import { AlertStatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { Select } from '../components/common/Field';
import { PageHeader } from '../components/common/PageHeader';
import { Pagination } from '../components/common/Pagination';
import { EmptyState, ErrorState, TableSkeleton } from '../components/common/States';
import { useToast } from '../components/common/Toast';
import type { AlertRecord, AlertStatus, NotificationChannel, PageResponse } from '../types/api';
import { formatDateTime, relativeTime } from '../utils/format';

export default function AlertsPage() {
  const toast = useToast();
  const [data, setData] = useState<PageResponse<AlertRecord> | null>(null);
  const [status, setStatus] = useState<AlertStatus | ''>('');
  const [channel, setChannel] = useState<NotificationChannel | ''>('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.alerts({ status, channel, page, size: 15 });
      setData(result);
    } catch (problem) {
      setError(toApiError(problem).detail ?? 'Alerts could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [status, channel, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const retry = async (alert: AlertRecord) => {
    setRetrying(alert.id);
    try {
      const updated = await adminApi.retryAlert(alert.id);
      setData((current) =>
        current
          ? { ...current, content: current.content.map((item) => (item.id === updated.id ? updated : item)) }
          : current,
      );
      toast.success('Retry queued', 'The alert was reset to PENDING and delivery was attempted again.');
    } catch (problem) {
      toast.error('Retry failed', toApiError(problem).detail ?? 'The alert could not be retried.');
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Alert management"
        title="Notification feed"
        description="Every alert row is a real database record. In-app delivery is real; SMS and e-mail are simulated and labelled accordingly."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()} icon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">In-app</p>
          <p className="mt-1 text-xs">Delivered inside the platform. Status SENT.</p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <p className="font-semibold">SMS / e-mail</p>
          <p className="mt-1 text-xs">Simulated in demo mode. Status SIMULATED — never shown as delivered.</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Failed</p>
          <p className="mt-1 text-xs">Delivery error recorded. Retry is available with a bounded attempt count.</p>
        </div>
      </div>

      <Card>
        <CardHeader
          title={data ? `${data.totalElements} alerts` : 'Alerts'}
          description="Newest first. Filters apply to the delivery status and channel."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                aria-label="Filter by status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as AlertStatus | '');
                  setPage(0);
                }}
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SENT">Sent</option>
                <option value="SIMULATED">Simulated</option>
                <option value="FAILED">Failed</option>
              </Select>
              <Select
                aria-label="Filter by channel"
                value={channel}
                onChange={(event) => {
                  setChannel(event.target.value as NotificationChannel | '');
                  setPage(0);
                }}
              >
                <option value="">All channels</option>
                <option value="IN_APP">In-app</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">E-mail</option>
              </Select>
            </div>
          }
        />
        {loading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title="No alerts match"
            description="Submit an incident or SOS to generate alerts, or adjust the filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3 font-medium">Report</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Recipient</th>
                    <th className="px-5 py-3 font-medium">Channel</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Attempts</th>
                    <th className="px-5 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.content.map((alert) => (
                    <tr key={alert.id} className="align-top hover:bg-slate-50/60">
                      <td className="px-5 py-3 text-xs text-slate-500">
                        <p>{formatDateTime(alert.createdAt)}</p>
                        <p className="text-[11px] text-slate-400">{relativeTime(alert.createdAt)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <Link to={`/admin/incidents/${alert.incidentId}`} className="font-mono text-xs font-semibold text-brand-700 hover:text-brand-800">
                          {alert.reportId}
                        </Link>
                        <p className="mt-0.5 max-w-xs text-[11px] text-slate-500">{alert.message}</p>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">{alert.alertType.replaceAll('_', ' ')}</td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        {alert.recipientCategory.replaceAll('_', ' ')}
                        <p className="text-[11px] text-slate-400">{alert.recipientRef}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <Radio className="h-3.5 w-3.5 text-slate-400" /> {alert.channel.replace('_', '-')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <AlertStatusBadge status={alert.status} />
                        {alert.errorDetail ? <p className="mt-1 max-w-[180px] text-[11px] text-red-600">{alert.errorDetail}</p> : null}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">{alert.attempts}</td>
                      <td className="px-5 py-3 text-right">
                        {alert.status === 'FAILED' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            loading={retrying === alert.id}
                            onClick={() => void retry(alert)}
                            icon={<RotateCcw className="h-4 w-4" />}
                          >
                            Retry
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-5 py-3">
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
