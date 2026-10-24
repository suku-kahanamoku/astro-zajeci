# Astro Zaječí

- Kompletní převod `../../nuxt/zajeci` do Astro + React. Zachovej původní grafiku, fotografie, barvy, typografii, obsah, cs/en trasy a URL detailů `name--$id`. Rozsah migrace je v `src/config/migration.json`.
- Kanonický origin je vždy `https://www.vinozezajeci.cz`. `FRONTEND_HOST` slouží pouze k důvěryhodnému výběru PHP tenantu.
- PHP backend je `../../php/php-core`, nikoli PHP IS. Komunikace jde výhradně přes `src/server/php.ts`; veřejné API používá uzavřený registr operací. Klíče a Bearer zůstávají na serveru. PHP rozhoduje o cenách, datech a oprávněních.
- Stránky patří do `src/pages`. CoreModule obsahuje společné typy a klienta; LangModule slovníky; UIModule sdílené formuláře/dialogy; AuthModule přihlášení; ShopModule katalog a pokladnu; AdminModule konfigurované CRUD a správu souborů.
- JSON konfigurace jsou přenesené beze změny z Nuxtu. Runtime adaptéry opravují rozdíly vůči skutečným PHP routám. Ověřuj zdroj backendu, nevymýšlej endpointy.
- Nikdy neodesílej testovací objednávky, e-maily či uploady na skutečný backend. Browserové testy mají vlastní PHP mock. Produkční ověření a OAuth vyžadují samostatné skutečné integrační ověření.
- Astro vždy používá port 4321 s strictPort. Nezastavuj cizí server. Testy zde používají explicitní loopback IP 127.0.0.3 na stejném portu; při konfliktu musí skončit chybou.
- Ověření: `npm test`, `npm run check`, `npm run build`, `npm run format:check`, `npm run test:browser`. Build a browserové testy běží postupně kvůli Vite cache.
- Použij cílený Graphify dotaz, pokud existuje mapa; ověř nálezy ve zdroji. Po změnách spusť `graphify update .`. Původní Nuxt a jiné projekty nech beze změn.
