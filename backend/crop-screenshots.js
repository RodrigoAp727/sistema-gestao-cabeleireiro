// Script para recortar espaço em branco das screenshots
// Usa apenas módulos nativos do Node.js (sem dependências)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const screenshotsDir = path.join(__dirname, '..', 'docs', 'screenshots');

// Usar Playwright para retomar screenshots com clip exato baseado no conteúdo
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });

  const pages = [
    { name: 'Dashboard', btnText: 'Dashboard', file: '01-dashboard.png' },
    { name: 'Agenda', btnText: 'Agenda', file: '02-agenda.png' },
    { name: 'Clientes', btnText: 'Clientes', file: '03-clientes.png' },
    { name: 'Estoque', btnText: 'Estoque', file: '04-estoque.png' },
    { name: 'Relatórios', btnText: 'Relatórios', file: '05-relatorios.png' },
    { name: 'Equipe', btnText: 'Equipe', file: '06-equipe.png' },
  ];

  for (const p of pages) {
    // Navegar para a página
    await page.evaluate((btnText) => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.trim().includes(btnText));
      if (btn) btn.click();
    }, p.btnText);

    await page.waitForTimeout(2000);

    // Scrollar para passar o banner
    await page.evaluate(() => window.scrollTo(0, 650));
    await page.waitForTimeout(500);

    // Medir altura real do conteúdo visível
    const { contentBottom, navHeight } = await page.evaluate(() => {
      const main = document.querySelector('main');
      const nav = document.querySelector('nav');
      if (!main) return { contentBottom: 800, navHeight: 0 };

      const mainRect = main.getBoundingClientRect();
      // Conteúdo após o banner (img de capa)
      const bannerImg = main.querySelector('img');
      const contentStart = bannerImg ? bannerImg.getBoundingClientRect().bottom : mainRect.top;

      // Percorrer filhos do main para encontrar o conteúdo real
      const children = Array.from(main.children);
      let lastBottom = contentStart;
      for (const child of children) {
        if (child.tagName === 'IMG') continue; // pular banner
        const rect = child.getBoundingClientRect();
        if (rect.bottom > lastBottom) lastBottom = rect.bottom;
      }

      return {
        contentBottom: Math.min(lastBottom + 30, window.innerHeight),
        navHeight: nav ? nav.getBoundingClientRect().height : 0
      };
    });

    // Ajustar viewport para cortar exatamente no conteúdo
    const clipHeight = Math.max(Math.round(contentBottom), 400);
    await page.setViewportSize({ width: 1400, height: clipHeight });
    await page.waitForTimeout(200);

    const outputPath = path.join(screenshotsDir, p.file);
    await page.screenshot({ path: outputPath, clip: { x: 0, y: 0, width: 1400, height: clipHeight } });

    console.log(`✅ ${p.name} -> ${p.file} (${clipHeight}px)`);

    // Resetar viewport
    await page.setViewportSize({ width: 1400, height: 900 });
  }

  await browser.close();
  console.log('\n🎉 Todas as screenshots recortadas com sucesso!');
})();
