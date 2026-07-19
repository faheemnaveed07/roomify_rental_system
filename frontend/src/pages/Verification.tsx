import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    ShieldCheck,
    Mail,
    IdCard,
    Check,
    Upload,
    X,
    Loader2,
    ArrowRight,
} from 'lucide-react';
import { verificationService, VerificationStatus, resolveAssetUrl } from '../services/api';
import { useAuthStore } from '../store/auth.store';

/**
 * Verification centre — email + CNIC.
 *
 * Note on the email step: this project has no third-party email-verification
 * provider, so that step is a deliberate DEMO SIMULATION (confirm dialog →
 * progress → verified). The real token-based flow already exists in
 * AuthService.verifyEmail and is what a production build should use.
 */

const EMAIL_SIM_MS = 5000;

/** Circular countdown used while the simulated email check "runs" */
const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
    const r = 42;
    const c = 2 * Math.PI * r;
    return (
        <svg width="110" height="110" viewBox="0 0 100 100" className="mx-auto">
            <circle cx="50" cy="50" r={r} fill="none" stroke="#2a2a2a" strokeWidth="7" />
            <circle
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke="#d4845a"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - progress / 100)}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 100ms linear' }}
            />
            <text
                x="50"
                y="56"
                textAnchor="middle"
                fill="#f5f5f5"
                fontSize="20"
                fontWeight="700"
                fontFamily="Archivo, system-ui, sans-serif"
            >
                {Math.round(progress)}%
            </text>
        </svg>
    );
};

/** One step in the milestone rail */
const Milestone: React.FC<{ label: string; done: boolean; last?: boolean }> = ({ label, done, last }) => (
    <div className="flex items-start gap-3">
        <div className="flex flex-col items-center">
            <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                    done
                        ? 'border-[#2d8f5e] bg-[#2d8f5e] text-white'
                        : 'border-[var(--dv-border-light,#2a2a2a)] text-[#8f8f8f]'
                }`}
            >
                {done ? <Check size={14} /> : ''}
            </span>
            {!last && <span className={`w-px flex-1 min-h-[26px] ${done ? 'bg-[#2d8f5e]' : 'bg-[#2a2a2a]'}`} />}
        </div>
        <span className={`pt-1 text-sm ${done ? 'text-[#f5f5f5]' : 'text-[#8f8f8f]'}`}>{label}</span>
    </div>
);

/** A single CNIC side picker with preview */
const CnicSlot: React.FC<{
    label: string;
    file: File | null;
    existingUrl?: string | null;
    onPick: (f: File | null) => void;
}> = ({ label, file, existingUrl, onPick }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const preview = file ? URL.createObjectURL(file) : existingUrl ? resolveAssetUrl(existingUrl) : null;

    return (
        <div className="flex-1">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8f8f8f]">{label}</p>
            <div
                onClick={() => inputRef.current?.click()}
                className="relative flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#2a2a2a] bg-[#0a0a0a] hover:border-[#d4845a] transition-colors"
            >
                {preview ? (
                    <>
                        <img src={preview} alt={label} className="h-full w-full object-cover" />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPick(null);
                            }}
                            className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
                            aria-label={`Remove ${label}`}
                        >
                            <X size={13} />
                        </button>
                    </>
                ) : (
                    <span className="flex flex-col items-center gap-2 text-[#8f8f8f]">
                        <Upload size={20} />
                        <span className="text-xs">Click to upload</span>
                    </span>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            />
        </div>
    );
};

const VerificationPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [status, setStatus] = useState<VerificationStatus | null>(null);
    const [loading, setLoading] = useState(true);

    // Email simulation state
    const [emailDialog, setEmailDialog] = useState(false);
    const [emailRunning, setEmailRunning] = useState(false);
    const [emailProgress, setEmailProgress] = useState(0);

    // CNIC state
    const [front, setFront] = useState<File | null>(null);
    const [back, setBack] = useState<File | null>(null);
    const [cnicNumber, setCnicNumber] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        try {
            const s = await verificationService.getStatus();
            setStatus(s);
            if (s.cnicNumber) setCnicNumber(s.cnicNumber);
        } catch {
            toast.error('Could not load verification status.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    /** User clicked OK on the dialog → run the 5s progress, then confirm. */
    const runEmailSimulation = () => {
        setEmailDialog(false);
        setEmailRunning(true);
        setEmailProgress(0);

        const start = performance.now();
        const tick = (t: number) => {
            const p = Math.min(100, ((t - start) / EMAIL_SIM_MS) * 100);
            setEmailProgress(p);
            if (p < 100) {
                requestAnimationFrame(tick);
            } else {
                verificationService
                    .confirmEmail()
                    .then(() => {
                        toast.success('Email verified');
                        return load();
                    })
                    .catch(() => toast.error('Could not verify email. Please try again.'))
                    .finally(() => setEmailRunning(false));
            }
        };
        requestAnimationFrame(tick);
    };

    const submitCnic = async () => {
        if (!front || !back) {
            toast.error('Please upload both the front and back of your CNIC.');
            return;
        }
        setSubmitting(true);
        try {
            await verificationService.uploadCnic(front, back, cnicNumber.trim() || undefined);
            toast.success('CNIC submitted — identity verified');
            setFront(null);
            setBack(null);
            await load();
        } catch {
            toast.error('Could not submit your CNIC. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="dv-app flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#d4845a]" />
            </div>
        );
    }

    const emailDone = !!status?.emailVerified;
    const cnicDone = !!status?.cnicVerified;
    const allDone = emailDone && cnicDone;

    return (
        <div className="dv-app min-h-screen">
            <div className="mx-auto max-w-5xl px-6 py-12">
                {/* Header */}
                <div className="mb-10">
                    <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#d4845a]">Verification</p>
                    <h1 className="mt-2 text-4xl font-bold text-[#f5f5f5]">Get verified</h1>
                    <p className="mt-2 max-w-xl text-[#c0c0c0]">
                        Domavi is built on trust. Verify your email and CNIC to list a property or send a booking
                        request.
                    </p>
                </div>

                {allDone && (
                    <div className="mb-8 flex items-center gap-3 rounded-xl border border-[#1d5a3b] bg-[#1d5a3b]/20 px-5 py-4">
                        <ShieldCheck className="h-5 w-5 text-[#3ab87e]" />
                        <div>
                            <p className="font-semibold text-[#f5f5f5]">You&apos;re fully verified</p>
                            <p className="text-sm text-[#8f8f8f]">You can now list properties and book homes.</p>
                        </div>
                        <button
                            onClick={() => navigate('/browse')}
                            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#d4845a] px-4 py-2 text-sm font-semibold text-[#1a0e07] hover:bg-[#e89a6c]"
                        >
                            Browse homes <ArrowRight size={14} />
                        </button>
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
                    {/* Milestones */}
                    <aside className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8f8f8f]">
                                Progress
                            </span>
                            <span className="font-bold text-[#d4845a]">{status?.progress ?? 0}%</span>
                        </div>
                        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-[#2a2a2a]">
                            <div
                                className="h-full rounded-full bg-[#d4845a] transition-all duration-500"
                                style={{ width: `${status?.progress ?? 0}%` }}
                            />
                        </div>
                        <div className="space-y-0">
                            {(status?.milestones ?? []).map((m, i, arr) => (
                                <Milestone key={m.key} label={m.label} done={m.done} last={i === arr.length - 1} />
                            ))}
                        </div>
                    </aside>

                    <div className="space-y-6">
                        {/* ── Email ── */}
                        <section className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-6">
                            <div className="flex items-start gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#2a2a2a]">
                                    <Mail className="h-5 w-5 text-[#d4845a]" />
                                </span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-bold text-[#f5f5f5]">Email address</h2>
                                        {emailDone && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-[#1d5a3b]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#3ab87e]">
                                                <Check size={11} /> Verified
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-[#8f8f8f]">{user?.email}</p>

                                    {!emailDone && !emailRunning && (
                                        <button
                                            onClick={() => setEmailDialog(true)}
                                            className="mt-4 rounded-lg bg-[#d4845a] px-4 py-2 text-sm font-semibold text-[#1a0e07] hover:bg-[#e89a6c]"
                                        >
                                            Verify email
                                        </button>
                                    )}

                                    {emailRunning && (
                                        <div className="mt-5 text-center">
                                            <CircularProgress progress={emailProgress} />
                                            <p className="mt-2 text-sm text-[#c0c0c0]">Verifying your email…</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* ── CNIC ── */}
                        <section className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-6">
                            <div className="flex items-start gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#2a2a2a]">
                                    <IdCard className="h-5 w-5 text-[#d4845a]" />
                                </span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-bold text-[#f5f5f5]">CNIC</h2>
                                        {cnicDone && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-[#1d5a3b]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#3ab87e]">
                                                <Check size={11} /> Verified
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-[#8f8f8f]">
                                        Upload clear photos of the front and back of your CNIC.
                                    </p>

                                    <div className="mt-4">
                                        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-[#8f8f8f]">
                                            CNIC number (optional)
                                        </label>
                                        <input
                                            value={cnicNumber}
                                            onChange={(e) => setCnicNumber(e.target.value)}
                                            placeholder="35202-1234567-1"
                                            className="w-full max-w-xs rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f5f5f5] placeholder-[#6a6a6a] focus:border-[#d4845a] focus:outline-none"
                                        />
                                    </div>

                                    <div className="mt-5 flex flex-col gap-4 sm:flex-row">
                                        <CnicSlot
                                            label="CNIC front"
                                            file={front}
                                            existingUrl={status?.cnic.front?.url}
                                            onPick={setFront}
                                        />
                                        <CnicSlot
                                            label="CNIC back"
                                            file={back}
                                            existingUrl={status?.cnic.back?.url}
                                            onPick={setBack}
                                        />
                                    </div>

                                    <button
                                        onClick={submitCnic}
                                        disabled={submitting || !front || !back}
                                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#d4845a] px-4 py-2 text-sm font-semibold text-[#1a0e07] hover:bg-[#e89a6c] disabled:opacity-50"
                                    >
                                        {submitting && <Loader2 size={14} className="animate-spin" />}
                                        {cnicDone ? 'Re-submit CNIC' : 'Submit CNIC'}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Email confirmation dialog */}
            {emailDialog && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#141414] p-7 text-center">
                        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#d4845a]/15">
                            <Mail className="h-6 w-6 text-[#d4845a]" />
                        </span>
                        <h3 className="text-xl font-bold text-[#f5f5f5]">Verify your email</h3>
                        <p className="mt-2 text-sm text-[#c0c0c0]">
                            We&apos;ll confirm <span className="text-[#f5f5f5]">{user?.email}</span> as your verified
                            email address. Click OK to continue.
                        </p>
                        <div className="mt-6 flex justify-center gap-3">
                            <button
                                onClick={() => setEmailDialog(false)}
                                className="rounded-lg border border-[#2a2a2a] px-5 py-2 text-sm font-semibold text-[#c0c0c0] hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={runEmailSimulation}
                                className="rounded-lg bg-[#d4845a] px-6 py-2 text-sm font-semibold text-[#1a0e07] hover:bg-[#e89a6c]"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerificationPage;
