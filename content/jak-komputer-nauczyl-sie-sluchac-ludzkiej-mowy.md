---
title: "Jak komputer nauczył się słuchać ludzkiej mowy"
excerpt: "Głos zamienia się w tekst tak szybko, że przestaliśmy zauważać, jak trudne jest to zadanie. O akustyce, uczeniu maszynowym i granicach automatycznego rozumienia rozmów."
date: "2026-10-20"
category: "ai"
author: "Poza Szumem"
series: "Jak działa świat"
keywords: ["rozpoznawanie mowy", "AI", "Whisper", "transkrypcja", "dźwięk", "uczenie maszynowe"]
sources:
  - title: "Radford i in. — Robust Speech Recognition via Large-Scale Weak Supervision (2022)"
    url: "https://arxiv.org/abs/2212.04356"
  - title: "OpenAI — Przedstawiamy model Whisper (2022)"
    url: "https://openai.com/pl-PL/index/whisper/"
  - title: "Baevski i in. — wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations"
    url: "https://arxiv.org/abs/2006.11477"
---

Ktoś mówi do telefonu: „Przyjedź po mnie pod dworzec, od strony parkingu”. Na ekranie niemal od razu pojawiają się słowa. Nie trzeba wyraźnie oddzielać sylab ani powtarzać zdań mechanicznym głosem. System radzi sobie z potocznym tempem, niedokończonymi wyrazami i szumem ulicy. Gdy popełni błąd, zwykle poprawiamy jedno słowo i idziemy dalej. Cała operacja jest tak zwyczajna, że łatwo przeoczyć jej osobliwość: urządzenie otrzymało jedynie falę dźwiękową, a oddało zapis wypowiedzi.

Mowa nie przypomina tekstu czytanego z kartki. W zdaniu zapisanym na ekranie słowa są rozdzielone spacjami. W wypowiedzi granice między nimi często znikają. Głoski wpływają na siebie, końcówki bywają skracane, a jeden człowiek mówi znacznie szybciej niż drugi. Do tego dochodzą akcent, pogłos pokoju, mikrofon oddalony od ust i hałas otoczenia. To, co człowiek rozpoznaje bez większego wysiłku, jest dla maszyny problemem wymagającym połączenia akustyki, statystyki i wiedzy o języku.

Zacznijmy od samego dźwięku. Mikrofon rejestruje zmiany ciśnienia powietrza i zamienia je na sygnał elektryczny, a następnie na serię liczb. W tym zapisie nie ma literek. Są próbki amplitudy, z których można odtworzyć falę. Komputer musi dopiero odkryć, jakie cechy tego sygnału odpowiadają głosowi, jakie szumowi, a jakie wynikają z różnic między mówiącymi. Trudność polega na tym, że nie istnieje jedna, idealna fala dźwiękowa odpowiadająca każdemu słowu.

## Z dźwięku do hipotezy

Przez lata systemy rozpoznawania mowy składały się z osobnych części. Jedna analizowała cechy akustyczne, inna szacowała prawdopodobieństwo kolejnych dźwięków mowy, jeszcze inna pomagała wybierać sensowne sekwencje wyrazów. Wiele rozwiązań korzystało z modeli statystycznych, słowników wymowy i starannie przygotowanych nagrań. Potrafiły działać bardzo dobrze w określonych warunkach, ale zmiana mikrofonu, dialektu lub tematu rozmowy mogła znacząco pogorszyć wyniki.

Później coraz większą rolę zaczęły odgrywać sieci neuronowe, które uczą się reprezentacji sygnału na podstawie przykładów. Zamiast ręcznie opisywać każdą właściwość głoski, badacze dostarczali modelom nagrania oraz odpowiadające im transkrypcje. System próbował przewidzieć tekst i korygował swoje parametry, kiedy się mylił. To nie znaczy, że poznawał język tak jak dziecko. Uczył się zależności statystycznych między dźwiękiem a zapisem, korzystając z ogromnej liczby przykładów.

W 2020 roku badacze opisali metodę wav2vec 2.0, która pokazała, że duże ilości nieopisanych nagrań mogą pomagać w uczeniu użytecznych reprezentacji mowy. To istotna zmiana: przygotowanie dokładnej transkrypcji każdego nagrania kosztuje czas i pieniądze, natomiast surowych danych dźwiękowych istnieje znacznie więcej. System może najpierw nauczyć się czegoś o strukturze sygnału, a dopiero później wykorzystywać mniejszy zestaw przykładów z prawidłowym tekstem.

Nie ma tu jednej magicznej sztuczki. Sygnał mowy jest ciągły, a zapis języka dyskretny: litery i słowa pojawiają się w określonej kolejności. Algorytm musi poradzić sobie z rozbieżnością między tymi dwoma światami. Jedna sylaba może trwać u różnych osób inną liczbę milisekund. Cisza może oznaczać koniec zdania albo zwykłe zawahanie. W dodatku poprawna odpowiedź nie zawsze jest oczywista nawet dla człowieka, jeśli rozmówcy używają nazw własnych, skrótów lub słów z obcego języka.

## Skąd wzięła się nowa swoboda rozmowy

W 2022 roku zespół badaczy przedstawił model Whisper, wytrenowany na około 680 tysiącach godzin danych dźwiękowych powiązanych z tekstem i zadaniami językowymi. Ważna była nie tylko skala, ale też różnorodność materiału. Znalazły się w nim różne języki, akcenty i warunki nagrań. Twórcy opisywali, że model radzi sobie stosunkowo dobrze także na danych, do których nie był osobno dostrajany. Nie oznaczało to, że jest najlepszy w każdym teście. W niektórych wyspecjalizowanych zestawach danych inne systemy osiągały lepsze wyniki.

Whisper przetwarza nagranie w odcinkach, tworzy z niego reprezentację częstotliwościową i wykorzystuje architekturę neuronową typu koder–dekoder. Upraszczając: jedna część systemu szuka wzorców w sygnale, druga przewiduje sekwencję tekstu. Model może również rozpoznawać język nagrania i wykonywać określone zadania związane z tłumaczeniem mowy na tekst. Ta konstrukcja pokazuje, jak bardzo rozpoznawanie głosu oddaliło się od prostego dopasowywania nagrania do słownika gotowych komend.

W praktyce największa zmiana dotyczy tego, gdzie można używać takiej technologii. Transkrypcja nie musi już oznaczać pracy przy specjalistycznym stanowisku z dobrym mikrofonem i starannie wymawianymi słowami. Można sporządzać notatki ze spotkań, dodawać napisy do nagrań, wyszukiwać fragmenty wywiadów, dyktować wiadomości w samochodzie. Dla części osób z ograniczeniami sprawności lub trudnościami w obsłudze klawiatury rozpoznawanie mowy bywa szczególnie ważnym sposobem komunikacji z urządzeniami.

Ta wygoda tworzy jednak nowe ryzyka. Gdy człowiek ręcznie spisuje wywiad, zwykle pamięta, że nie dosłyszał nazwiska. Automatyczna transkrypcja może wpisać w jego miejsce inne, brzmiące wiarygodnie słowo. Model nie ma obowiązku zatrzymać się przy każdym fragmencie, którego nie rozumie. Może wybrać najbardziej prawdopodobny ciąg znaków, nawet gdy sygnał jest słaby. W efekcie błąd bywa trudniejszy do zauważenia niż pusta luka w zapisie.

## Słyszeć nie znaczy rozumieć

Rozpoznawanie mowy i rozumienie wypowiedzi to dwie różne rzeczy. System może doskonale przepisać zdanie „To świetny pomysł”, a mimo to nie wiedzieć, że rozmówca wypowiedział je ironicznie. Może rozpoznać wszystkie słowa pytania, lecz nie znać jego kontekstu. Nawet człowiek często potrzebuje gestu, spojrzenia lub wcześniejszej rozmowy, żeby właściwie odczytać intencję. Dlatego płynna transkrypcja nie jest dowodem, że maszyna naprawdę pojęła sytuację społeczną.

Istnieje także kwestia prywatności. Nagranie głosu może zawierać informacje znacznie bardziej osobiste niż pojedyncza wiadomość tekstowa: dane o rozmówcach, miejscu, tle akustycznym i tematach, które nigdy nie miały trafić do publicznego obiegu. To, czy dany system przetwarza dźwięk lokalnie, czy wysyła go na serwer, ma realne znaczenie. Wygoda dyktowania nie powinna usuwać z pola widzenia pytania, kto otrzymuje dostęp do nagrania i jak długo je przechowuje.

Czasem warto posłuchać własnej wiadomości głosowej po przeczytaniu jej automatycznej transkrypcji. Tekst jest czysty, podzielony na zdania, pozbawiony oddechów i zawahań. Brzmi tak, jakbyśmy od początku mówili w sposób uporządkowany. W rzeczywistości wypowiedź mogła być pełna powrotów i niedopowiedzeń. Komputer wykonuje więc nie tylko techniczną zamianę dźwięku na litery. W pewnym sensie nadaje mowie formę, która nie była w niej w pełni obecna.

To jedna z najbardziej niezwykłych przemian codziennej technologii. Jeszcze niedawno rozmowa i dokument należały do odrębnych światów. Dziś można przejść między nimi niemal bez zauważalnego wysiłku. Warto jednak pamiętać, że pomiędzy falą dźwiękową a zapisanym zdaniem zawsze znajduje się interpretacja. Nawet jeśli wykonuje ją maszyna w ułamku sekundy.
