# Víno ze Zaječí — Astro + React

Převod `nuxt/zajeci` se stejnými obrázky, galerií, obsahem, barevnou paletou, fonty Playfair Display/Raleway a PHP backendem `php/php-core`. Přehled 53 původních souborů stránek a jejich 52 jedinečných tras je v `src/config/migration.json`. Původní Nuxt projekt zůstává zachovaný.

## Spuštění

Node.js >= 22.12, npm:

```sh
npm ci
cp .env.example .env
# Vyplnit soukromé hodnoty z prostředí původního webu.
# SESSION_SECRET vygenerovat: openssl rand -base64 48
npm run dev
```

Vývoj běží na `127.0.0.1:4321`, port je pevný. Při obsazení se nepoužije jiný port. Pro souběh s jiným projektem lze explicitně zvolit loopback IP na stejném portu, například `npm run dev -- --host 127.0.0.3`. Astro 7 spuštěné agentem může automaticky přejít na pozadí; řízené testy používají `--ignore-lock` pro běh v popředí.

```sh
npm run build
npm start                  # samostatný Node SSR server, PORT=4321
npm run build:netlify       # alternativní Netlify SSR adaptér
```

Build nepřistupuje k backendu. Data a katalog se načítají za běhu na serveru, veřejný obsah se vrací už v HTML. React hydratuje interaktivní části. Admin sekce se načítají pomocí lazy importů a jejich bundle se nepřidává do přihlašovacího formuláře.

## Prostředí

| Proměnná                                                                 | Účel                                                                                            |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `PHP_API_BASE_URL`                                                       | Stejný php-core API origin a prefix jako v původním Nuxtu                                       |
| `INTERNAL_API_KEY`                                                       | Soukromý klíč shodný s php-core; pouze server                                                   |
| `SESSION_SECRET`                                                         | Alespoň 32 znaků, šifrování HttpOnly relace a OAuth state                                       |
| `FRONTEND_HOST`                                                          | Důvěryhodný hostname pro `X-Forwarded-Host` a PHP tenant; výchozí `https://www.vinozezajeci.cz` |
| `NUXT_MAILING_FROM`, `NUXT_MAILING_FROM_NAME`, `NUXT_MAILING_FROM_PHONE` | Zachované nastavení e-mailů                                                                     |
| `PUBLIC_GTAG_ID`                                                         | Google Analytics ID; podporuje se i původní `NUXT_PUBLIC_GTAG_ID`                               |
| `NUXT_OAUTH_GOOGLE_CLIENT_ID`, `NUXT_OAUTH_GOOGLE_CLIENT_SECRET`         | Google OAuth                                                                                    |
| `NUXT_OAUTH_LINKEDIN_CLIENT_ID`, `NUXT_OAUTH_LINKEDIN_CLIENT_SECRET`     | LinkedIn OAuth                                                                                  |
| `OAUTH_CALLBACK_ORIGIN`                                                  | Volitelný origin callbacků; výchozí origin příchozího požadavku                                 |
| `NUXT_OAUTH_GOOGLE_REDIRECT_URL`, `NUXT_OAUTH_LINKEDIN_REDIRECT_URL`     | Volitelná plná callback URL původního nastavení                                                 |

OAuth callbacky jsou `/api/login/google` a `/api/login/linkedin`; pro nasazení zaregistrovat jejich URL na `https://www.vinozezajeci.cz`. ID token ověřuje podpis, issuer, audience, expiraci a nonce přes `jose`; state je šifrovaný v krátkodobé HttpOnly cookie. Google používá i PKCE. Klíč, klientská tajemství a Bearer se nevracejí do HTML ani browser API. Staré Nuxt přihlašovací cookies se nepřebírají, uživatelé se jednou přihlásí znovu.

`PHP_FILE_ROOT` už frontend nepotřebuje: stejně jako poslední Nuxt proxy soubory načítá přes PHP `/files/content` nebo `/files/temp`, kde se vyhodnocují oprávnění a viditelnost.

## Rozsah a kontrakty

- Úvodní stránka včetně propagačního dialogu, parallaxu, doporučených vín, degustací, kontaktů a mapy.
- SSR katalog a detail vína se stejným formátem URL, fotografiemi, atributy, cenami, množstvím a dialogem vložení do košíku. Katalog zahrnuje stránkování.
- Všech 62 původních fotografií galerie, původní veřejné soubory včetně ověřovacích souborů, favicon a loga; PhotoSwipe lightbox.
- Uložený košík, fakturační a dodací údaje, doprava a platba z PHP číselníků, validace tří kroků, souhrn, vytvoření objednávky, faktura a e-mail. Čte se i původní sedmidenní formát `nuxt-storage` a původní `billing` pole platby.
- Přihlášení heslem/Google/LinkedIn, registrace, zapomenuté heslo, dokončení resetu, profil, změna hesla, odhlášení. Zápisy ověřují origin; role admin se kontroluje na serveru a konkrétní oprávnění dále vyhodnocuje PHP.
- Dashboard, vína, degustace, kategorie, objednávky, faktury, uživatelé, adresy, role, texty, e-mailové šablony, číselníky, dopravy, platby a DPH. JSON konfigurace formulářů a tabulek jsou zachované. Staré Nuxt záložky s JSON pod klíčem syscode se převádějí na stejný kontrakt. Filtry používají JSON `q`, řazení JSON `sort`, stránkování `page/limit`; výběr a mazání vyžadují potvrzení.
- Nahrávání souborů do 20 MB, validace formátu, dočasné uložení, commit, přiřazení k produktu a náhledy. Upload po vytvoření vína je funkční i na create stránce.
- PWA manifest a Workbox service worker se stejným automatickým aktualizačním režimem; cache obsahuje statické JS/CSS a loga, API, administrativní HTML a osobní údaje se necachují. Zachovaný cookie banner.
- Světlý/tmavý režim a responzivní navigace, přístupné dialogy a ovládání klávesnicí. Překlady cs/en jsou sloučené z původního projektu a jeho modulů.

### Ověřené rozdíly původního frontendu vůči PHP

Frontend zachovává PHP jako autoritu. Nevkládá chybějící backendovou logiku:

- Původní `PATCH /invoices/:id` v php-core neexistuje. Změna stavu je mapovaná na existující `PATCH /invoices/:id/status`. Splatnost a poznámka jsou zobrazené pouze ke čtení, protože PHP pro jejich aktualizaci nemá endpoint. Původní formulář je měl editovatelné, ale posílal na neexistující routu.
- Původní veřejný kontakt volal obecné odeslání šablon. Používá se aktuální veřejný `POST /mailer`, který sám posílá oba e-maily a omezuje četnost. Název a projekt se doplní na serveru, viditelná pole zůstávají e-mail a zpráva.
- Profil se ukládá do vlastního uživatele a heslo mění přes `/auth/change-password`; klient nemůže měnit vlastní roli.
- Nad 2 500 Kč je zachované původní zobrazení dopravy/platby zdarma. Aktuální PHP `OrderService::create` si cenu dopravy bere z číselníku a tuto slevu samostatně neuplatňuje; rozhodující je uložená objednávka a faktura PHP. Toto je existující nesoulad backendu, který migrace frontendem neopravuje.
- Vytvoření objednávky je úspěšné i při následném selhání PDF/e-mailu; frontend neopakuje již uloženou objednávku. PDF či e-mail bez skutečné integrace nelze považovat za ověřené.
- Stránka GDPR je přenesena v původním rozsahu: nadpis. Původní projekt neměl další právní text.

## SEO

Kanonický origin je pevně `https://www.vinozezajeci.cz`, bez závislosti na lokálním hostname, `FRONTEND_HOST` nebo požadavku. Zachované cs/en cesty, tituly a popisy, canonical, hreflang cs-CZ/en-US/x-default, Open Graph, Twitter obrázky a metadata; doplněná strukturovaná data vinařství a produktů.

`/robots.txt`, `/sitemap.xml` a `/sitemap_index.xml` používají ostrý origin. Sitemap čte celý publikovaný katalog po stránkách. Při nedostupnosti PHP vrací 503, nikoli neúplnou úspěšnou sitemapu. Administrace, auth, galerie a pokladna mají původní noindex a nejsou v sitemapě. Neexistující víno vrací 404; nedostupný katalog 503. Obchodní podmínky včetně celého původního textu jsou zachované.

## Ověření

```sh
npm test
npm run check
npm run build
npx playwright install chromium
npm run test:browser
npm run test:browser:production  # sestavení + stejné scénáře proti Node SSR
npm run format:check
```

Browserové testy spouštějí výhradně vlastní PHP mock na `127.0.0.1:8787` a Astro na `127.0.0.3:4321`. Zahrnují SSR/SEO a sitemapu, mobilní/desktopový layout, téma, galerii, nákup a perzistenci, kontaktní formulář, všechny admin sekce, změnu vína, zachování JSON atributů, upload, změnu stavu faktury, oddělení rolí, CSRF a ochranu relace. Nesmí se přepojovat na skutečný backend. Build a browserové testy spouštět postupně.

Nasazení, skutečné přihlášení u poskytovatelů OAuth, doručení e-mailu a vytvoření PDF na živém PHP nejsou prokázané mockovými testy; před ostrým přepnutím je ověřit v odpovídajícím testovacím prostředí. Tato migrace sama nic nenasazuje a nemění PHP backend.

### Výsledek skutečného čtení backendu při migraci

Přenesené soukromé `.env` původního Nuxtu míří na vzdálený backend a nemá `INTERNAL_API_KEY`. Čtení jediného veřejného produktu v této konfiguraci vrátilo HTTP 401 `Internal authentication required.`. Čtení stejného veřejného katalogu na místním `php/php-core` s jeho místním klíčem vrátilo HTTP 500. Žádné skutečné objednávky, e-maily ani uploady nebyly provedené. Pro živé integrační ověření je potřeba správně nakonfigurované prostředí PHP a odpovídající soukromý klíč. Lokální klíč nebyl posílán na vzdálený backend.

Node SSR ověřuje důvěryhodné hostname přes `security.allowedDomains`. Nastavená je ostrá doména a lokální adresy na portu 4321. Při použití další dočasné/staging domény ji přidat do této explicitní konfigurace; canonical zůstává ostrý.
