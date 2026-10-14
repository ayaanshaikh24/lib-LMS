import React from 'react';

/**
 * Nexora geometric N monogram integrated with an open-book icon.
 * Styled with deep navy container (#0B1026), electric blue ribbon (#2563EB),
 * and subtle layered page details.
 */
export const NexoraLogo = ({ size = 36, rounded = true, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Nexora Logo"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {/* Deep Navy Squircle Background */}
        <linearGradient id="nexoraCompBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0E132B" />
          <stop offset="100%" stopColor="#050713" />
        </linearGradient>

        {/* Electric Blue Diagonal Ribbon */}
        <linearGradient id="nexoraCompBlue" x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="25%" stopColor="#2563EB" />
          <stop offset="70%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>

        {/* Left Book Upper Page */}
        <linearGradient id="nexoraCompPageTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#BFDBFE" />
        </linearGradient>

        {/* Middle Page Arc */}
        <linearGradient id="nexoraCompPageMid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="60%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>

        {/* Bottom Page Arc */}
        <linearGradient id="nexoraCompPageBot" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="60%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>

        {/* Right Upright Stem */}
        <linearGradient id="nexoraCompRight" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="20%" stopColor="#DBEAFE" />
          <stop offset="65%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>

      {/* Deep Navy Background Container */}
      <rect width="512" height="512" rx={rounded ? 114 : 0} fill="url(#nexoraCompBg)" />

      {/* 1. Left Wing: Upper Book Page */}
      <path
        d="M 125 135 L 174 135 C 174 135 186 195 204 260 C 212 288 217 312 217 326 C 188 304 156 294 125 292 Z"
        fill="url(#nexoraCompPageTop)"
      />

      {/* 2. Left Wing: Middle Fanned Page Leaf */}
      <path
        d="M 125 306 C 156 308 188 318 218 338 C 217 350 214 360 211 366 C 184 348 154 338 125 336 Z"
        fill="url(#nexoraCompPageMid)"
      />

      {/* 3. Left Wing: Bottom Fanned Page Leaf */}
      <path
        d="M 125 350 C 154 352 186 362 214 378 C 222 384 225 389 226 391 C 221 391 216 388 210 384 C 182 368 152 362 125 362 Z"
        fill="url(#nexoraCompPageBot)"
      />

      {/* 4. Right Wing: Upright Stem */}
      <path
        d="M 315 135 L 387 135 L 387 356 C 387 356 382 364 374 354 C 358 334 338 276 320 220 L 315 196 Z"
        fill="url(#nexoraCompRight)"
      />

      {/* 5. Electric Blue Diagonal Ribbon */}
      <path
        d="M 144 135 C 174 135 204 135 218 141 C 226 145 232 153 238 165 L 381 346 C 388 355 388 366 381 373 C 374 380 358 384 342 384 C 324 384 312 377 302 365 L 156 186 C 147 174 142 162 142 150 C 142 140 143 135 144 135 Z"
        fill="url(#nexoraCompBlue)"
      />
    </svg>
  );
};

export default NexoraLogo;
