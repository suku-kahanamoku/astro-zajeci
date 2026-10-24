import { t as translate } from "../modules/LangModule";
export default function Terms({
  locale = "cs",
  contact = null,
  envMail = "vyborne@vinozezajeci.cz",
  envPhone = "+420 770 199 999",
}: {
  locale?: string;
  contact?: any;
  envMail?: string;
  envPhone?: string;
}) {
  const t = (key: string) => translate(key, locale);
  const title = t("$.terms.title");
  return (
    <>
      <main className="relative flex flex-col">
        <div className="mt-6 mb-6 md:mb-14 max-w-7xl mx-auto px-5">
          <h1 className="m-0 text-[26px] leading-[28px] md:text-[30px] md:leading-[32px] lg:text-[38px] font-semibold">
            {title}
          </h1>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <h3>{t("$.terms.intro")}</h3>
          <p>
            {" "}
            Tyto obchodní podmínky se vztahují na nákup prostřednictvím
            internetového obchodu{" "}
            {contact?.company ? (
              <span>{contact.company}</span>
            ) : (
              <span>{t("$.base.siteName")}</span>
            )}
            {contact?.website ? (
              <span>
                {" "}
                — <a href={contact.website}>{contact.website}</a>
              </span>
            ) : null}
            .{" "}
          </p>
          <div>
            <strong>{t("$.terms.supplier_label")}:</strong>
            <div>
              {contact?.company ? <p>{contact.company}</p> : null}
              {contact?.street || contact?.city || contact?.zip ? (
                <p>
                  {contact?.street ? (
                    <span>
                      {contact.street}
                      <br />
                    </span>
                  ) : null}
                  {contact?.zip || contact?.city ? (
                    <span>
                      {contact.zip || ""} {contact.city || ""}
                    </span>
                  ) : null}
                </p>
              ) : null}
              {contact?.ic || contact?.dic ? (
                <p>
                  {contact?.ic ? <span>IČ: {contact.ic}</span> : null}
                  {contact?.dic ? <span> · DIČ: {contact.dic}</span> : null}
                </p>
              ) : null}
              {contact?.phone1 ? (
                <p>
                  {" "}
                  Telefon:{" "}
                  <a href={`tel:${contact.phone1?.replace(/\s/g, "")}`}>
                    {contact.phone1}
                  </a>
                </p>
              ) : null}
              {contact?.email ? (
                <p>
                  {" "}
                  E‑mail:{" "}
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </p>
              ) : null}
            </div>
          </div>
          <p>
            <strong>Odběratel:</strong>
            <br /> Fyzická nebo právnická osoba, nakupující výrobky nebo zboží z
            internetového obchodu{" "}
            {contact?.company ? (
              <span>{contact.company}</span>
            ) : (
              <span>prodávajícího</span>
            )}
            .<br /> Smluvní vztahy podléhají výhradně platným zákonům na území
            ČR a české jurisdikci.
            <br /> Podáním závazné objednávky vyjadřuje kupující souhlas s
            těmito obchodními a platebními podmínkami a bere na sebe závazek je
            v plné míře respektovat.{" "}
          </p>
          <h3>{t("$.terms.ordering")}</h3>
          <p>
            {" "}
            Zboží je objednáváno prostřednictvím formulářů uvedených na e-shopu.
            Pouze řádně vyplněná objednávka obsahující veškeré předepsané
            náležitosti je považována za platná. Objednávky podané
            prostřednictvím internetového obchodu jsou považovány za závazné.
            Prodávající neručí za omyly v objednávce ze strany odběratele.
            Závazný je vždy obsah nákupního košíku a potvrzená objednávka.
            Odesláním objednávky odběratel potvrzuje, že se seznámil s těmito
            obchodní podmínkami a že s nimi souhlasí.{" "}
          </p>
          <p>
            {" "}
            Odesláním objednávky akceptuje odběratel výši ceny zboží, zvolený
            způsob dopravy a platební podmínky.{" "}
          </p>
          <p>
            <strong>{t("$.terms.supplier_obligations")}</strong>
          </p>
          <p>
            {" "}
            Předmětem smlouvy je pouze zboží uvedené v objednávce, které může
            být dodáno. Dodavatel se zavazuje dodat jen zboží v bezvadném stavu
            a v souladu se specifikacemi či vlastnostmi obvyklými pro daný druh
            zboží, vyhovující daným normám, předpisům a nařízením platným na
            území ČR. Dodavatel je povinen plnit své závazky řádně, včas a s
            náležitou péčí, je také povinen chránit v rámci svých možností
            přiměřeným způsobem práva a oprávněné zájmy odběratele.{" "}
          </p>
          <p>
            <strong>{t("$.terms.buyer_obligations")}</strong>
          </p>
          <p>
            {" "}
            Kupující je povinen uvést správnou a úplnou poštovní adresu, na
            kterou má být objednané zboží odesláno.{" "}
          </p>
          <p>
            {" "}
            Kupující je povinen odebrat objednané zboží a zaplatit kupní cenu,
            včetně případného poštovného. S konečnou cenou je zákazník srozuměn
            při vyplňování objednávky ještě před jejím závazným potvrzením.{" "}
          </p>
          <p>
            <strong>Cena</strong>
          </p>
          <p>
            {" "}
            Cenou se rozumí katalogová cena (v nabídce jsou uvedeny ceny zboží s
            DPH). Pokud není uvedeno jinak, vztahují se uvedené ceny na vybraný
            druh zboží podle popisu, avšak bez poštovného a balného.{" "}
          </p>
          <h3>{t("$.terms.delivery")}</h3>
          <p>
            {" "}
            Objednávky z internetového obchodu{" "}
            {contact?.company ? (
              <span>{contact.company}</span>
            ) : (
              <span>Zboží</span>
            )}{" "}
            jsou realizovány v České republice.{" "}
          </p>
          <p>
            <strong>{t("$.terms.delivery_time")}</strong>
          </p>
          <p>
            {" "}
            Zboží bude expedováno objednavateli do 10 pracovních dnů od přijetí
            objednávky (a přijetí platby v případě platby bankovním převodem),
            je-li zboží skladem. V případě objednání zboží, které není na
            skladě, bude termín dodání sjednán dohodou mezi dodavatelem a
            odběratelem.{" "}
          </p>
          <p>
            <strong>{t("$.terms.shipping")}</strong>
          </p>
          <ol>
            <li>
              {" "}
              V případě, že je způsob přepravy smluven na základě zvláštního
              požadavku kupujícího nad rámec nabízených způsobů přepravy, nese
              kupující riziko a případné dodatečné náklady spojené s tímto
              způsobem dopravy.{" "}
            </li>
            <li>
              {" "}
              Je-li prodávající podle kupní smlouvy povinen dodat zboží na místo
              určené kupujícím v objednávce, je kupující povinen převzít zboží
              při dodání v místě určené a v čase určeném přepravcem.{" "}
            </li>
            <li>
              {" "}
              V případě, že je z důvodů na straně kupujícího nutno zboží
              doručovat opakovaně nebo jiným způsobem, než bylo uvedeno v
              objednávce, je kupující povinen uhradit náklady spojené s
              opakovaným doručováním zboží, resp. náklady spojené s jiným
              způsobem doručení.{" "}
            </li>
            <li>
              {" "}
              Při převzetí zboží od přepravce je kupující povinen zkontrolovat
              neporušenost obalů zboží a v případě jakýchkoliv závad toto
              neprodleně oznámit přepravci a zapsat do přepravního protokolu –
              dle postupu stanoveného v příloze těchto podmínek – Postup při
              reklamaci.{" "}
            </li>
            <li>
              {" "}
              V případě, že kupující odmítne objednané zboží od přepravce
              převzít a smlouva do doby doručení zboží kupujícího nezanikla v
              důsledku oprávněného odstoupení kupujícího od smlouvy, je
              prodávající oprávněn od příslušné kupní smlouvy odstoupit a
              požadovat po kupujícím náklady na dopravu zboží k zákazníkovi a
              zpět. Právo prodávajícího na svépomocný prodej dle ustanovení §
              2126 a násl. občanského zákoníku tím není dotčeno.{" "}
            </li>
            <li>
              {" "}
              Další práva a povinnosti stran při přepravě zboží mohou upravit
              zvláštní dodací podmínky prodávajícího, jsou-li prodávajícím
              vydány{" "}
            </li>
          </ol>
          <h3>{t("$.terms.payment")}</h3>
          <p>
            <strong>{t("$.terms.receipt_of_delivery")}</strong>
          </p>
          <p>
            {" "}
            Odběratel je povinen zboží od přepravce řádně převzít, zkontrolovat
            neporušenost obalů, počet balíků a v případě jakýchkoliv závad toto
            neprodleně oznámit přepravci samotnému. Ihned by mělo být zahájeno u
            dopravce reklamační řízení a kopie zápisu by měla být bez zbytečného
            odkladu zaslána dodavateli, jinak nemůže být na dodatečné reklamace
            neúplnosti nebo poškození dodávky žádný nárok. V případě shledání
            porušení či poškození doporučujeme odběrateli zásilku ve vlastním
            zájmu odmítnout!{" "}
          </p>
          <p>
            <strong>{t("$.terms.payment_methods_label")}</strong>
          </p>
          <p>
            <strong>On-line bezhotovostně kreditní kartou</strong>
          </p>
          <p>
            {" "}
            Po odeslání objednávky budete přímo přesměrování na platební bránu k
            dokončení platby.{" "}
          </p>
          <p>
            <strong>Na dobírku (pro ČR)</strong>
          </p>
          <p>
            {" "}
            Při dodání dopravce od příjemce vybere odesílatelem stanovenou
            peněžní částku.{" "}
          </p>
          <p>
            <strong>Bankovním převodem</strong>
          </p>
          <p>
            {" "}
            Po odeslání objednávky převedete obnos peněz na náš účet, po přijetí
            převodu Vám bude zboží zasláno poštou.{" "}
          </p>
          <p>
            {" "}
            Pro platbu v CZK:
            <br /> číslo účtu: 3897132/0800
            <br /> Česká Spořitelna a.s., Kounicova 4, Brno
            <br /> variabilní symbol: číslo Vaší objednávky (zobrazí se po
            odeslání objednávky)
            <br /> konstantní symbol: 0008 (platba za zboží){" "}
          </p>
          <p>
            <strong>Pro platbu v EUR:</strong>
            <br /> účet v České spořitelně: IBAN: CZ64 0800 0000 0000 0389 7212,
            SWIFT: GIBACZPX{" "}
          </p>
          <p>
            <strong>V hotovosti</strong> (platí pro osobní odběry, platba v Kč)
          </p>
          <h3>{t("$.terms.cancellation")}</h3>
          <p>
            <strong>Odstoupení od kupní smlouvy ze strany kupujícího:</strong>
          </p>
          <p>
            {" "}
            Kupující má právo odstoupit od smlouvy, nejpozději do 14 dnů ode dne
            převzetí zboží, v tomto termínu je kupující povinen vrátit
            prodávajícímu zpět nepoškozené zboží, bez známek užívání nebo
            opotřebování, v původním obalu, na vlastní náklady. O úmyslu
            odstoupit od smlouvy, je kupující povinen informovat prodávajícího
            emailem na{" "}
            {contact?.email ? (
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            ) : (
              <span>{envMail}</span>
            )}{" "}
            nebo telefonicky na{" "}
            {contact?.phone1 ? (
              <a href={`tel:${contact.phone1?.replace(/\s/g, "")}`}>
                {contact.phone1}
              </a>
            ) : (
              <span>{envPhone}</span>
            )}{" "}
            nebo doporučeným dopisem na adresu uvedenou výše. Po obdržení
            vráceného zboží dodavatel obratem odběrateli vrátí zpět odpovídající
            částku (kupní cenu zboží) předem dohodnutým způsobem (poštovní
            poukázka, převod na účet). Náklady spojené s dopravou vraceného
            zboží hradí odběratel.{" "}
          </p>
          <h3>{t("$.terms.other")}</h3>
          <p>V případech, kdy:</p>
          <ul>
            <li>se zboží již nevyrábí nebo nedodává</li>
            <li>se výrazným způsobem změnila cena dodavatele zboží</li>
          </ul>
          <p>
            {" "}
            bude odběratel neprodleně kontaktován a bude s ním dohodnut další
            postup zahrnující i možnost zrušení objednávky nebo její části.{" "}
          </p>
          <p>
            <strong>Ceny zboží</strong>
          </p>
          <p>
            {" "}
            Dodavatel si vyhrazuje právo změny cen. Platné ceny jsou potvrzeny
            odběrateli v okamžiku potvrzení objednávky. Pokud je cena vyšší než
            cena uvedená na objednávce, dodavatel neprodleně o této skutečnosti
            informuje odběratele, který může novou cenu přijmout nebo dodávku
            odmítnout. Při telefonické objednávce je vždy kupujícímu sdělena
            platná cena pro danou objednávku.{" "}
          </p>
          <h3>{t("$.terms.complaints")}</h3>
          <p>
            <strong>Odběratel</strong>
          </p>
          <p>
            {" "}
            Podpisem dopravní listiny nebo terminálu dopravci při převzetí zboží
            stvrzuje kupující souhlas se záručními podmínkami. Odběratel je
            povinen bezprostředně po dodání zboží toto prohlédnout a bez
            zbytečných odkladů informovat dodavatele o případných zjištěných
            závadách. Pokud odběratel zjistí jakýkoliv rozdíl mezi tím, co je v
            dodacím listu a skutečně dodaným zbožím (například v druhu nebo
            množství) a nebo pokud s dodávkou neobdrží správně vyplněný dodací
            list, je povinen bez zbytečného odkladu, nejpozději však do tří dnů,
            písemně informovat dodavatele.{" "}
          </p>
          <h3>{t("$.terms.privacy")}</h3>
          <p>
            {" "}
            8.1. Kupující je v souladu s Nařízením Evropského parlamentu a Rady
            (EU) 2016/679 ze dne 27. dubna 2016 O ochraně fyzických osob v
            souvislosti se zpracováním osobních údajů a volném pohybu těchto
            údajů a o zrušení směrnice 95/46/ES (dále jen „Nařízení“) informován
            o zpracování osobních údajů, a to jméno, příjmení, datum narození a
            bydliště (dále jen „osobní údaje"), s tím, že tyto jsou prodávajícím
            zpracovávány a uchovávány pro účely plnění kupní smlouvy a pro účely
            plnění zákonných povinností identifikace smluvních stran. Osobní
            údaje kupujícího budou zpracovávány dle interní Směrnice o
            zpracování osobních údajů prodávajícího. Dozor nad ochranou osobních
            údajů vykonává Úřad pro ochranu osobních údajů.{" "}
          </p>
          <h3>{t("$.terms.satisfaction")}</h3>
          <p>
            {" "}
            Vaši spokojenost s nákupem zjišťujeme prostřednictvím e-mailových
            dotazníků v rámci programu Ověřeno zákazníky, do něhož je náš e-shop
            zapojen. Ty vám zasíláme pokaždé, když u nás nakoupíte, pokud ve
            smyslu § 7 odst. 3 zákona č. 480/2004 Sb. o některých službách
            informační společnosti jejich zasílání neodmítnete.{" "}
          </p>
          <h3>{t("$.terms.final")}</h3>
          <p>
            {" "}
            Obchodní podmínky platí ve znění platném v den odeslání elektronické
            objednávky. Tyto obchodní podmínky nabývají účinnosti dnem
            zprovoznění internetového obchodu. Provozovatelé si vyhrazují právo
            na změnu obchodních podmínek bez předchozího upozornění.{" "}
          </p>
        </div>
      </main>
    </>
  );
}
