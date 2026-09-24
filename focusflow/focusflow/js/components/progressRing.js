function ProgressRing({ progress, target, color, size = 88, stroke = 8 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(progress / target, 1);
  const offset = circumference * (1 - pct);
  const center = size / 2;

  return `
    <div class="progress-ring">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle class="progress-ring__track" cx="${center}" cy="${center}" r="${radius}" stroke-width="${stroke}" />
        <circle
          class="progress-ring__fill"
          cx="${center}" cy="${center}" r="${radius}"
          stroke="${color}" stroke-width="${stroke}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}"
        />
        <text x="${center}" y="${center + 5}" text-anchor="middle" class="progress-ring__value" transform="rotate(90 ${center} ${center})">
          ${progress}/${target}
        </text>
      </svg>
    </div>
  `;
}
