# Kolejka publikacji — Poza Szumem

Każdy gotowy, sprawdzony artykuł umieszczaj w katalogu `planned/` jako `slug.md`, z takim samym YAML front matter jak w `content/_example.md`. Pliki publikowane są **alfabetycznie po nazwie**. Aby sterować kolejnością, stosuj np. `01-tytul.md`, `02-tytul.md`; nazwa pliku staje się również adresem artykułu, dlatego zalecane są zwykłe opisowe slugi, a kolejność ustalaj z wyprzedzeniem.

Workflow `Publish queued article` uruchamia się codziennie o 08:00 czasu polskiego (z uwzględnieniem zmiany czasu) i przenosi **jeden** artykuł z `planned/` do `content/`, ustawiając jego datę publikacji na dzień uruchomienia. Zapis na `main` automatycznie uruchamia istniejący `Site checks`, który buduje, testuje i publikuje stronę.

Jeśli w `content/` jest już artykuł z dzisiejszą datą, workflow nie publikuje kolejnego. Jeśli kolejka jest pusta, workflow kończy się bez zmian. Można go uruchomić ręcznie z zakładki Actions; także wtedy nie publikuje dwóch tekstów w jednym dniu.

To rozwiązanie **nie generuje** artykułów ani nie potrzebuje API AI. Treści trzeba wcześniej przygotować i umieścić w kolejce. W przyszłości dashboard może wyświetlać pliki `planned/` wraz z metadanymi oraz pozwalać na edycję kolejności i treści.

Uwaga: zaplanowane GitHub Actions mogą uruchamiać się z opóźnieniem. W ustawieniach repozytorium `Settings → Actions → General → Workflow permissions` musi być dozwolony zapis przez `GITHUB_TOKEN`, a ochrona gałęzi `main` musi pozwalać botowi na commit.
