# Audyt UX, UI i funkcjonalny

Data: 2026-10-09. Zakres: biblioteka, karty i lista, kategorie, czytnik,
zapisane artykuly, fragmenty, klawiatura, historia przegladarki i offline.

## Ustalenia i poprawki

| Priorytet | Problem | Poprawka |
| --- | --- | --- |
| P1 | Zapisane pozostawaly aktywne po cofaniu historii | Widok wynika z URL; obsluga hashchange i pageshow; powrot z artykulu zachowuje #saved |
| P1 | Podstrony kategorii rejestrowaly service worker pod nieistniejacym adresem | Adres jest wyliczany ze wspolnego katalogu aplikacji |
| P1 | Nieudane kopiowanie moglo pokazywac sukces | Potwierdzenie jest wyswietlane tylko po udanej operacji; blad pozwala sprobowac ponownie |
| P1 | Przycisk skupienia tracil dostepna nazwe na telefonie | Stale aria-label, title oraz ikony Focus/Minimize dla obu stanow |
| P1 | Link pomijania naglowka wskazywal brakujaca sekcje na stronach kategorii | Wspolny cel main-content i walidacja lokalnych kotwic |
| P2 | Status przeczytania zawieral dwa znaki wyboru | Usuniety pseudo-element CSS; jedna ikona Check i jeden podpis |
| P2 | 19/19 bylo niejednoznaczne | Licznik 19 tekstow, 2 teksty lub 1 tekst; oddzielony od naglowka |
| P2 | Biblioteka powtarzala sie w naglowku | Jeden naglowek; podstrony kategorii maja sekcje Teksty |
| P2 | Polecany tekst nie mial hierarchii wizualnej | Pelna szerokosc wyroznionego pasma, mocniejszy tytul, metadane i Przeczytaj tekst |
| P2 | Strzalki wygladaly jak nieopisane akcje | Usuniete dekoracyjne strzalki z biblioteki i rekomendacji |
| P2 | Lista byla nieuporzadkowana | Wyrownane wiersze: temat/data, tytul/zajawka oraz czas/zapis |
| P2 | Ta sama ikona oznaczala zapis artykulu i fragmenty | Zakladka dla artykulu, Quote dla fragmentow; podpisy dostepnosci wskazuja konkretny artykul |
| P2 | Wyszukiwanie i filtry nie zamykaly sie Escape | Escape zamyka kontrolke i przywraca fokus; dodatkowo Wyczysc filtry |
| P2 | Aktywna nawigacja nie byla widoczna | aria-current i widoczne podkreslenie aktywnego widoku |
| P2 | Wylaczony JavaScript pozostawial martwe kontrolki | Niefunkcjonalne kontrolki sa ukryte; statyczne linki i teksty pozostaja dostepne |
| P2 | Wersjonowany obraz logo mogl nie byc dostepny offline | Fallback do biezacego icon.svg bez rozrozniania jego query string |
| UI | Stary znak byl nieczytelny w malym rozmiarze | Nowy monogram PS, spojny w naglowku, faviconie i ikonach aplikacji |

Naglowek zmieniono zgodnie z dokladna prosba: Teksty do ktorych warto wracac.
Podstawowy wyglad kafelkow pozostal zachowany. Instalacja aplikacji zostala
przeniesiona do stopki, aby nie konkurowala z czytaniem polecanego tekstu.

## Weryfikacja

- Audyt interakcji w izolowanej sesji Playwright CLI.
- Zrzuty widokow kart i listy; szerokosci 1280, 390 i 320 px.
- Kontrola ladowania logo, przepelnien, statusow i historii Zapisane/Biblioteka.
- Istniejacy zestaw 22 testow regresji: desktop i telefon, storage, offline,
  filtry, czytnik, fragmenty, kategorie, metadane i zachowanie cache po aktualizacji.
- Walidacja linkow, unikalnych ID, JSON-LD, RSS i mapy witryny.

To audyt ekspercki z weryfikacja przegladarkowa. Nie obejmuje badan
z rzeczywistymi czytelnikami ani wszystkich wersji Safari i Firefox.
