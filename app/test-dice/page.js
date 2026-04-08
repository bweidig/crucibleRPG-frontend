'use client';
import { useRef, useState, useEffect } from 'react';

export default function TestDicePage() {
  const containerRef = useRef(null);
  const boxRef = useRef(null);
  const [status, setStatus] = useState('Loading library...');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    import('@3d-dice/dice-box-threejs').then(({ default: DiceBox }) => {
      if (!mounted) return;
      const box = new DiceBox('#dice-container', {
        assetPath: '/assets/dice-box-threejs/',
        theme_colorset: 'white',
        theme_material: 'glass',
        gravity_multiplier: 400,
        strength: 1,
        onRollComplete: (results) => {
          if (mounted) setStatus('Roll complete! Result: ' + JSON.stringify(results.map(r => r.value)));
        }
      });
      box.initialize().then(() => {
        if (!mounted) return;
        boxRef.current = box;
        setReady(true);
        setStatus('Ready! Tap the button to roll.');
      }).catch(err => {
        if (mounted) setStatus('Init failed: ' + err.message);
      });
    }).catch(err => {
      if (mounted) setStatus('Import failed: ' + err.message);
    });
    return () => { mounted = false; };
  }, []);

  const rollForced = () => {
    if (!boxRef.current) return;
    setStatus('Rolling...');
    boxRef.current.roll('1d20@14');
  };

  const rollTwo = () => {
    if (!boxRef.current) return;
    setStatus('Rolling two dice...');
    boxRef.current.roll('2d20@7,18');
  };

  const clearDice = () => {
    if (!boxRef.current) return;
    boxRef.current.clearDice();
    setStatus('Cleared. Ready to roll again.');
  };

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: 20, color: '#c9a84c', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>Dice Spike Test</h1>
      <p style={{ fontSize: 14, marginBottom: 16, color: '#8a94a8' }}>{status}</p>

      <div
        id="dice-container"
        ref={containerRef}
        style={{
          width: '100%',
          height: 250,
          maxHeight: '40vh',
          border: '1px solid #3a3328',
          borderRadius: 8,
          marginBottom: 16,
          position: 'relative',
        }}
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={rollForced}
          disabled={!ready}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            background: ready ? '#c9a84c' : '#333',
            color: '#0a0e1a',
            border: 'none',
            borderRadius: 6,
            cursor: ready ? 'pointer' : 'default',
          }}
        >
          Roll d20 &rarr; 14
        </button>
        <button
          onClick={rollTwo}
          disabled={!ready}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            background: ready ? '#c9a84c' : '#333',
            color: '#0a0e1a',
            border: 'none',
            borderRadius: 6,
            cursor: ready ? 'pointer' : 'default',
          }}
        >
          Roll 2d20 &rarr; 7, 18
        </button>
        <button
          onClick={clearDice}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            background: 'transparent',
            color: '#c9a84c',
            border: '1px solid #3a3328',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
