import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  FileUp,
  Info,
  MapPin,
  ShieldCheck,
  Siren,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { incidentApi } from '../api';
import { toApiError } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { CheckboxRow, Field, Input, Textarea } from '../components/common/Field';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import type { IncidentType } from '../types/api';
import { INCIDENT_TYPES } from '../utils/constants';
import { toDateTimeLocalValue, toIso } from '../utils/format';
import { reportSchema, type ReportFormValues } from '../validation/reportSchema';

const schema = reportSchema;

type FormValues = ReportFormValues;

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export default function ReportIncidentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [evidence, setEvidence] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'STALKING',
      description: '',
      occurredAt: toDateTimeLocalValue(),
      zoneName: '',
      latitude: '',
      longitude: '',
      anonymous: !user,
      contactName: '',
      contactEmail: user?.email ?? '',
      contactPhone: '',
      requiresImmediateAssistance: false,
    },
  });

  const anonymous = watch('anonymous');
  const selectedType = watch('type');
  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const zoneName = watch('zoneName');
  const description = watch('description');

  const selected = INCIDENT_TYPES.find((item) => item.value === selectedType);
  const needsContact = !anonymous && !user;

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location unavailable', 'This browser does not support geolocation. Enter a zone instead.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('latitude', position.coords.latitude.toFixed(5));
        setValue('longitude', position.coords.longitude.toFixed(5));
        setLocating(false);
        toast.success('Location captured', 'Coordinates were added to the form. You can clear them at any time.');
      },
      () => {
        setLocating(false);
        toast.info('No location permission', 'You can still report using a zone or landmark.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const onFileChange = (file: File | null) => {
    setFileError(null);
    if (!file) {
      setEvidence(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Only JPEG, PNG, WEBP images or PDF documents are accepted.');
      setEvidence(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setFileError('The file must be 5 MB or smaller.');
      setEvidence(null);
      return;
    }
    setEvidence(file);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    if (needsContact && !values.contactName && !values.contactEmail && !values.contactPhone) {
      setFormError('For a non-anonymous report without an account, add at least one contact method, or report anonymously.');
      return;
    }
    try {
      const created = await incidentApi.submit(
        {
          type: values.type as IncidentType,
          description: values.description.trim(),
          occurredAt: toIso(values.occurredAt),
          zoneName: values.zoneName?.trim() || undefined,
          latitude: values.latitude ? Number(values.latitude) : undefined,
          longitude: values.longitude ? Number(values.longitude) : undefined,
          anonymous: values.anonymous,
          contactName: values.contactName?.trim() || undefined,
          contactEmail: values.contactEmail?.trim() || undefined,
          contactPhone: values.contactPhone?.trim() || undefined,
          requiresImmediateAssistance: values.requiresImmediateAssistance,
        },
        evidence,
      );
      navigate('/report/confirmation', { state: { created, evidenceName: evidence?.name } });
    } catch (error) {
      const problem = toApiError(error);
      setFormError(problem.errors ? Object.values(problem.errors)[0] : problem.detail ?? 'The report could not be submitted.');
    }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Report an incident</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Tell us what happened</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Share only what you are comfortable sharing. Required fields are marked; everything else is optional.
          Your report is validated, scored and reviewed by an authorised administrator.
        </p>
      </div>

      <form className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_0.9fr]" onSubmit={onSubmit} noValidate>
        <div className="space-y-6">
          {formError ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          ) : null}

          <Card>
            <CardHeader title="Incident category" description="Choose the closest match. The category sets the base severity score." />
            <CardBody className="grid gap-3 sm:grid-cols-2">
              {INCIDENT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={[
                    'cursor-pointer rounded-xl border p-4 transition-colors',
                    selectedType === type.value
                      ? 'border-brand-400 bg-brand-50/60 ring-1 ring-brand-300'
                      : 'border-slate-200 hover:border-slate-300',
                  ].join(' ')}
                >
                  <input type="radio" value={type.value} className="sr-only" {...register('type')} />
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">{type.label}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      base {type.baseScore}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{type.description}</p>
                </label>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="What happened" description="Facts are enough — no need to write anything you find distressing." />
            <CardBody className="space-y-5">
              <Field
                label="Description"
                htmlFor="description"
                required
                error={errors.description?.message}
                hint={`${description?.length ?? 0}/4000 characters · at least 20`}
              >
                <Textarea
                  id="description"
                  placeholder="Describe what happened, where you were and whether anyone else was present…"
                  invalid={Boolean(errors.description)}
                  {...register('description')}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Date and time of the incident" htmlFor="occurredAt" required error={errors.occurredAt?.message}>
                  <Input
                    id="occurredAt"
                    type="datetime-local"
                    max={toDateTimeLocalValue()}
                    invalid={Boolean(errors.occurredAt)}
                    {...register('occurredAt')}
                  />
                </Field>
                <Field label="Immediate assistance requested?" htmlFor="requiresImmediateAssistance">
                  <label className="flex h-[38px] items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-700">
                    <input
                      id="requiresImmediateAssistance"
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                      {...register('requiresImmediateAssistance')}
                    />
                    Mark this report as urgent
                  </label>
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Location"
              description="Choose a landmark or share coordinates. Exact coordinates are only shown to authorised staff."
            />
            <CardBody className="space-y-5">
              <Field
                label="Zone or landmark"
                htmlFor="zoneName"
                error={errors.zoneName?.message}
                hint="For example: Sector 62 Metro Station, NIET Campus Gate 2, Sector 18 Market"
              >
                <Input
                  id="zoneName"
                  placeholder="Where did it happen?"
                  invalid={Boolean(errors.zoneName)}
                  {...register('zoneName')}
                />
              </Field>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Optional GPS coordinates</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Stored only if you provide them, used for hotspot analysis and responder navigation.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={locating}
                    onClick={useMyLocation}
                    icon={<Crosshair className="h-4 w-4" />}
                  >
                    Use my location
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Latitude" htmlFor="latitude" error={errors.latitude?.message}>
                    <Input id="latitude" inputMode="decimal" placeholder="28.62050" invalid={Boolean(errors.latitude)} {...register('latitude')} />
                  </Field>
                  <Field label="Longitude" htmlFor="longitude" error={errors.longitude?.message}>
                    <Input id="longitude" inputMode="decimal" placeholder="77.37000" invalid={Boolean(errors.longitude)} {...register('longitude')} />
                  </Field>
                </div>
                {latitude && longitude ? (
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600"
                    onClick={() => {
                      setValue('latitude', '');
                      setValue('longitude', '');
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear coordinates
                  </button>
                ) : null}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Supporting evidence" description="Optional. Images or a PDF, up to 5 MB." />
            <CardBody className="space-y-3">
              <label
                htmlFor="evidence"
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 hover:border-brand-400 hover:bg-brand-50/40"
              >
                <div className="flex items-center gap-3">
                  <FileUp className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {evidence ? evidence.name : 'Choose a photo or PDF'}
                    </p>
                    <p className="text-xs text-slate-500">JPEG, PNG, WEBP or PDF · validated by content, not extension</p>
                  </div>
                </div>
                {evidence ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : null}
              </label>
              <input
                id="evidence"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
              />
              {fileError ? <p className="text-xs font-medium text-red-600">{fileError}</p> : null}
              {evidence ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600"
                  onClick={() => setEvidence(null)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove file
                </button>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Identity & contact" description="Anonymous mode stores no identity at all." />
            <CardBody className="space-y-4">
              <CheckboxRow
                id="anonymous"
                checked={anonymous}
                onChange={(checked) => setValue('anonymous', checked, { shouldValidate: true })}
                title="Report anonymously"
                description="No name, phone number or account link is stored. You will receive a Report ID and a one-time tracking code."
              />

              {!anonymous ? (
                <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-600">
                    {user
                      ? 'Your account identity will be attached to this report so you can find it in “My reports”. Contact details are optional.'
                      : 'Without an account, add at least one contact method so a responder can reach you. This removes anonymity.'}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Contact name" htmlFor="contactName">
                      <Input id="contactName" placeholder="Optional" {...register('contactName')} />
                    </Field>
                    <Field label="Contact phone" htmlFor="contactPhone" error={errors.contactPhone?.message}>
                      <Input id="contactPhone" placeholder="Optional" {...register('contactPhone')} />
                    </Field>
                  </div>
                  <Field label="Contact email" htmlFor="contactEmail" error={errors.contactEmail?.message}>
                    <Input id="contactEmail" type="email" placeholder="Optional" invalid={Boolean(errors.contactEmail)} {...register('contactEmail')} />
                  </Field>
                  {!user ? (
                    <p className="text-xs text-slate-500">
                      Prefer to stay unidentified?{' '}
                      <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
                        Sign in
                      </Link>{' '}
                      and report from your account, or tick anonymous reporting.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>

        {/* Summary column */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader title="Report summary" />
            <CardBody className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Category</p>
                <p className="mt-1 font-medium text-slate-900">{selected?.label}</p>
                <p className="text-xs text-slate-500">Base score {selected?.baseScore} / 100</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
                <p className="mt-1 flex items-start gap-1.5 text-slate-900">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  {latitude && longitude ? `${latitude}, ${longitude}` : zoneName || 'Not provided yet'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Visibility</p>
                <p className="mt-1 font-medium text-slate-900">
                  {anonymous ? 'Anonymous · no identity stored' : user ? 'Linked to your account' : 'Non-anonymous with contact details'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Info className="h-3.5 w-3.5" /> What happens next
                </p>
                The server validates this report, computes a severity score and creates an alert for the safety desk.
                A low score never blocks review, and an administrator can always escalate.
              </div>
              <Button type="submit" size="lg" className="w-full" loading={isSubmitting} icon={<ShieldCheck className="h-4 w-4" />}>
                Submit report
              </Button>
              <p className="text-center text-[11px] leading-relaxed text-slate-500">
                This prototype does not contact police or emergency services. In immediate danger, call them
                directly.
              </p>
            </CardBody>
          </Card>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
              <Siren className="h-4 w-4" /> In immediate danger?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-red-700">
              Use the SOS page to record an urgent alert for the safety desk, then contact local emergency
              services yourself.
            </p>
            <Link to="/sos" className="mt-2 inline-block text-xs font-semibold text-red-800 underline">
              Open SOS page →
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}
