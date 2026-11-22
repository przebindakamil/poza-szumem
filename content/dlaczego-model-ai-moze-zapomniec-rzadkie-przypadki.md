---
title: "Dlaczego model AI gubi rzadkie przypadki"
excerpt: "Doskonały wynik na typowych przykładach może ukrywać słabość systemu wobec sytuacji, które zdarzają się rzadko, ale mają duże znaczenie."
date: "2026-11-26"
category: "ai"
author: "Poza Szumem"
keywords: ["dlaczego","model","rzadkie","przypadki"]
sources:
  - title: "Google — Rules of Machine Learning"
    url: "https://developers.google.com/machine-learning/guides/rules-of-ml"
  - title: "NIST — AI Risk Management Framework"
    url: "https://www.nist.gov/itl/ai-risk-management-framework"
---

Wyobraźmy sobie system, który ocenia tysiące zdjęć i w ogromnej większości przypadków udziela poprawnej odpowiedzi. Na prezentacji wygląda imponująco. Wskaźnik trafności jest wysoki, a kolejne przykłady pojawiają się na ekranie bez wahania. Dopiero po wdrożeniu okazuje się, że system zawodzi właśnie wtedy, kiedy sytuacja jest nietypowa. Problem nie musi tkwić w błędzie programu. Może wynikać z tego, czego model nauczył się na podstawie dostępnych danych.

Uczenie maszynowe polega na odkrywaniu prawidłowości w przykładach. Jeśli w zbiorze treningowym pewien typ sytuacji pojawia się często, model otrzymuje wiele okazji do dopasowania swoich parametrów. Jeśli zdarzenie jest rzadkie, materiału do nauki może być znacznie mniej. W dodatku rzadkość bywa połączona z innymi trudnościami: nietypowym oświetleniem, niepełną informacją, nowym kontekstem albo zmianą sposobu zbierania danych.

## Kiedy średnia zasłania problem

Najprostszy przykład pochodzi z klasyfikacji. Jeśli dziewięćdziesiąt dziewięć na sto obserwacji należy do jednej klasy, system, który zawsze wskazuje tę klasę, osiągnie dziewięćdziesiąt dziewięć procent trafności. A jednak nigdy nie wykryje pozostałego jednego procenta. Jeśli ten procent oznacza szczególnie ważne przypadki, sama dokładność jest miarą niemal bezużyteczną.

Dlatego badacze i inżynierowie korzystają także z innych miar. Czułość opisuje, jaka część rzeczywistych przypadków określonego rodzaju została wykryta. Precyzja mówi, jak często pozytywne wskazanie było poprawne. Ich znaczenie zależy od zadania. Inaczej ocenia się system rekomendujący filmy, a inaczej narzędzie wspierające wykrywanie niebezpiecznych usterek. Nie istnieje jeden wynik, który wystarczy do opisania jakości wszystkich modeli.

Kłopot pogłębia się, gdy dane testowe przypominają treningowe bardziej niż przyszłe warunki pracy. Można uzyskać znakomity wynik w laboratorium, a później napotkać inną populację użytkowników, inne urządzenia albo inne zwyczaje. Wtedy problemem nie jest wyłącznie rzadkość klasy, ale zmiana rozkładu danych. Model rozpoznaje to, co było typowe wcześniej, choć świat, w którym działa, już się zmienił.

## Model nie zna granic własnego doświadczenia

System może przypisywać wysokie prawdopodobieństwo odpowiedzi również wtedy, gdy otrzymuje przykład odmienny od wszystkiego, co widział podczas treningu. Liczba na ekranie wygląda jak pewność, lecz nie zawsze jest dobrze skalibrowana. W praktyce trzeba badać, czy przewidywane prawdopodobieństwa odpowiadają częstości rzeczywistych zdarzeń. Trzeba też sprawdzać zachowanie systemu poza średnią: w poszczególnych grupach, warunkach i rodzajach przypadków.

NIST w swoich materiałach dotyczących zarządzania ryzykiem AI podkreśla znaczenie oceny systemów w kontekście ich zastosowania. To ważne, bo ten sam błąd może być niemal nieistotny w jednym środowisku i poważny w drugim. Wysoka trafność nie jest samodzielnym dowodem bezpieczeństwa, tak samo jak długa lista testów nie gwarantuje, że przewidziano wszystkie możliwe sytuacje.

Szczególnym wyzwaniem jest zbieranie danych o zdarzeniach, które występują rzadko. Nie można po prostu czekać, aż pojawią się w wystarczającej liczbie. Czasem wykorzystuje się dodatkowe źródła, symulacje albo celowe wyszukiwanie trudnych przykładów. Każde z tych rozwiązań ma ograniczenia. Symulacja może nie oddawać rzeczywistości, a ręcznie zebrane przykłady mogą nadmiernie reprezentować pewien rodzaj problemu.

W codziennym kontakcie z AI łatwo przyzwyczaić się do płynności działania. System odpowiada szybko, obrazy wyglądają przekonująco, a tekst ma pewny ton. Tymczasem niezawodność nie polega tylko na tym, jak często wszystko działa poprawnie. Liczy się również to, co dzieje się na obrzeżach znanego świata, gdzie przykładów było mało, a koszt pomyłki może być duży.

Dobra ocena modelu przypomina więc oglądanie mapy nie tylko w jej środku, lecz także przy krawędziach. Tam, gdzie kończą się gęste dane, zaczynają się pytania, na które wysoki średni wynik nie odpowie. To nie powód, by odrzucać uczenie maszynowe. To powód, by ostrożniej rozumieć, co naprawdę oznacza, że system został dobrze przetestowany.
