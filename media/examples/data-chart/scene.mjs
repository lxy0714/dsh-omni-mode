// Cross-domain example: numbers from capabilities/runner.mjs (game.balance),
// drawn entirely in code. No image/video generation model is involved.
// 跨领域示例：数值由 capabilities/runner.mjs 的 game.balance 计算，完全用代码绘制。
// Synthetic example data / 合成示例数据.
const DATA = {
  "units": [
    {
      "id": "scout",
      "dps": 3,
      "efficiency": 1
    },
    {
      "id": "knight",
      "dps": 5.833333333333334,
      "efficiency": 1.1666666666666667
    },
    {
      "id": "mage",
      "dps": 6,
      "efficiency": 1
    }
  ],
  "efficiencyRatio": 1.1666666666666667
};
export function renderFrame({width,height,background,progress}) {
  const rows = DATA.units;
  const maxDps = Math.max(...rows.map(r => r.dps));
  const colors = ["#2ee6c5","#8fa8ff","#ffc766"];
  const bars = rows.map((r,i) => {
    const grow = Math.max(0, Math.min(1, progress*1.6 - i*0.12));
    const w = (r.dps/maxDps)*320*grow;
    return `<rect x="160" y="${110+i*58}" width="${w.toFixed(1)}" height="34" rx="6" fill="${colors[i%3]}"/>
    <text x="30" y="${134+i*58}" font-family="Noto Sans CJK SC" font-size="17" fill="#dfe9f7">${r.id}</text>
    <text x="${(160+w+10).toFixed(1)}" y="${134+i*58}" font-family="Noto Sans CJK SC" font-size="15" fill="#cfe0f2">${r.dps.toFixed(2)}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${background}"/>
  <text x="30" y="60" font-family="Noto Sans CJK SC" font-size="26" font-weight="700" fill="#ffffff">单位输出对比</text>
  <text x="30" y="88" font-family="Noto Sans CJK SC" font-size="14" fill="#9fb3cc">本地平衡计算 · 效率比 ${DATA.efficiencyRatio.toFixed(3)} · ${Math.round(progress*100)}%</text>
  ${bars}
  <text x="30" y="${height-24}" font-family="Noto Sans CJK SC" font-size="13" fill="#7d92ad">合成示例数据 / Synthetic example · 由代码绘制</text>
  </svg>`;
}
