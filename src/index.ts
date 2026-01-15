function generateSvg(data: {
  userId: string;
  icon: string;
  posts: number;
  likes: number;
  stocks: number;
  followers: number;
  theme: string;
}) {
  const dark = data.theme === "dark";

  const bg = dark ? "#020617" : "#ffffff";
  const fg = dark ? "#e5e7eb" : "#020617";
  const sub = dark ? "#94a3b8" : "#475569";

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="160">
  <style>
    .title { font: 700 16px system-ui; fill: ${fg}; }
    .label { font: 12px system-ui; fill: ${sub}; }
    .value { font: 700 14px system-ui; fill: ${fg}; }
  </style>

  <defs>
    <clipPath id="avatar" clipPathUnits="userSpaceOnUse">
      <circle cx="44" cy="44" r="24" />
    </clipPath>
  </defs>

  <rect width="100%" height="100%" rx="12" fill="${bg}" />

  <image
    href="${data.icon}"
    x="20"
    y="20"
    width="48"
    height="48"
    clip-path="url(#avatar)"
  />

  <text x="80" y="40" class="title">${escapeXml(data.userId)}</text>
  <text x="80" y="58" class="label">Qiita Activity</text>

  <g transform="translate(20,96)">
    <text class="label" y="0">Posts</text>
    <text class="value" y="20">${data.posts}</text>
  </g>

  <g transform="translate(120,96)">
    <text class="label" y="0">LGTM</text>
    <text class="value" y="20">${data.likes}</text>
  </g>

  <g transform="translate(220,96)">
    <text class="label" y="0">Stocks</text>
    <text class="value" y="20">${data.stocks}</text>
  </g>

  <g transform="translate(320,96)">
    <text class="label" y="0">Followers</text>
    <text class="value" y="20">${data.followers}</text>
  </g>
</svg>
`;
}
