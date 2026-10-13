---
title: "Dlaczego GPS potrzebuje Einsteina"
excerpt: "Niebieska kropka na mapie działa dlatego, że satelitarne zegary płyną w czasie odrobinę inaczej niż nasze."
date: "2026-10-14"
category: "swiat"
author: "Poza Szumem"
series: "Jak działa świat"
keywords: ["GPS", "Einstein", "relatywistyka", "czas", "satelity", "zegary atomowe"]
sources:
  - title: "NIST — How Do You Measure Your Location Using GPS?"
    url: "https://www.nist.gov/how-do-you-measure-it/how-do-you-measure-your-location-using-gps"
  - title: "NIST — Putting Einstein to the Test"
    url: "https://www.nist.gov/atomic-clocks/a-powerful-tool-for-science/putting-einstein-test"
  - title: "NIST — The global positioning system, relativity, and extraterrestrial navigation"
    url: "https://www.nist.gov/publications/global-positioning-system-relativity-and-extraterrestrial-navigation"
---

Niebieska kropka na ekranie telefonu wygląda niewinnie. Przesuwa się po mapie, kiedy idziemy chodnikiem, wsiadamy do samochodu albo próbujemy znaleźć wejście do hotelu w obcym mieście. Zwykle interesuje nas tylko jedno: czy pokazuje właściwą ulicę. Rzadko myślimy o tym, że za tą małą ikoną stoi jeden z najbardziej niezwykłych eksperymentów fizycznych wykonywanych bez przerwy nad naszymi głowami.

System GPS działa dzięki czasowi. Nie dzięki mapom i nie przede wszystkim dzięki obrazom Ziemi z kosmosu. Satelity wysyłają sygnały zawierające między innymi informację o tym, gdzie się znajdują i kiedy dokładnie sygnał został nadany. Odbiornik w telefonie porównuje moment wysłania z momentem odebrania. Ponieważ fale radiowe poruszają się z prędkością światła, z różnicy czasu można wyliczyć odległość od satelity.

To brzmi prosto, dopóki nie uświadomimy sobie skali. Światło pokonuje około trzystu tysięcy kilometrów w sekundę. Błąd rzędu jednej milionowej sekundy oznacza więc setki metrów różnicy. Jeśli chcemy wiedzieć, po której stronie skrzyżowania stoimy, zegary całego systemu muszą być zsynchronizowane z precyzją, która w codziennym życiu wydaje się absurdalna.

Na pokładzie satelitów pracują zegary atomowe. Nie mierzą czasu za pomocą wahadła ani drgającego kryształu kwarcu, lecz wykorzystują niezwykle stabilne częstotliwości przejść energetycznych atomów. Ziemskie stacje kontrolne obserwują satelity, korygują ich orbity i czas. Telefon nie ma zegara tej samej klasy, dlatego w obliczeniach pojawia się także poprawka na błąd jego własnego zegara. Do ustalenia pozycji w trzech wymiarach i jednoczesnego oszacowania tego błędu potrzebne są sygnały z co najmniej czterech satelitów.

Można by pomyśleć, że jeśli zbudujemy wystarczająco dokładne zegary i umieścimy je na stabilnych orbitach, sprawa jest załatwiona. Właśnie tutaj pojawia się Einstein.

## Zegar, który nie płynie tak samo

W codziennym świecie zakładamy, że sekunda jest sekundą niezależnie od miejsca. Zegar w Krakowie, zegar na statku i zegar na szczycie góry powinny, po odpowiednim ustawieniu, tykać tak samo. To założenie działa znakomicie tak długo, jak długo nie próbujemy mierzyć czasu z ekstremalną precyzją.

Szczególna teoria względności mówi, że dla obserwatora poruszający się zegar chodzi wolniej niż zegar pozostający względem niego w spoczynku. Satelity GPS pędzą po orbitach z dużą prędkością, dlatego ich zegary z punktu widzenia obserwatora na Ziemi powinny nieznacznie się spóźniać. Według NIST efekt ten daje około siedmiu mikrosekund różnicy na dobę.

Ale to dopiero połowa historii.

Ogólna teoria względności opisuje związek czasu z grawitacją. Im głębiej znajdujemy się w polu grawitacyjnym, tym wolniej płynie czas. Satelity GPS krążą tysiące kilometrów nad powierzchnią Ziemi, gdzie ziemska grawitacja jest słabsza. Ich zegary powinny więc chodzić szybciej niż zegary na powierzchni. Ten efekt jest większy: około czterdziestu pięciu mikrosekund na dobę.

Jeden mechanizm zwalnia satelitarny zegar, drugi go przyspiesza. Po zsumowaniu zostaje około trzydziestu ośmiu mikrosekund na dobę na korzyść zegara znajdującego się na orbicie.

Trzydzieści osiem milionowych części sekundy brzmi jak ilość czasu niegodna uwagi. Człowiek nie jest w stanie jej zauważyć. Mrugnięcie oka trwa tysiące razy dłużej. Dla systemu mierzącego położenie za pomocą czasu przelotu sygnału jest to jednak przepaść. Pominięcie relatywistycznych poprawek sprawiłoby, że błędy pozycji rosłyby bardzo szybko do skali kilometrów.

GPS nie korzysta więc z teorii względności dlatego, że inżynierowie chcieli zbudować elegancką demonstrację fizyki. Korzysta z niej dlatego, że bez niej system nie spełniałby swojej podstawowej funkcji.

## Pozycja jest w istocie pomiarem czasu

Wyobraźmy sobie, że stoimy gdzieś na równinie i słyszymy cztery dzwony. Każdy znajduje się w znanym miejscu i każdy wysyła dźwięk o dokładnie ustalonej porze. Jeśli potrafimy bardzo dokładnie zmierzyć, kiedy dźwięki do nas dotarły, możemy oszacować, jak daleko jesteśmy od każdego dzwonu. Przecięcie kilku możliwych odległości wskazuje naszą pozycję.

GPS robi coś podobnego, tylko zamiast dźwięku używa fal radiowych, a zamiast dzwonów — satelitów. Każdy z nich transmituje ciąg informacji pozwalający odbiornikowi określić moment nadania sygnału oraz położenie satelity w przestrzeni. Odbiornik przelicza różnice czasowe na tak zwane pseudoodległości. „Pseudo” jest tu ważne, bo pomiar zawiera nie tylko rzeczywistą odległość, lecz również błędy zegara, atmosfery i inne zakłócenia.

Sygnał przechodzący przez jonosferę i troposferę może zostać opóźniony. Satelita nie znajduje się dokładnie tam, gdzie wynikałoby z idealnego modelu jego orbity. Fale mogą odbijać się od budynków. Telefon może widzieć fragment nieba zasłonięty przez wysoką zabudowę. System pozycjonowania musi więc nieustannie korygować wiele małych niedoskonałości.

Najciekawsze jest to, że każda z tych poprawek ma inną naturę. Jedne wynikają z pogody kosmicznej, inne z geometrii, jeszcze inne z konstrukcji odbiornika. A jedna z najważniejszych wynika z faktu, że czas nie jest uniwersalnym metronomem tykającym identycznie w całym Wszechświecie.

## Einstein w kieszeni

Teoria względności zwykle pojawia się w kulturze jako coś odległego od codzienności. Kojarzy się z czarnymi dziurami, bliźniakiem wracającym z podróży kosmicznej młodszym od brata albo z równaniem zapisanym na tablicy. Łatwo pomyśleć, że to piękna, ale egzotyczna część fizyki.

Tymczasem każdego dnia korzystamy z urządzeń, które muszą brać ją pod uwagę.

Gdy zamawiamy taksówkę, aplikacja ustala nasze położenie na podstawie sygnałów zsynchronizowanych między Ziemią a satelitami. Gdy samolot korzysta z nawigacji satelitarnej, ten sam problem czasu wraca w znacznie poważniejszym kontekście. Rolnictwo precyzyjne, geodezja, synchronizacja części sieci telekomunikacyjnych i energetycznych — wszystkie te zastosowania korzystają z systemów satelitarnych, których podstawą jest dokładne odmierzanie czasu.

GPS stał się tak zwyczajny, że przestał wyglądać jak technologia kosmiczna. W samochodzie nawigacja mówi „za dwieście metrów skręć w prawo” i po chwili zapominamy, że polecenie powstało dzięki sieci zegarów poruszających się wysoko nad atmosferą.

Jeszcze ciekawsze jest to, że współczesne zegary atomowe pozwalają mierzyć relatywistyczne różnice czasu na coraz mniejszych wysokościach. NIST i inne laboratoria porównują zegary tak dokładne, że można wykryć zmianę tempa ich pracy wynikającą z niewielkiej różnicy położenia w polu grawitacyjnym. Teoria, która na początku XX wieku wymagała eksperymentów astronomicznych i wielkiej wyobraźni, zaczyna być sprawdzana na odległościach odpowiadających skali budynku.

To odwraca intuicję. Nie jest tak, że relatywistyka zaczyna działać dopiero wtedy, kiedy coś jest bardzo szybkie albo bardzo daleko. Ona działa zawsze. Po prostu przez większość czasu efekty są tak małe, że nie umiemy ich zauważyć.

## Mapa świata zbudowana z sekund

Na ekranie smartfona mapa wygląda jak obraz przestrzeni. Są drogi, budynki, granice i punkty. GPS przypomina, że pod spodem równie ważny jest czas.

Żeby powiedzieć, gdzie coś się znajduje, trzeba wiedzieć, kiedy dotarła do nas informacja. Żeby zsynchronizować system działający na całej planecie, trzeba ustalić, jak szybko płyną zegary znajdujące się w różnych warunkach. A żeby zrobić to naprawdę dokładnie, nie wystarczy intuicja Newtona. Trzeba zaakceptować jeden z najbardziej nieintuicyjnych wniosków współczesnej fizyki: dwa dobre zegary mogą mierzyć czas poprawnie, a mimo to po pewnym czasie wskazywać coś innego.

Kiedy idziemy ulicą, telefon może określić nasze położenie z dokładnością wystarczającą, by rozpoznać właściwy zakręt. Nie widzimy satelitów, nie słyszymy ich sygnałów i nie zauważamy mikrosekund, które dzielą zegary na orbicie od zegarów na Ziemi.

Widzimy tylko niebieską kropkę.

I być może właśnie to jest jedna z najbardziej niezwykłych cech dobrej technologii. Im lepiej działa, tym mniej widzimy całej wiedzy, która musi być prawdziwa, żeby mogła działać w ogóle.
