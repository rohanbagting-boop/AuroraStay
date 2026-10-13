import React from 'react';

export function Logo({ compact = false }) {
  return (
    <span className="logoMarkWrap" aria-label="Aurora Stay">
      <span className="logoMark">
        <span />
      </span>
      {!compact && (
        <span className="logoText">
          <strong>Aurora Stay</strong>
          <small>Hotel Reservations</small>
        </span>
      )}
    </span>
  );
}

