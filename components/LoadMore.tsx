import Link from 'next/link'

/**
 * `scroll={false}` para que agregar fotos no te devuelva arriba de todo:
 * la vista crece donde estabas.
 */
export default function LoadMore({ href, shown }: { href: string; shown: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '28px 0 8px' }}>
      <Link
        href={href}
        scroll={false}
        prefetch={false}
        style={{
          padding: '11px 22px', borderRadius: 10,
          background: 'var(--s1)', border: '1px solid var(--line)',
          color: 'var(--txt)', fontSize: 14, textDecoration: 'none',
        }}
      >
        Cargar más
      </Link>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dim)' }}>
        {shown} mostradas
      </span>
    </div>
  )
}
