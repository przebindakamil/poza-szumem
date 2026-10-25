---
title: "Dlaczego AI brzmi pewnie, nawet gdy się myli"
excerpt: "Model językowy potrafi stworzyć przekonującą odpowiedź bez sprawdzenia faktów. Co mówią badania o halucynacjach, kalibracji pewności i naszej skłonności do ufania płynnemu językowi?"
date: "2026-10-28"
category: "ai"
author: "Poza Szumem"
series: "Technologia bez złudzeń"
keywords: ["AI", "modele językowe", "halucynacje", "TruthfulQA", "wiarygodność", "kalibracja", "weryfikacja źródeł"]
sources:
  - title: "Lin, Hilton, Evans — TruthfulQA: Measuring How Models Mimic Human Falsehoods"
    url: "https://aclanthology.org/2022.acl-long.229/"
  - title: "Groot i Valdenegro-Toro — Overconfidence is Key (2024)"
    url: "https://aclanthology.org/2024.trustnlp-1.13/"
  - title: "Steyvers i in. — What large language models know and what people think they know (2025)"
    url: "https://doi.org/10.1038/s42256-024-00976-7"
  - title: "Geng i in. — A Survey of Confidence Estimation and Calibration in LLMs"
    url: "https://aclanthology.org/2024.naacl-long.366/"
---

Wyobraźmy sobie bibliotekarza, który na każde pytanie odpowiada natychmiast, pięknym językiem i bez najmniejszego zawahania. Pytamy o mało znaną książkę. Podaje autora, rok wydania, streszczenie, a nawet fragment recenzji. Wszystko brzmi wiarygodnie. Dopiero kiedy idziemy do katalogu, okazuje się, że książka nigdy nie powstała. Zaskakuje nie tylko błąd, lecz także sposób jego podania. Dlaczego rozmówca nie powiedział po prostu: nie wiem?

Z modelami językowymi dzieje się coś podobnego, choć porównanie do człowieka ma granice. System nie musi mieć przekonania o prawdziwości zdania, by potrafił je płynnie ułożyć. Podczas uczenia przyswaja wzorce języka, związki między pojęciami, style wypowiedzi i ogromną ilość informacji. Następnie generuje odpowiedź jako sekwencję kolejnych fragmentów tekstu. Nie działa przy tym jak encyklopedia, która zawsze otwiera odpowiednią kartę z podpisanym źródłem.

To nie znaczy, że model tylko losuje słowa. Potrafi wykonywać złożone operacje na informacjach, rozwiązywać zadania i trafnie odpowiadać na wiele pytań. Jednak mechanizm tworzenia poprawnie brzmiącego zdania nie jest tym samym co mechanizm sprawdzania faktu. Właśnie w tej szczelinie powstają błędy nazywane halucynacjami: odpowiedzi, które wyglądają na konkretne i kompetentne, ale zawierają nieprawdziwe twierdzenia, nieistniejące cytaty albo pomylone szczegóły.

Najłatwiej dostrzec problem tam, gdzie pytanie dotyczy czegoś rzadkiego. Jeśli prosimy o opis powszechnie znanego zjawiska, w danych treningowych mogło istnieć wiele spójnych przykładów. Gdy pytamy o niszowy artykuł naukowy, nazwisko lokalnego badacza czy numer przepisu, model może nadal wytworzyć tekst przypominający poprawną odpowiedź. Język dostarcza mu gotowych form: tytuł czasopisma, data, nazwisko, elegancki akapit. Brakuje jednak gwarancji, że te elementy odnoszą się do rzeczywistości.

## Test, w którym rozsądek bywa pułapką

W 2022 roku Stephanie Lin, Jacob Hilton i Owain Evans opublikowali pracę o zestawie testowym TruthfulQA. Autorzy przygotowali pytania, na które ludzie często odpowiadają błędnie, ponieważ powtarzają popularne nieporozumienia. Test nie miał mierzyć wyłącznie umiejętności przywoływania encyklopedycznych faktów. Sprawdzał, czy model potrafi uniknąć wiarygodnie brzmiącej, lecz fałszywej odpowiedzi.

W pierwotnym zestawie znalazło się 817 pytań z 38 obszarów. W badanych wówczas modelach autorzy zauważyli, że większy rozmiar nie zawsze przekładał się na większą prawdomówność w tym szczególnym teście. Nie należy traktować tamtych wyników jako rankingu współczesnych systemów. Modele od tego czasu istotnie się zmieniły, a benchmarki mają swoje ograniczenia. Eksperyment pozostaje jednak dobrym przykładem problemu: system może nauczyć się nie tylko prawdziwych informacji, lecz także popularnych błędów powtarzanych przez ludzi.

Człowiek też potrafi mówić z przekonaniem o rzeczach, których nie sprawdził. Różnica polega między innymi na skali i dostępności. Dawniej, żeby otrzymać fachowo brzmiącą odpowiedź, trzeba było znaleźć rozmówcę albo książkę. Dziś wystarczy kilka sekund. Forma wypowiedzi jest niemal zawsze uporządkowana: wstęp, wyjaśnienie, przykład. Ten porządek może tworzyć wrażenie, że za tekstem stoi równie uporządkowany proces weryfikacji. Nie zawsze tak jest.

Badacze zajmują się więc nie tylko poprawnością odpowiedzi, lecz także jej kalibracją. Dobrze skalibrowany system powinien sygnalizować niepewność w sposób odpowiadający rzeczywistej szansie na pomyłkę. Jeśli na pewnym rodzaju pytań deklaruje osiemdziesięcioprocentową pewność, trafność takich odpowiedzi powinna w przybliżeniu odpowiadać tej deklaracji. To znacznie trudniejsze niż dopisanie na końcu zdania „mogę się mylić”.

W 2024 roku Tobias Groot i Matias Valdenegro-Toro badali, jak modele językowe i modele analizujące obrazy opisują własną niepewność. W testowanych konfiguracjach często pojawiała się nadmierna pewność. Z kolei badania przedstawione w „Nature Machine Intelligence” przez Marka Steyversa i współpracowników pokazały, że ludzie oceniający odpowiedzi modeli na podstawie ich wyjaśnień nie zawsze trafnie rozpoznają, kiedy system wie, o czym mówi. Problem dotyczy więc dwóch stron rozmowy: tego, co model potrafi oszacować, i tego, co człowiek odczytuje z tonu odpowiedzi.

## Gdzie kończy się zdanie, a zaczyna dowód

Warto zauważyć, jak często nasze zaufanie budują szczegóły. Tytuł publikacji, nazwisko naukowca i dokładna data sprawiają, że tekst wydaje się udokumentowany. Jeśli jednak nie prowadzą do istniejącego źródła, są tylko dekoracją wiarygodności. Model może nawet wygenerować adres internetowy przypominający prawdziwą stronę. Dopiero sprawdzenie, czy publikacja istnieje i czy rzeczywiście potwierdza podaną tezę, zmienia efektowną wypowiedź w informację, na której można polegać.

Z tego powodu połączenie modelu z wyszukiwarką, bazą dokumentów lub narzędziem obliczeniowym bywa tak przydatne. System może sięgnąć do aktualnego materiału zamiast opierać się wyłącznie na wyuczonych wzorcach. Nie jest to jednak magiczne rozwiązanie. Wyszukany tekst może być nieaktualny, źle zinterpretowany albo niezwiązany z pytaniem. Cytat może potwierdzać tylko część twierdzenia. Narzędzie daje możliwość sprawdzenia, ale nie zwalnia z oceny jakości dowodu.

Najbardziej ryzykowne bywają zadania, w których pomyłka ukrywa się w pozornie drobnym szczególe. Podsumowanie długiego dokumentu może być ogólnie poprawne, a jednocześnie przekręcić jeden termin. Analiza prawna może dobrze wyjaśniać zasadę, lecz pomylić właściwą jurysdykcję. Opis badania może trafnie oddać hipotezę, a błędnie przedstawić jego wynik. Płynność tekstu nie pomaga wykryć takich różnic; czasem wręcz je maskuje.

Nie trzeba z tego wyciągać wniosku, że z AI nie warto korzystać. Wiele zastosowań nie wymaga bezbłędnego odtwarzania zewnętrznych faktów. Model może pomagać porządkować myśli, poprawiać tekst, szukać alternatywnych ujęć, wyjaśniać pojęcia albo proponować strukturę analizy. W takich sytuacjach użytkownik często może sam ocenić rezultat. Im bardziej odpowiedź ma jednak zastępować źródło wiedzy, tym ważniejsza staje się możliwość niezależnego sprawdzenia.

Być może największą zmianą, jakiej musimy się nauczyć, jest oddzielenie dwóch wrażeń. Jedno brzmi: „rozumiem, co ten tekst mówi”. Drugie: „wiem, że to prawda”. Kiedyś dobra forma była rzadziej dostępna bez wiedzy stojącej za nią. Teraz eleganckie wyjaśnienie można otrzymać nawet tam, gdzie pewności brak. Prawdziwa umiejętność nie polega więc na odrzucaniu każdej odpowiedzi maszyny, lecz na rozpoznawaniu momentu, w którym potrzebujemy czegoś więcej niż dobrze ułożonego zdania.
