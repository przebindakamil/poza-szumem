# Poza Szumem — system ilustracji redakcyjnych

## Cel

Każdy artykuł powinien mieć własną, spójną ilustrację redakcyjną. Obraz ma porządkować stronę, budować rozpoznawalność magazynu i sugerować temat bez dosłownego streszczania artykułu.

Nie używamy przypadkowych stockowych zdjęć jako domyślnego rozwiązania.

## Domyślny system

Jeśli artykuł nie ma ręcznie wskazanego pola `image`, build automatycznie generuje ilustrację Poza Szumem.

Generator tworzy:

- hero: `assets/articles/<slug>.webp`, 1600×1200, proporcja 4:3,
- social image: `assets/articles/<slug>-social.jpg`, 1200×630,
- podpis: `Ilustracja: Poza Szumem`,
- tekst alternatywny na podstawie wybranego motywu.

Pliki powstają podczas buildu i nie muszą być commitowane do repozytorium.

## Art direction

Stałe cechy ilustracji:

- spokojny, minimalistyczny styl redakcyjny,
- geometria i abstrakcja zamiast dosłownych stockowych scen,
- dużo wolnej przestrzeni,
- brak napisów, logo i watermarków na obrazie,
- zgaszona paleta oparta o krem, grafit i kolor akcentu kategorii,
- jeden dominujący motyw,
- bez fotorealistycznych ludzi,
- bez agresywnych gradientów i efektów 3D,
- obraz ma wspierać tekst, a nie konkurować z nagłówkiem.

## Motywy

Dostępne wartości `visualMotif`:

- `orbit` — kosmos, nauka, systemy, zależności,
- `network` — AI, mózg, informacja, komunikacja,
- `flow` — pieniądze, procesy, handel, wymiana,
- `grid` — infrastruktura, miasta, logistyka, konstrukcje,
- `waves` — woda, pogoda, natura, fale,
- `rings` — czas, pamięć, cykle, oczekiwanie,
- `layers` — kultura, sztuka, historia, interpretacja,
- `signal` — sport, ciało, rytm, energia, pomiar.

Jeśli pole nie istnieje, build wybiera motyw automatycznie na podstawie tytułu, słów kluczowych i kategorii.

## Front matter

Minimalnie nie trzeba dodawać niczego — ilustracja powstanie automatycznie.

Jeśli chcemy kontrolować kierunek:

```yaml
visualMotif: "orbit"
visualAlt: "Abstrakcyjna ilustracja z orbitami satelitów i motywem odmierzania czasu."
```

Można też całkowicie zastąpić grafikę własnym obrazem:

```yaml
image: "assets/articles/wlasny-obraz.webp"
imageAlt: "Opis zawartości obrazu"
imageCredit: "Fot. lub ilustracja: autor"
```

Wtedy generator automatyczny nie nadpisuje pliku.

## Zasada redakcyjna

Dla nowych tekstów automatyzacja powinna świadomie wybierać `visualMotif` i pisać jednozdaniowy `visualAlt`. Generator pozostaje fallbackiem, dzięki czemu brak danych wizualnych nigdy nie blokuje publikacji.
