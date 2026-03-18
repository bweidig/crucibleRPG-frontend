import { useState } from 'react';
import styles from './PanelSection.module.css';

export default function PanelSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.section}>
      <button className={styles.header} onClick={() => setOpen(!open)}>
        <span className={styles.title}>{title}</span>
        <span className={`${styles.arrow} ${open ? styles.arrowOpen : ''}`}>{'\u25BC'}</span>
      </button>
      {open && <div className={styles.content}>{children}</div>}
    </div>
  );
}
