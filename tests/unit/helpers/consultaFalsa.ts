/**
 * Doble de prueba del cliente de Supabase para la tabla "profesionales".
 * Evalúa en memoria el subconjunto de PostgREST que usa el buscador, con su
 * semántica real para relaciones:
 *  - Un filtro "relacion.columna" sobre un embed declarado con `!inner` deja
 *    solo los profesionales que tienen AL MENOS una fila que cumple el filtro,
 *    y devuelve cada profesional UNA sola vez.
 *  - Si el embed NO es `!inner`, PostgREST no filtra profesionales (solo las
 *    filas embebidas). Así, si el código olvida `!inner`, las pruebas fallan.
 * No hace llamadas de red.
 */
import type { ProfesionalPrueba } from './fixtures';

type Fila = ProfesionalPrueba;
type Filtro = (p: Fila) => boolean;
type Relacion = 'profesional_motivos' | 'profesional_coberturas';

export interface OpcionesConsultaFalsa {
  /** Simula un error de Supabase/red. */
  error?: { message: string; code?: string };
  /** Simula que la API devolvió filas repetidas (para probar la deduplicación defensiva). */
  duplicarFilas?: boolean;
  /** Simula data: null sin error. */
  dataNull?: boolean;
}

export class ConsultaFalsa {
  readonly llamadas: string[] = [];
  private filtros: Filtro[] = [];
  private filtrosRelacion: { rel: Relacion; col: string; valor: string }[] = [];
  private ordenes: { col: keyof Fila; asc: boolean; nullsFirst: boolean }[] = [];
  private inner = new Set<Relacion>();

  constructor(
    private readonly datos: Fila[],
    columnas: string,
    private readonly opciones: OpcionesConsultaFalsa = {},
  ) {
    this.llamadas.push(`select(${columnas})`);
    for (const rel of ['profesional_motivos', 'profesional_coberturas'] as const) {
      if (columnas.includes(`${rel}!inner(`)) this.inner.add(rel);
    }
  }

  eq(column: string, value: string): this {
    this.llamadas.push(`eq(${column},${value})`);
    const [rel, col] = column.split('.');
    if (col) this.filtrosRelacion.push({ rel: rel as Relacion, col, valor: value });
    else this.filtros.push((p) => String((p as unknown as Record<string, unknown>)[column]) === value);
    return this;
  }

  in(column: string, values: readonly string[]): this {
    this.llamadas.push(`in(${column},${values.join('|')})`);
    this.filtros.push((p) => values.includes(String((p as unknown as Record<string, unknown>)[column])));
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.llamadas.push(`ilike(${column},${pattern})`);
    const needle = pattern.replace(/^%|%$/g, '').toLowerCase();
    this.filtros.push((p) => String((p as unknown as Record<string, unknown>)[column] ?? '').toLowerCase().includes(needle));
    return this;
  }

  order(column: string, options: { ascending?: boolean; nullsFirst?: boolean } = {}): this {
    this.llamadas.push(`order(${column},${options.ascending === false ? 'desc' : 'asc'})`);
    this.ordenes.push({ col: column as keyof Fila, asc: options.ascending !== false, nullsFirst: options.nullsFirst ?? options.ascending === false });
    return this;
  }

  async limit(n: number): Promise<{ data: unknown[] | null; error: { message: string; code?: string } | null }> {
    this.llamadas.push(`limit(${n})`);
    if (this.opciones.error) return { data: null, error: this.opciones.error };
    if (this.opciones.dataNull) return { data: null, error: null };

    let filas = this.datos.filter((p) => this.filtros.every((f) => f(p)));
    for (const rel of this.inner) {
      const condiciones = this.filtrosRelacion.filter((f) => f.rel === rel);
      filas = filas.filter((p) =>
        (p[rel] as Record<string, string>[]).some((fila) => condiciones.every((c) => fila[c.col] === c.valor)),
      );
    }
    filas = [...filas].sort((a, b) => {
      for (const o of this.ordenes) {
        const va = a[o.col] as unknown;
        const vb = b[o.col] as unknown;
        if (va === vb) continue;
        if (va === null) return o.nullsFirst ? -1 : 1;
        if (vb === null) return o.nullsFirst ? 1 : -1;
        const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es');
        return o.asc ? cmp : -cmp;
      }
      return 0;
    });
    const salida = filas.slice(0, n);
    return { data: this.opciones.duplicarFilas ? [...salida, ...salida] : salida, error: null };
  }
}

/** Cliente falso con la forma mínima que usa searchProfesionales: from(tabla).select(columnas). */
export function clienteFalso(datos: Fila[], opciones: OpcionesConsultaFalsa = {}) {
  const consultas: ConsultaFalsa[] = [];
  const cliente = {
    from(tabla: string) {
      if (tabla !== 'profesionales') throw new Error(`Tabla no soportada en la prueba: ${tabla}`);
      return {
        select(columnas: string) {
          const q = new ConsultaFalsa(datos, columnas, opciones);
          consultas.push(q);
          return q;
        },
      };
    },
  };
  return { cliente, consultas };
}
