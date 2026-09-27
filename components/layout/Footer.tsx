import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid w-full max-w-[1100px] gap-8 px-5 py-10 sm:px-7 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-[13px] leading-relaxed text-muted">
            Clínica Interdisciplinaria Virtual. ClinVi solo coordina el turno: no interviene en la atención clínica ni en la facturación.
          </p>
        </div>
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Pacientes</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/buscar" className="text-muted hover:text-forest">
                Buscar profesionales
              </Link>
            </li>
            <li>
              <Link href="/#especialidades" className="text-muted hover:text-forest">
                Especialidades
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Profesionales</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/registro" className="text-muted hover:text-forest">
                Registrarme
              </Link>
            </li>
            <li>
              <Link href="/ingresar" className="text-muted hover:text-forest">
                Ingresar
              </Link>
            </li>
            <li>
              <Link href="/panel" className="text-muted hover:text-forest">
                Mi panel
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line-light py-5 text-center text-xs text-muted">© {new Date().getFullYear()} ClinVi</div>
    </footer>
  );
}
