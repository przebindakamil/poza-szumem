---
title: "Obraz, który oszukuje sztuczną inteligencję"
excerpt: "Czasem niemal niewidoczna zmiana pikseli wystarcza, by system rozpoznawania obrazów pomylił obiekty. Dlaczego maszyna dostrzega wzory, których człowiek nie zauważa?"
date: "2026-11-04"
category: "ai"
author: "Poza Szumem"
series: "Technologia bez złudzeń"
keywords: ["sztuczna inteligencja", "rozpoznawanie obrazów", "adversarial examples", "sieci neuronowe", "odporność modeli", "widzenie komputerowe"]
sources:
  - title: "Goodfellow, Shlens i Szegedy — Explaining and Harnessing Adversarial Examples (ICLR 2015)"
    url: "https://research.google/pubs/explaining-and-harnessing-adversarial-examples/"
  - title: "Ilyas i in. — Adversarial Examples Are Not Bugs, They Are Features (NeurIPS 2019)"
    url: "https://proceedings.nips.cc/paper_files/paper/2019/hash/e2c420d928d4bf8ce0ff2ec19b371514-Abstract.html"
  - title: "Szegedy i in. — Intriguing properties of neural networks"
    url: "https://arxiv.org/abs/1312.6199"
---

Na jednym zdjęciu widać zwyczajny przedmiot. Człowiek rozpoznaje go bez namysłu. Komputerowy model, wytrenowany na milionach obrazów, również wskazuje poprawną nazwę. Potem ktoś zmienia niewielką liczbę wartości w pliku graficznym. Różnica może być dla obserwatora niemal niezauważalna, a jednak ten sam model nagle przypisuje obrazowi inną etykietę, czasem z bardzo wysokim wynikiem pewności.

Nie chodzi o zwykłą fotografię złej jakości ani o przypadkowy błąd aparatu. Zmiana została dobrana celowo, z uwzględnieniem sposobu działania systemu. W badaniach nad uczeniem maszynowym takie przykłady nazywa się adversarial examples, czyli przykładami adwersarialnymi. To dane skonstruowane tak, aby model popełnił błąd, mimo że dla człowieka zasadnicza treść obrazu pozostaje ta sama.

Zjawisko było badane już w pierwszej połowie poprzedniej dekady. Christian Szegedy i współpracownicy opisali zaskakujące właściwości sieci neuronowych w pracy udostępnionej w 2013 roku. Ian Goodfellow, Jonathon Shlens i Szegedy rozwinęli temat w publikacji przedstawionej na konferencji ICLR w 2015 roku. Pokazali, że nawet niewielkie, starannie dobrane zaburzenia wejścia mogą prowadzić do konsekwentnych pomyłek. Niektóre takie zaburzenia działały także na inne modele niż ten, dla którego zostały przygotowane.

W potocznym opisie brzmi to jak dowód, że komputer „niczego naprawdę nie widzi”. To jednak zbyt proste. Modele rozpoznawania obrazów potrafią wykonywać bardzo użyteczne zadania. Problem polega na tym, że ich sposób dochodzenia do odpowiedzi nie musi odpowiadać temu, jak człowiek wyodrębnia przedmiot z tła i przypisuje mu znaczenie.

## Piksel nie jest przedmiotem

Kiedy patrzymy na psa, zwykle nie analizujemy osobno każdej jasnej i ciemnej plamki. Widzimy kształt ciała, sposób poruszania się, uszy, pysk, kontekst otoczenia. Rozpoznawanie jest wynikiem wieloletniego doświadczenia i pracy układu wzrokowego, który łączy wiele poziomów informacji. Komputerowy klasyfikator otrzymuje natomiast uporządkowany zbiór liczb opisujących obraz. Podczas treningu uczy się, jakie zależności między tymi liczbami pomagają przewidywać poprawną etykietę.

Część wyuczonych zależności odpowiada cechom zrozumiałym dla ludzi: krawędziom, fakturom, fragmentom kształtów. Inne mogą być subtelniejsze, rozproszone po całym obrazie i trudne do opisania słowami. Model nie ma obowiązku wybierać cech, które uznalibyśmy za najważniejsze. Jeśli pewien wzór statystycznie pomaga trafiać w odpowiedzi na danych treningowych, system może się na nim oprzeć.

Właśnie tutaj powstaje szczelina między dwiema definicjami podobieństwa. Dla człowieka dwa obrazy mogą przedstawiać ten sam przedmiot. Dla modelu drobna zmiana rozłożona na wielu pikselach może przesunąć wynik obliczeń na drugą stronę granicy decyzyjnej. Wysoka pewność klasyfikacji nie musi oznaczać, że model rozpoznał przedmiot w ludzkim sensie. Jest wynikiem jego wewnętrznej procedury oceny.

W pracy z 2015 roku Goodfellow i współautorzy zaproponowali wyjaśnienie związane między innymi z liniowym charakterem części operacji wykonywanych przez sieci. Bardzo małe zmiany pojedynczych wartości, kiedy zostaną odpowiednio dobrane i zsumowane w wysokowymiarowej przestrzeni, mogą wywołać duży efekt. To nie jest jedyne wyjaśnienie całego zjawiska, ale pomogło zrozumieć, dlaczego podatność nie ogranicza się do pojedynczego źle zaprogramowanego modelu.

Badacze opracowali również sposób włączania celowo trudnych przykładów do treningu. Taki trening adwersarialny może zwiększać odporność na pewne rodzaje ataków, ale nie gwarantuje odporności na wszystkie możliwe zmiany obrazu. Obrona jest trudna także dlatego, że przeciwnik może dostosowywać swoje metody do zastosowanego zabezpieczenia.

## Cechy, które działają, choć ich nie rozumiemy

W 2019 roku Andrew Ilyas i współpracownicy zaproponowali inne ważne spojrzenie. W pracy zatytułowanej „Adversarial Examples Are Not Bugs, They Are Features” argumentowali, że część problemu wynika z istnienia cech nieodpornych: statystycznie przydatnych, ale bardzo wrażliwych na niewielkie zmiany. Takie cechy mogą pomagać modelowi osiągać dobre wyniki na zwykłych danych, choć nie są dla człowieka intuicyjne.

To ciekawa myśl, bo odwraca powszechne wyobrażenie o błędzie. Można sądzić, że sieć daje się oszukać, ponieważ nauczyła się zbyt mało. Tymczasem może wykorzystywać rzeczywiste regularności danych, których człowiek nie uznaje za sensowną podstawę rozpoznania. Gdy ktoś świadomie zmieni te regularności, model zmienia odpowiedź, choć przedmiot w ludzkim odbiorze pozostał niezmieniony.

Nie oznacza to, że każdy atak działa w świecie fizycznym. Cyfrowe przesunięcie wartości pikseli w pliku jest czymś innym niż naklejka na znaku drogowym oglądana pod różnymi kątami, w deszczu i przy zmiennym oświetleniu. W rzeczywistych warunkach dochodzą ograniczenia aparatu, perspektywy, odległości i sposobu przetwarzania obrazu. Nie wszystkie laboratoryjne wyniki można bezpośrednio przenieść na kamerę samochodu czy robota.

Mimo to badania nad odpornością są ważne tam, gdzie rozpoznanie obrazu ma konsekwencje poza ekranem. System wspomagający ocenę zdjęć medycznych, kontrolę jakości produktu czy orientację maszyny w przestrzeni powinien nie tylko osiągać wysoką skuteczność na typowych przykładach. Trzeba również wiedzieć, jak zachowuje się wobec danych nietypowych, uszkodzonych, celowo zmienionych lub pochodzących z innego środowiska niż dane treningowe.

To prowadzi do rozróżnienia między dokładnością a niezawodnością. Dokładność mówi, jak często system trafia w określonym teście. Niezawodność wymaga pytania, w jakich warunkach wynik pozostaje stabilny, jak system sygnalizuje niepewność i co dzieje się po przekroczeniu granic, których nie przewidziano podczas projektowania. Dwa modele o podobnym wyniku w zwykłym benchmarku mogą zachowywać się bardzo różnie po niewielkiej zmianie otoczenia.

W debacie o sztucznej inteligencji często przeciwstawia się „maszynowe” i „ludzkie” widzenie. Tymczasem także ludzki wzrok bywa zawodny. Iluzje optyczne pokazują, że mózg nie odczytuje świata jak neutralny czujnik. Różnica polega na tym, że komputerowe pomyłki mogą ujawniać inne, mniej intuicyjne słabości. Nie powinniśmy zakładać, że skoro obraz wygląda dla nas tak samo, model musi zachować się identycznie.

Najbardziej pouczające w przykładach adwersarialnych jest więc nie to, że potrafią ośmieszyć komputer. Pokazują, jak wiele założeń kryje się w słowie „rozpoznawać”. Dla człowieka przedmiot jest czymś trwałym, co pozostaje sobą mimo drobnych zmian wyglądu. Dla modelu jest także układem liczb i granic wyuczonych z danych. Dopiero kiedy te dwa sposoby patrzenia się rozchodzą, widzimy wyraźnie, jak bardzo mogą się różnić.
