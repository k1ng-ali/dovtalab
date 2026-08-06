// Скрипт для получения SVG путей из Iconify API
// Запуск: node fetch_icons.mjs

const icons = [
  'line-md:star-twotone',
  'tabler:brain',
  'solar:fire-bold-duotone',
  'typcn:flash-outline',
  'ri:target-fill',
  'hugeicons:crown',
  'mingcute:medal-line',
  'tabler:diamond',
];

for (const icon of icons) {
  const [prefix, name] = icon.split(':');
  const url = `https://api.iconify.design/${prefix}/${name}.svg?color=%23ffffff`;
  try {
    const res = await fetch(url);
    const svg = await res.text();
    // Убираем <svg> обёртку, оставляем только внутреннее содержимое
    const inner = svg.replace(/<svg[^>]*>/, '').replace('</svg>', '').trim();
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    const vb = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
    console.log(`\n// ${icon} (viewBox="${vb}")`);
    console.log(`svg: \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>\`,`);
  } catch (e) {
    console.error(`Error fetching ${icon}:`, e.message);
  }
}
