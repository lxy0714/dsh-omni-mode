// Compose an authorized user-supplied image / 合成用户授权图片；do not synthesize a replacement.
export function renderFrame({width:w,height:h,progress:t,assets}){
 const size=160+32*t,x=(w-size)/2,y=(h-size)/2;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#eaf1f8"/><rect x="16" y="16" width="${w-32}" height="${h-32}" rx="20" fill="#ffffff"/><image href="${assets.hero}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/></svg>`;
}
