import React from 'react';

export function StatusBadge({ value }) {
  return <span className={`badge ${String(value || '').replaceAll('-', '')}`}>{value}</span>;
}

