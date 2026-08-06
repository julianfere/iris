/**
 * Placeholder de las grillas mientras el server responde.
 *
 * Sin esto la app se quedaba congelada en la pantalla anterior: las paginas
 * son force-dynamic y no habia un solo loading.tsx, asi que tocar "Personas"
 * no producia ninguna senal hasta que llegaba el HTML entero. En movil se
 * leia como que la app se colgo, y el usuario volvia a tocar.
 */
export default function GridSkeleton({ count = 9, aspect = 1.4 }: { count?: number; aspect?: number }) {
  // Alturas fijas y ciclicas: con valores aleatorios el HTML del server y el
  // del cliente no coincidirian.
  const RATIOS = [1.5, 0.75, 1.2, 1.6, 0.8, 1.33]

  return (
    <div className="masonry" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="skeleton-block"
          style={{ aspectRatio: String(RATIOS[i % RATIOS.length] * (aspect / 1.4)) }}
        />
      ))}
    </div>
  )
}
