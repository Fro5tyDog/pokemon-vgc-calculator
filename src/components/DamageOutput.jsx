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
    <div style={{ padding: '6px 0', fontSize: '14px' }}>
      {summaryLine && <div>{summaryLine}</div>}
      {rolls && rolls.length > 0 && (
        <div style={{ marginTop: '4px', fontSize: '13px', color: '#666', fontFamily: 'monospace' }}>
          ({rolls.join(', ')})
        </div>
      )}
    </div>
  );
}
