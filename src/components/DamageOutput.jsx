import React from 'react';

/**
 * Minimal, text-first result line — mirrors the reference calculator's
 * style instead of a big graphical card: one summary sentence, and the
 * 16 individual damage rolls in parentheses underneath.
 */
export default function DamageOutput({ result, summaryLine }) {
  if (!result) {
    return null;
  }

  const { rolls } = result;

  return (
    <div style={{ padding: '2px 0', fontSize: '0.95em' }}>
      {summaryLine && <div>{summaryLine}</div>}
      {rolls && rolls.length > 0 && (
        <div style={{ marginTop: '2px', fontSize: '0.9em', color: '#666', fontFamily: 'monospace' }}>
          ({rolls.join(', ')})
        </div>
      )}
    </div>
  );
}
