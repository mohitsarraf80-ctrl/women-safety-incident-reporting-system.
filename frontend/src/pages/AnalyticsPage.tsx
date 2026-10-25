import { BarChart3, Download, LineChart as LineChartIcon, RefreshCw, Timer } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminApi } from '../api';
import { toApiError } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Field, Select } from '../components/common/Field';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, ErrorState, PageLoader } from '../components/common/States';
import { StatCard } from '../components/common/StatCard';
import { useToast } from '../components/common/Toast';
import type { AnalyticsCharts, AnalyticsOverview, ResponseTimes } from '../types/api';
import { CHART_PALETTE, PRIORITY_CHART_COLORS } from '../utils/constants';
import { formatDate, formatHours } from '../utils/format';

const ranges = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

export default function AnalyticsPage() {
  const toast = useToast();
  const [range, setRange] = useState('30');
  const [charts, setCharts] = useState<AnalyticsCharts | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [response, setResponse] = useState<ResponseTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const bounds = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - Number(range) * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [range]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [chartData, overviewData, responseData] = await Promise.all([
        adminApi.analyticsCharts(bounds.from, bounds.to),
        adminApi.analyticsOverview(bounds.from, bounds.to),
        adminApi.responseTimes(bounds.from, bounds.to),
      ]);
      setCharts(chartData);
      setOverview(overviewData);
      setResponse(responseData);
    } catch (problem) {
      setError(toApiError(problem).detail ?? 'Analytics could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [bounds.from, bounds.to]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await adminApi.exportCsv(bounds.from, bounds.to);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `incidents-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success('Export ready', 'The CSV contains no descriptions, contacts or coordinates.');
    } catch (problem) {
      toast.error('Export failed', toApiError(problem).detail ?? 'The CSV could not be generated.');
    } finally {
      setExporting(false);
    }
  };

  const hasData = (charts?.overTime ?? []).some((point) => point.count > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Incident intelligence"
        description="Every chart is aggregated from MySQL. No personal identifiers, descriptions or exact coordinates are included."
        actions={
          <>
            <Field label="Range" htmlFor="analytics-range" className="w-40">
              <Select id="analytics-range" value={range} onChange={(event) => setRange(event.target.value)}>
                {ranges.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </Select>
            </Field>
            <Button variant="outline" size="sm" onClick={() => void load()} icon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
            <Button size="sm" onClick={() => void exportCsv()} loading={exporting} icon={<Download className="h-4 w-4" />}>
              Export CSV
            </Button>
          </>
        }
      />

      {loading ? (
        <PageLoader label="Building analytics" />
      ) : error || !charts || !overview || !response ? (
        <ErrorState message={error ?? 'Analytics unavailable.'} onRetry={() => void load()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Incidents in range" value={overview.totalIncidents} icon={BarChart3} />
            <StatCard label="Resolved" value={overview.resolvedIncidents} hint={`${overview.pendingIncidents} still open`} tone="teal" />
            <StatCard label="SOS activations" value={overview.sosIncidents} tone="red" />
            <StatCard label="Critical priority" value={overview.criticalIncidents} tone="amber" />
          </div>

          {!hasData ? (
            <Card>
              <CardBody>
                <EmptyState
                  icon={BarChart3}
                  title="No incidents in this range"
                  description="Choose a wider date range, or submit a report (or enable the dev seeder) to generate data. The dashboard never fabricates statistics."
                  action={<Button size="sm" onClick={() => setRange('90')}>Try 90 days</Button>}
                />
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Incidents over time" description="Daily submissions in the display time zone (Asia/Kolkata)." />
                  <CardBody>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={charts.overTime} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickFormatter={(value: string) => formatDate(value).slice(0, 6)}
                            minTickGap={24}
                          />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                          <Tooltip
                            labelFormatter={(value) => formatDate(String(value))}
                            formatter={(value) => [`${value ?? 0} incidents`, 'Submitted']}
                          />
                          <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Priority distribution" description="Severity bands computed by the scoring engine." />
                  <CardBody>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={charts.byPriority}
                            dataKey="count"
                            nameKey="label"
                            innerRadius={55}
                            outerRadius={95}
                            paddingAngle={2}
                          >
                            {charts.byPriority.map((entry) => (
                              <Cell
                                key={entry.key}
                                fill={PRIORITY_CHART_COLORS[entry.key as keyof typeof PRIORITY_CHART_COLORS] ?? '#94a3b8'}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value ?? 0}`, name]} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Incidents by category" description="Reported categories, not verified crime counts." />
                  <CardBody>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.byCategory} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} angle={-20} textAnchor="end" interval={0} height={60} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                          <Tooltip formatter={(value) => [`${value ?? 0} incidents`, 'Reports']} />
                          <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={48} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Case status" description="Resolved versus pending, across the selected range." />
                  <CardBody>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.byStatus} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                          <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 11, fill: '#64748b' }} />
                          <Tooltip formatter={(value) => [`${value ?? 0} incidents`, 'Count']} />
                          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={26}>
                            {charts.byStatus.map((entry, index) => (
                              <Cell key={entry.key} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Responder workload" description="Active assignments versus total assigned cases." />
                  <CardBody>
                    {charts.responderWorkload.length === 0 ? (
                      <EmptyState icon={BarChart3} title="No responders yet" description="Create responder profiles to see workload." />
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={charts.responderWorkload} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="responder" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="activeAssignments" name="Active" fill="#4f46e5" radius={[5, 5, 0, 0]} maxBarSize={34} />
                            <Bar dataKey="totalAssignments" name="Total" fill="#a5b4fc" radius={[5, 5, 0, 0]} maxBarSize={34} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Resolution time" description="Average hours between submission and resolution for completed cases." />
                  <CardBody className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Average</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{formatHours(response.averageResolutionHours)}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Median</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{formatHours(response.medianResolutionHours)}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Samples</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{response.resolvedSamples}</p>
                      </div>
                    </div>
                    {response.resolvedSamples === 0 ? (
                      <EmptyState
                        icon={Timer}
                        title="No resolved cases yet"
                        description="Average resolution time appears once at least one case has been resolved."
                      />
                    ) : (
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={response.byPriority} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} unit="h" />
                            <Tooltip formatter={(value) => [`${value ?? 0} h average`, 'Resolution']} />
                            <Bar dataKey="count" fill="#0d9488" radius={[5, 5, 0, 0]} maxBarSize={44} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>

              <Card>
                <CardHeader title="Data quality & honesty notes" />
                <CardBody className="grid gap-3 text-xs leading-relaxed text-slate-600 sm:grid-cols-2">
                  <p className="flex gap-2">
                    <LineChartIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    Counts describe reports submitted through this prototype. They are not official crime statistics —
                    under-reporting and the demo dataset both affect the numbers.
                  </p>
                  <p className="flex gap-2">
                    <Timer className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    Resolution time is calculated only for cases that reached RESOLVED or CLOSED. Cases still open are
                    excluded rather than counted as zero.
                  </p>
                  <p className="flex gap-2">
                    <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    Priority is derived from the documented score. Manual escalation sets priority to CRITICAL without
                    changing the stored score, so a few CRITICAL cases may show a lower score.
                  </p>
                  <p className="flex gap-2">
                    <Download className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    CSV exports are role-protected and exclude descriptions, contact details and coordinates. Formula
                    characters are escaped to prevent spreadsheet injection.
                  </p>
                </CardBody>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
