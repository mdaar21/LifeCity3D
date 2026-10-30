import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, LoaderCircle, Sprout, X } from 'lucide-react';
import { useLocale } from '../lib/locale';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean };
export function Button({ variant = 'primary', loading, className = '', children, disabled, ...props }: ButtonProps) {
  return <button className={`button button-${variant} ${className}`} disabled={disabled || loading} {...props}>{loading && <LoaderCircle size={18} className="spin" aria-hidden="true" />}{children}</button>;
}
export function SectionTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="section-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="section-description">{description}</p>}</div>{action && <div className="section-action">{action}</div>}</header>;
}
export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'success' | 'warning' | 'danger'; title?: string; children: ReactNode }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'info' ? Info : AlertCircle;
  return <div className={`notice notice-${tone}`} role={tone === 'danger' ? 'alert' : 'status'}><Icon size={19} aria-hidden="true" /><div>{title && <strong>{title}</strong>}<div>{children}</div></div></div>;
}
export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon">{icon || <Sprout size={28} />}</span><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>;
}
export function LoadingState({ label }: { label?: string }) {
  const { t } = useLocale();
  return <div className="loading-state" role="status"><LoaderCircle className="spin" size={26} /><span>{label || t('نجهّز مدينتك…', 'Preparing your city…')}</span></div>;
}
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const { t } = useLocale();
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const elements = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || []);
    (elements()[0] || ref.current)?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const list = elements();
      const first = list[0]; const last = list[list.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', key); previous?.focus(); };
  }, [open]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby={id} ref={ref} tabIndex={-1}><header className="modal-header"><h2 id={id}>{title}</h2><button className="icon-button" aria-label={t('إغلاق', 'Close')} onClick={onClose}><X size={21} /></button></header>{children}</div></div>;
}
