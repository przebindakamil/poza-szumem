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
Adres lokalny: http://127.0.0.1:4173/poza-szumem/

## Publikacja

Workflow `Site checks` generuje katalog `_site`, sprawdza linki i metadane,
uruchamia testy Playwright na desktopie i telefonie, a dopiero potem publikuje
wynik na GitHub Pages. W Settings > Pages ustaw Source na GitHub Actions,
aby uniknac rownoleglego publikowania plikow z galezi.

Stale adresy artykulow sa zachowane. Obecne pliki HTML pozostaja obslugiwane;
nie trzeba migrowac calego archiwum naraz.

## Nowy tekst

Dodaj `content/slug-tekstu.md`. Plik `content/_example.md` jest wzorem i nie jest publikowany.
Wymagane pola: title, excerpt, date (YYYY-MM-DD), category.
Kategorie: rozwoj, ai, sport, finanse, swiat, dom, kultura.
Opcjonalnie: author, updated, series, sources, keywords.
Markdown jest renderowany przez markdown-it; surowy HTML w Markdown jest wylaczony.
Alternatywnie mozna nadal dodac podstrone HTML do `artykuly/` z dotychczasowymi klasami.

Generator aktualizuje biblioteke, czas czytania (200 slow/min), podstrony kategorii
i serii, feed.xml, sitemap.xml, metadane Article/Open Graph i obraz udostepniania.
Metadane redakcyjne archiwum i polecany tekst znajduja sie w `content/editorial.json`.
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
