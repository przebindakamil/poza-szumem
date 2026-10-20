# Poza Szumem — system zdjęć redakcyjnych

## Zasada główna

Domyślnym obrazem artykułu jest **prawdziwa fotografia odnosząca się bezpośrednio do tematu**. Nie generujemy automatycznie abstrakcyjnej grafiki tylko po to, żeby wypełnić hero.

Jeśli nie ma dobrego, legalnego i sensownie pasującego zdjęcia, artykuł może zostać opublikowany **bez hero image**. Brak zdjęcia jest lepszy niż przypadkowy stock albo dekoracyjna grafika, która niczego nie wnosi.

## Preferowane źródło

Pierwszym źródłem jest Wikimedia Commons, ponieważ pozwala zweryfikować autora, licencję i stronę źródłową.

Akceptowane licencje:
- Public Domain / CC0,
- CC BY,
- CC BY-SA.

Nie używaj materiałów z niejasnym statusem praw autorskich.

## Dobór zdjęcia

Zdjęcie powinno pokazywać realny obiekt, zachowanie, środowisko albo zjawisko istotne dla tekstu.

Przykłady:
- tekst o trzmielach → prawdziwy trzmiel na kwiecie,
- tekst o nawigacji gołębi → lecące gołębie pocztowe,
- tekst o zapachu deszczu → mokre liście, ziemia albo krople deszczu,
- tekst o konteneryzacji → prawdziwy terminal kontenerowy,
- tekst o śnie → osoba śpiąca lub odpoczywająca w naturalnej scenie.

Unikaj:
- generycznych zdjęć biznesowych,
- dosłownych stocków z pozowanymi ludźmi,
- obrazów, które tylko powtarzają tytuł,
- AI udającego dokumentalną fotografię.

## Front matter

```yaml
visualType: "photo"
image: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Nazwa_pliku.jpg"
imageAlt: "Krótki, konkretny opis zdjęcia."
imageCredit: "Fot. Autor / Wikimedia Commons"
imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Nazwa_pliku.jpg"
imageLicense: "CC BY-SA 4.0"
```

Podpis pod zdjęciem linkuje do strony źródłowej i pokazuje licencję.

## Fallback

Abstrakcyjny system ilustracji nadal istnieje wyłącznie jako świadoma opcja. Użyj go tylko wtedy, gdy tekst naprawdę wymaga ilustracji konceptualnej:

```yaml
visualType: "abstract"
visualMotif: "network"
visualAlt: "Opis ilustracji."
```

Jeśli `visualType` nie jest ustawione na `abstract` i nie ma pola `image`, build nie tworzy automatycznej grafiki.

## Priorytet redakcyjny

Kolejność wyboru:
1. dobre prawdziwe zdjęcie bezpośrednio związane z tekstem,
2. publikacja bez obrazu,
3. ilustracja abstrakcyjna tylko jako świadoma decyzja redakcyjna.

Obraz ma wnosić kontekst albo atmosferę. Nie jest obowiązkowym wypełniaczem layoutu.
