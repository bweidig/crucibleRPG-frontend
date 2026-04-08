'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

export default function TestDicePage() {
  const containerRef = useRef(null);
  const boxRef = useRef(null);
  const diceBoxModule = useRef(null);
  const mountedRef = useRef(true);
  const debounceRef = useRef(null);

  const [status, setStatus] = useState('Loading library...');
  const [ready, setReady] = useState(false);

  // Tuning sliders
  const [strength, setStrength] = useState(1);
  const [gravity, setGravity] = useState(400);
  const [diceScale, setDiceScale] = useState(100);
  const [canvasHeight, setCanvasHeight] = useState(250);

  // Info line
  const [containerWidth, setContainerWidth] = useState(0);
  const [screenWidth, setScreenWidth] = useState(0);
  const [dpr, setDpr] = useState(1);

  // Measure container + screen info
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
      setScreenWidth(window.innerWidth);
      setDpr(window.devicePixelRatio);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Initialize DiceBox
  const initBox = useCallback(async (str, grav, scale) => {
    if (!diceBoxModule.current) {
      const mod = await import('@3d-dice/dice-box-threejs');
      diceBoxModule.current = mod.default;
    }
    const DiceBox = diceBoxModule.current;

    // Destroy old instance
    if (boxRef.current) {
      try { boxRef.current.clearDice(); } catch {}
      boxRef.current = null;
    }

    // Clear the container's children so the old canvas is removed
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const box = new DiceBox('#dice-container', {
      assetPath: '/assets/dice-box-threejs/',
      theme_colorset: 'white',
      theme_material: 'glass',
      gravity_multiplier: grav,
      strength: str,
      baseScale: scale,
      onRollComplete: (results) => {
        if (mountedRef.current) setStatus('Roll complete! Result: ' + JSON.stringify(results.map(r => r.value)));
      }
    });

    await box.initialize();
    boxRef.current = box;
    return box;
  }, []);

  // First init on mount
  useEffect(() => {
    mountedRef.current = true;
    initBox(strength, gravity, diceScale).then(() => {
      if (mountedRef.current) {
        setReady(true);
        setStatus('Ready! Tap a button to roll.');
      }
    }).catch(err => {
      if (mountedRef.current) setStatus('Init failed: ' + err.message);
    });
    return () => { mountedRef.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced reinit when physics sliders change
  const handlePhysicsChange = useCallback((newStrength, newGravity, newScale) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setReady(false);
    debounceRef.current = setTimeout(async () => {
      setStatus('Reinitializing...');
      try {
        await initBox(newStrength, newGravity, newScale);
        if (mountedRef.current) {
          setReady(true);
          setStatus('Ready! Tap a button to roll.');
        }
      } catch (err) {
        if (mountedRef.current) setStatus('Reinit failed: ' + err.message);
      }
    }, 500);
  }, [initBox]);

  const onStrengthChange = (v) => { setStrength(v); handlePhysicsChange(v, gravity, diceScale); };
  const onGravityChange = (v) => { setGravity(v); handlePhysicsChange(strength, v, diceScale); };
  const onScaleChange = (v) => { setDiceScale(v); handlePhysicsChange(strength, gravity, v); };

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

  const sliderRow = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 };
  const labelStyle = { fontSize: 14, color: '#8a94a8', minWidth: 90, flexShrink: 0 };
  const valueStyle = { fontSize: 14, color: '#c9a84c', fontFamily: 'monospace', minWidth: 40, textAlign: 'right', flexShrink: 0 };

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', padding: 20, color: '#c9a84c', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>Dice Spike Test</h1>
      <p style={{ fontSize: 14, marginBottom: 16, color: '#8a94a8' }}>{status}</p>

      <div
        id="dice-container"
        ref={containerRef}
        style={{
          width: '100%',
          height: canvasHeight,
          border: '1px solid #3a3328',
          borderRadius: 8,
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      />

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={rollForced}
          disabled={!ready}
          style={{
            padding: '12px 24px', fontSize: 16,
            background: ready ? '#c9a84c' : '#333', color: '#0a0e1a',
            border: 'none', borderRadius: 6, cursor: ready ? 'pointer' : 'default',
          }}
        >
          Roll d20 &rarr; 14
        </button>
        <button
          onClick={rollTwo}
          disabled={!ready}
          style={{
            padding: '12px 24px', fontSize: 16,
            background: ready ? '#c9a84c' : '#333', color: '#0a0e1a',
            border: 'none', borderRadius: 6, cursor: ready ? 'pointer' : 'default',
          }}
        >
          Roll 2d20 &rarr; 7, 18
        </button>
        <button
          onClick={clearDice}
          style={{
            padding: '12px 24px', fontSize: 16,
            background: 'transparent', color: '#c9a84c',
            border: '1px solid #3a3328', borderRadius: 6, cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>

      {/* Tuning panel */}
      <div style={{
        border: '1px solid #3a3328', borderRadius: 8,
        padding: 16, marginTop: 16,
      }}>
        <div style={sliderRow}>
          <span style={labelStyle}>Strength</span>
          <input type="range" min={0.5} max={6} step={0.5} value={strength}
            onChange={e => onStrengthChange(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#c9a84c' }} />
          <span style={valueStyle}>{strength}</span>
        </div>
        <div style={sliderRow}>
          <span style={labelStyle}>Gravity</span>
          <input type="range" min={100} max={800} step={50} value={gravity}
            onChange={e => onGravityChange(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#c9a84c' }} />
          <span style={valueStyle}>{gravity}</span>
        </div>
        <div style={sliderRow}>
          <span style={labelStyle}>Dice Scale</span>
          <input type="range" min={30} max={150} step={5} value={diceScale}
            onChange={e => onScaleChange(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#c9a84c' }} />
          <span style={valueStyle}>{diceScale}</span>
        </div>
        <div style={{ ...sliderRow, marginBottom: 0 }}>
          <span style={labelStyle}>Canvas Height</span>
          <input type="range" min={120} max={350} step={10} value={canvasHeight}
            onChange={e => setCanvasHeight(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#c9a84c' }} />
          <span style={valueStyle}>{canvasHeight}</span>
        </div>
      </div>

      {/* Info line */}
      <div style={{
        fontSize: 13, color: '#5a6a80', fontFamily: 'monospace',
        marginTop: 12, lineHeight: 1.8,
      }}>
        Container width: {containerWidth}px &middot; Screen width: {screenWidth}px &middot; Device pixel ratio: {dpr}
      </div>
    </div>
  );
}
