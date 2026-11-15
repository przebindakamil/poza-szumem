---
title: "Dlaczego komputer musi wiedzieć, które słowa są ważne"
excerpt: "Mechanizm attention zmienił sposób przetwarzania tekstu przez sieci neuronowe. Nie jest ludzką uwagą, lecz matematycznym sposobem ważenia kontekstu."
date: "2026-11-18"
category: "ai"
author: "Poza Szumem"
keywords: ["transformer", "attention", "AI", "sieci neuronowe", "język"]
sources:
  - title: "Vaswani i in. — Attention Is All You Need"
    url: "https://arxiv.org/abs/1706.03762"
  - title: "Bahdanau i in. — Neural Machine Translation by Jointly Learning to Align and Translate"
    url: "https://arxiv.org/abs/1409.0473"
---

W zdaniu „zamek był zamknięty” to samo brzmienie prowadzi w różne strony. Jedno słowo może oznaczać budowlę, drugie stan drzwi. Znaczenie nie mieszka w pojedynczych literach. Powstaje z relacji między fragmentami wypowiedzi, z tego, co znajduje się przed nimi i po nich. Dla człowieka ta zależność jest tak naturalna, że rzadko ją zauważa. Dla maszyny przetwarzającej tekst była przez długi czas jednym z podstawowych problemów.

Dawniejsze systemy tłumaczenia maszynowego korzystały z rozbudowanych reguł, modeli statystycznych i później sieci neuronowych, które przetwarzały sekwencje słów. W wielu architekturach informacja o wcześniejszej części zdania była przekazywana krok po kroku. Przy długich wypowiedziach trudniej było zachować istotne zależności. Badacze zaczęli więc budować mechanizmy pozwalające modelowi podczas przetwarzania jednego fragmentu odwołać się bezpośrednio do innych fragmentów.

W 2014 roku Dzmitry Bahdanau i współautorzy przedstawili rozwiązanie dla tłumaczenia neuronowego, w którym model mógł dynamicznie koncentrować się na różnych częściach zdania źródłowego. Kilka lat później zespół Ashisha Vaswaniego opublikował pracę „Attention Is All You Need”. Zaproponowany w niej Transformer wykorzystywał mechanizmy uwagi jako główny sposób budowania zależności między elementami sekwencji, bez klasycznej rekurencji w rdzeniu architektury.

## Matematyczna uwaga

Słowo „attention” jest tu myląco ludzkie. Nie oznacza świadomości, ciekawości ani przeżywanego skupienia. Oznacza operację matematyczną, w której reprezentacja jednego elementu jest porównywana z reprezentacjami innych. Z tych porównań powstają wagi, a następnie ważona kombinacja informacji. W praktyce model uczy się, które fragmenty mogą być użyteczne do zbudowania kolejnej reprezentacji.

Wyobraźmy sobie zdanie o człowieku, który odłożył książkę na stół, ponieważ była ciężka. Żeby poprawnie interpretować końcowy przymiotnik, system musi wykorzystać kontekst. Mechanizm attention może pomóc powiązać odległe elementy wypowiedzi, ale nie działa jak gotowa gramatyczna instrukcja. Wagi są wynikiem uczenia na danych i nie zawsze odpowiadają prostym, zrozumiałym dla człowieka wyjaśnieniom. Nie można więc traktować każdej wysokiej wagi jako dowodu, że model „myślał o tym słowie”.

Transformer korzysta z wielu równoległych sposobów zestawiania informacji, nazywanych głowami uwagi. Różne głowy mogą uczyć się różnych relacji, choć nie należy zakładać, że każda ma stałą i łatwą do nazwania funkcję. Potrzebna jest też informacja o położeniu elementów, ponieważ samo zestawienie ich w zbiór nie zachowuje kolejności zdania. Architektura łączy zatem ważenie kontekstu z reprezentacją pozycji i kolejnymi przekształceniami.

## Przełom, który miał własne ograniczenia

W pracy z 2017 roku autorzy pokazali dobre wyniki tłumaczenia maszynowego oraz korzyści związane z równoległym przetwarzaniem podczas uczenia. Nie oznaczało to, że problem języka został rozwiązany. Transformer nadal uczy się na przykładach, może mylić znaczenia, powielać błędy danych i wytwarzać wypowiedzi, które brzmią wiarygodnie, lecz są nieprawdziwe. Mechanizm pozwalający łączyć fragmenty tekstu nie jest automatycznym mechanizmem weryfikacji faktów.

Jest również koszt obliczeniowy. W klasycznej postaci samo-uwaga porównuje wiele par elementów sekwencji. Wraz ze wzrostem długości tekstu liczba takich zależności rośnie szybko, dlatego inżynierowie rozwijają sposoby oszczędniejszego przetwarzania długiego kontekstu. To jedna z przyczyn, dla których wielkie modele mają określone limity kontekstu i nie przechowują nieskończonej rozmowy w niezmienionej formie.

Dziś łatwo patrzeć na duży model językowy jak na czarną skrzynkę, która po prostu odpowiada na pytania. Tymczasem pod płynną wypowiedzią znajduje się ogromna liczba drobnych operacji. Każdy fragment tekstu jest zamieniany na reprezentację liczbową, porównywany z innymi i przekształcany. Nie jest to czytanie w ludzkim sensie, ale wynik bywa wystarczająco użyteczny, by umożliwić tłumaczenie, streszczanie i pracę z kodem.

Warto więc oddzielać dwa pytania. Pierwsze brzmi: jak system może uwzględnić słowa odległe od siebie w zdaniu? Drugie: czy naprawdę rozumie to, o czym pisze? Mechanizm attention wniósł przełomową odpowiedź na pierwsze z nich. Drugiego nie rozstrzyga samą swoją nazwą. Gdy model trafnie łączy kontekst, widzimy siłę matematycznej konstrukcji. Gdy się myli, przypomina nam, że ważenie informacji nie jest tym samym, co znajomość świata.
