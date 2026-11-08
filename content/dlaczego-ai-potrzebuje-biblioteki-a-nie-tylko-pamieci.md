---
title: "Dlaczego AI potrzebuje biblioteki, a nie tylko pamięci"
excerpt: "Model językowy może pisać płynnie, ale nie przechowuje faktów jak uporządkowana encyklopedia. Połączenie wyszukiwania z generowaniem zmienia sposób pracy z wiedzą."
date: "2026-11-10"
category: "ai"
author: "Poza Szumem"
keywords: ["RAG","wyszukiwanie","modele językowe","źródła","AI"]
sources:
  - title: "Lewis i in. — Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"
    url: "https://arxiv.org/abs/2005.11401"
  - title: "Karpukhin i in. — Dense Passage Retrieval for Open-Domain Question Answering"
    url: "https://arxiv.org/abs/2004.04906"
---

W bibliotece pytanie nie kończy się na tym, czy bibliotekarz coś pamięta. Nawet najbardziej oczytana osoba sięga do katalogu, odszukuje książkę, sprawdza stronę i porównuje wydania. Pamięć pomaga jej wiedzieć, gdzie szukać, ale nie zastępuje samego źródła. W przypadku sztucznej inteligencji przez długi czas zachwycaliśmy się przede wszystkim czymś przeciwnym: zdolnością do odpowiadania bez widocznego zaglądania do jakiejkolwiek książki.

Model językowy uczy się na ogromnych zbiorach tekstów i zapisuje w swoich parametrach statystyczne zależności. Dzięki temu potrafi formułować zdania, wyjaśniać pojęcia i odtwarzać wiele informacji. Nie posiada jednak szufladek, w których każdy fakt leży obok daty i przypisu. Wiedza jest rozproszona w wyuczonych reprezentacjach. Kiedy model tworzy odpowiedź, nie musi przywoływać konkretnego dokumentu. Może wytworzyć zdanie bardzo podobne do prawdziwego, choć jego treść okaże się błędna.

Stąd wziął się pomysł, by połączyć dwa różne rodzaje pracy: odnajdywanie dokumentów i układanie odpowiedzi. W 2020 roku Patrick Lewis wraz ze współautorami opisał podejście nazwane retrieval-augmented generation, w skrócie RAG. Zamiast polegać wyłącznie na tym, co model utrwalił podczas treningu, system najpierw wyszukuje fragmenty z zewnętrznego zbioru, a następnie wykorzystuje je podczas generowania tekstu. To tak, jakby rozmówca mógł w trakcie odpowiedzi otworzyć odpowiednią książkę.

Sama idea nie jest magiczna. Wyszukiwarki od dawna odnajdują dokumenty, a systemy odpowiadania na pytania korzystały z baz wiedzy przed erą współczesnych modeli językowych. Nowością było sprawne połączenie wyszukiwania z elastycznym generowaniem zdań. Odpowiedź mogła zachować naturalny język, a jednocześnie oprzeć się na materiale, który da się aktualizować niezależnie od modelu.

## Gdzie zaczyna się wiedza z zewnątrz

Wyobraźmy sobie firmę z kilkuset stronami dokumentacji. Pracownik pyta, jak zgłosić problem z konkretnym produktem. Model bez dostępu do firmowych dokumentów może opisać ogólną procedurę, ale nie zna najnowszych zasad tej organizacji. System z wyszukiwaniem znajduje odpowiedni fragment instrukcji, przekazuje go modelowi i prosi o odpowiedź opartą na treści dokumentu. W dobrze zaprojektowanym rozwiązaniu użytkownik może również zobaczyć odsyłacz do źródła.

Za prostym doświadczeniem kryje się kilka decyzji technicznych. Dokumenty trzeba podzielić na fragmenty. Pytanie użytkownika musi zostać porównane z ich treścią. Nie zawsze wystarczy dopasowanie tych samych słów: ktoś może zapytać o „zwrot towaru”, choć instrukcja używa określenia „odstąpienie od umowy”. Metody wyszukiwania semantycznego próbują odnajdywać podobieństwo znaczeń, nie tylko liter. Badania nad dense passage retrieval pokazały, jak reprezentacje pytań i fragmentów mogą służyć takiemu dopasowywaniu.

Problem w tym, że znaleziony fragment nie musi być właściwy. System może pobrać dokument nieaktualny, niepełny albo dotyczący innej wersji produktu. Jeśli odpowiedź brzmi przekonująco, użytkownik łatwo uzna, że sam fakt dołączenia źródła czyni ją wiarygodną. Tymczasem błędne wyszukiwanie może stać się początkiem błędnego wnioskowania. Źródło nie działa jak pieczęć prawdy; trzeba jeszcze sprawdzić, czy rzeczywiście wspiera podane twierdzenie.

Istnieje także różnica między odnalezieniem informacji a jej poprawnym wykorzystaniem. Model może dostać właściwy akapit i mimo to źle zrozumieć wyjątek, pomylić warunek albo połączyć dwie niezgodne wersje instrukcji. W systemach dotyczących zdrowia, prawa czy finansów ten szczegół ma ogromne znaczenie. Nie wystarczy mierzyć, czy odpowiedź jest płynna. Trzeba sprawdzać trafność pobranych materiałów, zgodność z nimi i to, czy system potrafi przyznać, że odpowiedzi nie znalazł.

Dla czytelnika najważniejsza jest może zmiana wyobrażenia o inteligentnej maszynie. Popularny obraz przedstawia model jako rozmówcę, który „wie” coraz więcej. RAG przypomina, że w praktycznej pracy ważniejsza od samego zasobu zapamiętanych informacji bywa umiejętność dotarcia do aktualnego, odpowiedniego dokumentu. Tak działa przecież znaczna część ludzkiej wiedzy zawodowej. Lekarz korzysta z zaleceń, inżynier z norm, historyk z archiwum. Ich kompetencja nie polega na tym, że wszystko noszą w głowie.

Nie oznacza to, że każdy chatbot potrzebuje dostępu do internetu. Gdy prosimy o pomysł na opowiadanie albo wyjaśnienie podstawowej reguły gramatycznej, zewnętrzne wyszukiwanie może być zbędne. Inaczej jest wtedy, gdy pytanie dotyczy konkretnej wersji dokumentu, zmiennego przepisu albo informacji, której prawdziwość chcemy skontrolować. Wtedy dobrze dobrana biblioteka staje się częścią odpowiedzi.

Warto też pamiętać, że dokumenty bywają sprzeczne. Dwa raporty mogą używać innych definicji, a instrukcja z zeszłego roku może różnić się od dzisiejszej. Uczciwy system nie powinien ukrywać tych napięć pod jedną gładką frazą. Powinien umieć pokazać, skąd pochodzi informacja i gdzie kończy się pewność. Wyszukiwanie nie zwalnia z interpretacji; przeciwnie, ujawnia, jak bardzo jest ona potrzebna.

Być może najbardziej użyteczne zastosowania AI będą więc mniej przypominały wszechwiedzącego rozmówcę, a bardziej cierpliwego asystenta pracującego w czytelni. Kogoś, kto potrafi odnaleźć właściwy tom, otworzyć go na odpowiedniej stronie i powiedzieć, co z niego wynika. A gdy strony brakuje — nie dopowiadać reszty z pamięci.