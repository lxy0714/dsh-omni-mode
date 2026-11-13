// Original from-scratch artwork / 原创代码绘制；no imported art or fonts / 无外部美术或字体副本。
export function renderFrame({width:w,height:h,progress:t,background}){
 const rise=Math.round(126*t),x=38+Math.round((w-100)*t);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
 <rect width="${w}" height="${h}" fill="${background}"/>
 <circle cx="${w-40}" cy="35" r="70" fill="#213456"/>
 <text x="28" y="46" font-family="Noto Sans CJK SC" font-size="26" font-weight="700" fill="#ffffff">代码，让创意动起来</text>
 <text x="28" y="76" font-family="Noto Sans CJK SC" font-size="14" fill="#b6c7df">原创二维动画 · 可编辑 · 可复现</text>
 <line x1="38" y1="232" x2="${w-28}" y2="232" stroke="#526680" stroke-width="2"/>
 <rect x="70" y="${220-rise*.45}" width="70" height="${12+rise*.45}" rx="8" fill="#57d6c5"/>
 <rect x="185" y="${220-rise*.72}" width="70" height="${12+rise*.72}" rx="8" fill="#91acf5"/>
 <rect x="300" y="${220-rise}" width="70" height="${12+rise}" rx="8" fill="#f6be61"/>
 <text x="82" y="258" font-family="Noto Sans CJK SC" font-size="17" fill="#ffffff">构思</text>
 <text x="197" y="258" font-family="Noto Sans CJK SC" font-size="17" fill="#ffffff">绘制</text>
 <text x="312" y="258" font-family="Noto Sans CJK SC" font-size="17" fill="#ffffff">验证</text>
 <circle cx="${x}" cy="288" r="6" fill="#57d6c5"/>
 <text x="28" y="326" font-family="Noto Sans CJK SC" font-size="13" fill="#b6c7df">示意数据 / Illustrative values · ${Math.round(t*100)}%</text>
 </svg>`;
}
