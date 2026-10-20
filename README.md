# Poza Szumem

Spokojna biblioteka esejow, reportazy i tekstow wartych uwagi.

## Uruchomienie

Wymagany Node.js 22 lub nowszy.

```sh
npm install
npm run build
npm run validate
SITE_DIR=_site npm run serve
```

Na Windows PowerShell ustaw najpierw `$env:SITE_DIR = '_site'`, a potem wykonaj `npm run serve`.
Adres lokalny: http://127.0.0.1:4173/

## Publikacja

Workflow `Site checks` generuje katalog `_site`, sprawdza linki i metadane,
uruchamia testy Playwright na desktopie i telefonie, a dopiero potem publikuje
wynik na GitHub Pages. W Settings > Pages ustaw Source na GitHub Actions,
aby uniknac rownoleglego publikowania plikow z galezi. Produkcyjna domena to https://pozaszumem.pl/.

Stale adresy artykulow sa zachowane. Obecne pliki HTML pozostaja obslugiwane;
nie trzeba migrowac calego archiwum naraz.

## Nowy tekst

Dodaj `content/slug-tekstu.md`. Plik `content/_example.md` jest wzorem i nie jest publikowany.
Wymagane pola: title, excerpt, date (YYYY-MM-DD), category.
Kategorie: rozwoj, ai, sport, finanse, swiat, dom, kultura, zwierzeta.
Opcjonalnie: author, updated, series, sources, keywords.
Markdown jest renderowany przez markdown-it; surowy HTML w Markdown jest wylaczony.
Alternatywnie mozna nadal dodac podstrone HTML do `artykuly/` z dotychczasowymi klasami.

Generator aktualizuje biblioteke, czas czytania (200 slow/min), podstrony kategorii
i serii, feed.xml, sitemap.xml, metadane Article/Open Graph i obraz udostepniania.
Metadane redakcyjne archiwum znajduja sie w `content/editorial.json`. Sekcja „Polecany tekst” losuje stabilny wpis na 3-dniowe okno (`recommendedRotationDays`); zmienia się przy codziennym buildzie dopiero po wejściu w kolejne okno i celowo omija teksty opublikowane już w trakcie bieżącego okna.
Dalsza lektura zawiera powiazane publikacje; nie jest deklaracja pelnego audytu
wszystkich twierdzen historycznych i naukowych.

## Czytanie i prywatnosc

Zapisane artykuly, fragmenty, status przeczytania i pozycje sa przechowywane
lokalnie w przegladarce. Nie ma kont, trackerow ani synchronizacji z serwerem.
Filtry biblioteki i pozycja listy sa zapamietywane w sessionStorage.
Service worker zachowuje pobrane artykuly offline rowniez przy aktualizacji zasobow.
Newsletter jest odlozony; strona nie zbiera adresow e-mail.

## Weryfikacja

```sh
npm run build
npm run validate
npx playwright install chromium
npm test
```

Testy obejmuja odczyt artykulow, offline, blokade storage, zapisane teksty,
wznawianie czytania, filtry, sortowanie, klawiature, kategorie, metadane i RSS.
Raport i zrzuty ekranu sa dostepne jako artefakt `browser-report` w GitHub Actions.

## Ikony

Ikony Lucide sa dolaczone lokalnie. Informacja licencyjna znajduje sie w 
`assets/LUCIDE-LICENSE.txt`; bundler zachowuje tez naglowki licencji w pliku JS.

## Dlugosc artykulow — zasady redakcyjne

Cykl „10 minut dla siebie” dopuszcza teksty o **realnym czasie czytania od 5 do 10 minut**, zależnie od złożoności tematu, liczby przykładów i materiału źródłowego. Nie wydłużaj tekstu sztucznie, aby osiągnąć 10 minut, ani nie skracaj złożonego tematu kosztem jasności. Dla krótkich, konkretnych zagadnień celuj w 5–6 minut, dla średnich w 7–8 minut, a dla tematów wymagających rozbudowanej narracji w 9–10 minut.

Generator strony oblicza faktyczny szacunkowy czas czytania na podstawie tekstu (200 słów/min). Przed publikacją sprawdź ten wynik i dopasuj objętość do przedziału 5–10 minut; nie wpisuj arbitralnego czasu w karcie. Zachowuj magazynowy styl narracji i unikaj wypełniaczy.


## Plan redakcyjny

Plany na kolejne dni znajdują się w `content/schedule.json`. Dashboard redakcyjny jest generowany pod `/admin/` i pokazuje dziś + 6 kolejnych dni, status przygotowania, wolne terminy oraz balans kategorii. Widok nie jest linkowany z publicznej nawigacji i ma `noindex,nofollow`, ale na GitHub Pages nie jest chroniony logowaniem.

Przykład wpisu:

```json
{
  "date": "2026-10-14",
  "title": "Dlaczego...",
  "category": "swiat",
  "status": "research",
  "notes": "Sprawdzić źródło X i badanie Y"
}
```

Dozwolone statusy: `idea`, `research`, `draft`, `ready`. Gdy w `content/` pojawi się opublikowany artykuł z tą samą datą, dashboard automatycznie pokaże status „Opublikowany”.


## Publikacja zaplanowana

Artykuły z przyszłą datą mogą być zapisane wcześniej w `content/*.md`. Build odczytuje wszystkie pliki, ale do publicznej biblioteki, podstron kategorii, RSS, sitemap oraz `data/articles.json` trafiają tylko teksty z datą nie późniejszą niż bieżący dzień w strefie `Europe/Warsaw`.

Dashboard `/admin/` widzi również przyszłe artykuły i pokazuje je jako „Gotowy”. Workflow `Site checks` uruchamia się także codziennie rano, dzięki czemu kolejny przygotowany tekst zostaje opublikowany automatycznie bez nowego commita.

Raz w tygodniu zadanie „Poza Szumem — plan tygodnia” przygotowuje plan na poniedziałek–niedzielę, wykonuje research, tworzy 7 gotowych plików Markdown i aktualizuje `content/schedule.json`.


### Ilustracje artykułów

Każdy artykuł ma automatycznie generowaną ilustrację redakcyjną zgodną z systemem opisanym w `content/_visual-style.md`. Nie trzeba dodawać plików graficznych ręcznie.

Domyślnie build generuje:

- hero WebP 1600×1200,
- osobny social image JPG 1200×630,
- podpis `Ilustracja: Poza Szumem`,
- tekst alternatywny,
- spójny motyw i paletę zależną od kategorii.

Dla nowych tekstów warto świadomie ustawić:

```yaml
visualMotif: "orbit"
visualAlt: "Abstrakcyjna ilustracja z orbitami satelitów i motywem odmierzania czasu."
```

Dostępne motywy: `orbit`, `network`, `flow`, `grid`, `waves`, `rings`, `layers`, `signal`. Jeśli ich zabraknie, build sam dobiera motyw z tytułu, słów kluczowych i kategorii.

Własny obraz nadal można podać ręcznie:

```yaml
image: "assets/articles/nazwa-pliku.webp"
imageAlt: "Krótki opis tego, co znajduje się na obrazie"
imageCredit: "Opcjonalny podpis lub autor"
```

Własny obraz ma pierwszeństwo przed generatorem automatycznym.
Na końcu artykułu generator automatycznie pokazuje do trzech powiązanych tekstów. Priorytet mają wspólna seria, kategoria i słowa kluczowe; rekomendacje nie wymagają ręcznego utrzymywania list.


## Kategoria Zwierzęta

Kategoria `zwierzeta` służy tekstom o niezwykłych zdolnościach, zachowaniach i biologii zwierząt — szczególnie takim, o których rzadko mówi się w codziennych mediach. Priorytetem są rzeczy zaskakujące, dobrze udokumentowane i dające czytelnikowi poczucie, że dowiedział się czegoś naprawdę nowego.

Dobre kierunki to m.in. nawigacja i magnetorecepcja, komunikacja, pamięć i uczenie, inteligencja, percepcja, migracje, strategie przetrwania, zachowania społeczne, ewolucyjne osobliwości oraz relacje zwierząt z człowiekiem i środowiskiem.

Teksty nie muszą być sztucznie wydłużane. Jeśli temat daje materiał na 4–6 minut konkretnego czytania, taki format jest poprawny. Gdy temat ma więcej warstw, badań i ciekawych przykładów, zachowaj standardowe 7–10 minut. Najważniejsza jest gęstość ciekawej wiedzy, a nie długość sama w sobie.


## Zdjęcia artykułów

Domyślnie używamy prawdziwych fotografii związanych z treścią, preferencyjnie z Wikimedia Commons. Jeśli nie ma dobrego legalnego zdjęcia, artykuł publikuje się bez hero. Automatyczne abstrakcyjne grafiki nie są już domyślnym fallbackiem; szczegóły w `content/_visual-style.md`.
