import PanelSection from './PanelSection';
import styles from './MapTab.module.css';
import sidebarStyles from './Sidebar.module.css';

export default function MapTab({ data, onEntityClick }) {
  if (!data) {
    return <div className={sidebarStyles.loadingState}>Loading map...</div>;
  }

  const locations = Array.isArray(data.locations) ? data.locations : [];
  const routes = Array.isArray(data.routes) ? data.routes : [];

  // Build a name lookup for route display
  const nameById = {};
  locations.forEach(loc => { nameById[loc.id] = loc.name; });

  if (locations.length === 0) {
    return <div className={sidebarStyles.emptyState}>No locations discovered yet.</div>;
  }

  // Sort: current location first, then alphabetical
  const sorted = [...locations].sort((a, b) => {
    if (a.status === 'current') return -1;
    if (b.status === 'current') return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div>
      {data.label && <div className={styles.regionLabel}>{data.label}</div>}

      <PanelSection title="Locations">
        <ul className={styles.locationList}>
          {sorted.map(loc => {
            const isCurrent = loc.status === 'current';
            const isDiscovered = loc.status === 'discovered';
            const dotClass = isCurrent
              ? styles.locationDotCurrent
              : isDiscovered
                ? styles.locationDotDiscovered
                : styles.locationDotOther;

            return (
              <li key={loc.id} className={styles.locationItem} onClick={() => onEntityClick?.({ term: loc.name, type: 'location', id: loc.id })} style={{ cursor: 'pointer' }}>
                <div className={`${styles.locationDot} ${dotClass}`} />
                <div className={styles.locationInfo}>
                  <div className={`${styles.locationName} ${isCurrent ? styles.locationNameCurrent : styles.locationNameOther}`}>
                    {loc.name}
                    {isCurrent && ' (here)'}
                  </div>
                  <div className={styles.locationMeta}>
                    <span className={styles.locationType}>{loc.type}</span>
                    {loc.controllingFaction && (
                      <span className={styles.locationFaction}>{loc.controllingFaction}</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </PanelSection>

      {routes.length > 0 && (
        <PanelSection title="Routes" defaultOpen={false}>
          {routes.filter(r => r.known !== false).map(route => (
            <div key={route.id} className={styles.routeItem}>
              <span>{nameById[route.origin] || `#${route.origin}`}</span>
              <span className={styles.routeArrow}>{'\u2192'}</span>
              <span>{nameById[route.destination] || `#${route.destination}`}</span>
              <span className={styles.routeTerrain}>{route.terrain}</span>
              <span className={styles.routeDays}>
                {route.travelDays} {route.travelDays === 1 ? 'day' : 'days'}
              </span>
            </div>
          ))}
        </PanelSection>
      )}
    </div>
  );
}
