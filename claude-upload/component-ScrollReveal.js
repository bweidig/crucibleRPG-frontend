'use client';
import useScrollReveal from '@/hooks/useScrollReveal';

const VARIANTS = {
  fadeUp:     { hidden: 'translateY(30px)',  visible: 'translateY(0)', duration: 0.7 },
  fadeLeft:   { hidden: 'translateX(-20px)', visible: 'translateX(0)', duration: 0.6 },
  fadeOnly:   { hidden: 'none',             visible: 'none',          duration: 0.5 },
  fadeUpSlow: { hidden: 'translateY(40px)',  visible: 'translateY(0)', duration: 1.2 },
};

export default function ScrollReveal({ children, delay = 0, variant = 'fadeUp', style = {}, className = '' }) {
  const [ref, isVisible] = useScrollReveal();
  const v = VARIANTS[variant] || VARIANTS.fadeUp;

  const transformHidden = v.hidden === 'none' ? undefined : v.hidden;
  const transformVisible = v.visible === 'none' ? undefined : v.visible;

  const transitionParts = [`opacity ${v.duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`];
  if (transformHidden) {
    transitionParts.push(`transform ${v.duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`);
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? (transformVisible || undefined) : (transformHidden || undefined),
        transition: transitionParts.join(', '),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
