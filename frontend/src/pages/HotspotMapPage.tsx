import { AlertTriangle, Info, MapPinned, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { adminApi } from '../api';
import { toApiError } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Field, Select } from '../components/common/Field';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, ErrorState, PageLoader } from '../components/common/States';
import { StatCard } from '../components/common/StatCard';
import type { HotspotAnalysis, HotspotMapData } from '../types/api';
import { formatDateTime } from '../utils/format';

const NOIDA_CENTER: [number, number] = [28.5355, 77.3700];

function heatColour(intensity: number, hotspot: boolean): string {
  if (!hotspot) return '#94a3b8';
  if (intensity >= 0.8) return '#dc2626';
  if (intensity >= 0.55) return '#f97316';
  if (intensity >= 0.3) return '#f59e0b';
  return '#10b981';
}

export default function HotspotMapPage() {
  const [days, setDays] = useState(30);
  const [map, setMap] = useState<HotspotMapData | null>(null);
  const [analysis, setAnalysis] = useState<HotspotAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mapData, hotspotAnalysis] = await Promise.all([
        adminApi.hotspotMap(days),
        adminApi.hotspots(days),
      ]);
      setMap(mapData);
      setAnalysis(hotspotAnalysis);
    } catch (problem) {
      setError(toApiError(problem).detail ?? 'Hotspot data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const center: [number, number] =
    map && map.cells.length > 0
      ? [map.cells[0].latitude, map.cells[0].longitude]
      : NOIDA_CENTER;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hotspot detection"
        title="Unsafe-zone map"
        description="Reports from the selected window are projected onto a ~500 m grid. A cell is a hotspot when its count exceeds the mean plus one standard deviation."
        actions={
          <>
            <Field label="Window" htmlFor="hotspot-days" className="w-36">
              <Select
                id="hotspot-days"
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </Select>
            </Field>
            <Button variant="outline" size="sm" onClick={() => void load()} icon={<RefreshCw className="h-4 w-4" />}>
              Refresh
            </Button>
          </>
        }
      />

      {loading ? (
        <PageLoader label="Calculating hotspots" />
      ) : error || !map || !analysis ? (
        <ErrorState message={error ?? 'No hotspot data available.'} onRetry={() => void load()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Hotspots detected" value={analysis.hotspots.length} icon={MapPinned} tone="red" hint={`${days}-day window`} />
            <StatCard label="Eligible reports" value={analysis.eligibleReports} hint="With valid coordinates" tone="brand" />
            <StatCard label="Cells with reports" value={analysis.cellsWithReports} hint="Zero-report cells excluded" tone="teal" />
            <StatCard
              label="Detection threshold"
              value={analysis.threshold.toFixed(2)}
              hint={`mean ${analysis.meanCount.toFixed(2)} + SD ${analysis.standardDeviation.toFixed(2)}`}
              tone="amber"
            />
          </div>

          {analysis.insufficientData ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Not enough data for a reliable hotpots conclusion</p>
                <p className="mt-1 text-xs leading-relaxed">
                  Fewer than three populated cells or fewer than five eligible reports were found. The algorithm still
                  runs, but the statistical threshold is weak at this sample size. This is shown instead of inventing
                  incidents.
                </p>
              </div>
            </div>
          ) : null}

          <Card className="overflow-hidden">
            <CardHeader
              title="Grid intensity"
              description={`${map.eligibleReports} reports across ${map.cells.length} populated cells. Markers are grid-cell centres, not exact incident addresses.`}
            />
            <div className="relative">
              <MapContainer center={center} zoom={11} scrollWheelZoom style={{ height: '520px', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {map.cells.map((cell) => (
                  <CircleMarker
                    key={cell.cellKey}
                    center={[cell.latitude, cell.longitude]}
                    radius={Math.min(10 + cell.count * 4, 34)}
                    pathOptions={{
                      color: heatColour(cell.intensity, cell.hotspot),
                      fillColor: heatColour(cell.intensity, cell.hotspot),
                      fillOpacity: cell.hotspot ? 0.55 : 0.3,
                      weight: 2,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -4]}>
                      {cell.count} report{cell.count === 1 ? '' : 's'}
                      {cell.hotspot ? ' · hotspot' : ''}
                    </Tooltip>
                    <Popup>
                      <strong>{cell.hotspot ? 'Hotspot cell' : 'Grid cell'}</strong>
                      <br />
                      {cell.count} report{cell.count === 1 ? '' : 's'} in the selected window
                      <br />
                      Cell {cell.cellKey}
                      <br />
                      <span className="text-slate-500">
                        {cell.latitude.toFixed(4)}, {cell.longitude.toFixed(4)}
                      </span>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>

              <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-card">
                <p className="font-semibold text-slate-900">Intensity</p>
                <div className="mt-2 space-y-1.5">
                  {[
                    ['Hotspot · high', '#dc2626'],
                    ['Hotspot · elevated', '#f97316'],
                    ['Hotspot · moderate', '#f59e0b'],
                    ['Below threshold', '#94a3b8'],
                  ].map(([label, colour]) => (
                    <p key={label} className="flex items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colour }} />
                      {label}
                    </p>
                  ))}
                </div>
                <p className="mt-2 max-w-[190px] text-[10px] leading-snug text-slate-500">
                  Marker size reflects the number of reports in the cell.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <Card>
              <CardHeader title="Detected hotspots" description="Ranked by report count using a bounded priority queue." />
              <CardBody className="p-0">
                {analysis.hotspots.length === 0 ? (
                  <EmptyState
                    icon={MapPinned}
                    title="No cell exceeds the threshold"
                    description="With the current data, no grid cell stands more than one standard deviation above the mean. That is a valid result, not a missing feature."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3 font-medium">#</th>
                          <th className="px-5 py-3 font-medium">Zone</th>
                          <th className="px-5 py-3 font-medium">Cell</th>
                          <th className="px-5 py-3 font-medium">Reports</th>
                          <th className="px-5 py-3 font-medium">Intensity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analysis.hotspots.map((hotspot, index) => (
                          <tr key={hotspot.cellKey}>
                            <td className="px-5 py-3 text-xs text-slate-400">{index + 1}</td>
                            <td className="px-5 py-3 text-slate-800">{hotspot.zoneName ?? 'Unnamed zone'}</td>
                            <td className="px-5 py-3 font-mono text-[11px] text-slate-500">{hotspot.cellKey}</td>
                            <td className="px-5 py-3 font-semibold text-slate-900">{hotspot.reportCount}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${Math.round(hotspot.intensity * 100)}%`, backgroundColor: heatColour(hotspot.intensity, true) }}
                                  />
                                </div>
                                <span className="text-[11px] text-slate-500">{Math.round(hotspot.intensity * 100)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="How this is calculated" />
              <CardBody className="space-y-3 text-xs leading-relaxed text-slate-600">
                <p className="flex gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {analysis.methodNote}
                </p>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="font-semibold text-slate-800">Window</p>
                  <p className="mt-1">{formatDateTime(analysis.windowStart)} → {formatDateTime(analysis.windowEnd)}</p>
                </div>
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  {map.disclaimer}
                </p>
                <p className="text-[11px] text-slate-500">
                  The grid uses a local equirectangular projection centred on 28.5355° N. Cell width error is under 1%
                  within the NCR demonstration area. Coordinates are protected: this page is administrator-only.
                </p>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
