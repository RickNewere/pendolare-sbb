# Pendolare SBB — Chiasso ⇄ Bioggio

Web app che mostra i **3 treni imminenti** per il percorso casa-lavoro tra **Chiasso** e **Bioggio**, in entrambe le direzioni, con dati in tempo reale del trasporto pubblico svizzero (SBB / FLP).

## Direzione

- **Andata** (Chiasso → Bioggio) e **ritorno** (Bioggio → Chiasso), con i due pulsanti in alto.
- Selezione **automatica** in base all'ora: prima delle 13:00 mostra l'andata, dopo il ritorno. Toccando un pulsante scegli manualmente.

## Sito live

**https://ricknewere.github.io/pendolare-sbb/**

## Installazione su iPhone

Il sito è pubblicato su GitHub Pages. Sull'iPhone:
1. Apri l'URL in **Safari**.
2. Tocca il pulsante **Condividi** → **Aggiungi a Home**.
3. Si apre a schermo intero come un'app (icona con le due frecce rosse).

## Cosa mostra

Per ciascuno dei 3 viaggi imminenti:
- Orario di partenza da Chiasso e conto alla rovescia ("min alla partenza").
- Ritardo in tempo reale (`+n′`) o "in orario".
- Binario di partenza.
- Le linee del percorso (es. `RE80` SBB → Lugano → `S60` FLP) e il cambio.
- Orario di arrivo a Bioggio e durata del viaggio.

Si aggiorna da solo: i dati ogni 60 secondi, orologio e conto alla rovescia ogni secondo.

## Come si usa

- **Semplice:** doppio clic su `index.html` (si apre nel browser predefinito).
- **Modalità cornice (schermo intero):** doppio clic su `Avvia cornice.bat` — apre Edge in modalità chiosco a tutto schermo. Per uscire: `Ctrl+W` o `Alt+F4`.

Non serve installare nulla, non serve una chiave API, non serve internet oltre alla connessione per scaricare gli orari.

## Dati

Fonte: [transport.opendata.ch](https://transport.opendata.ch), l'API ufficiale dei dati aperti del trasporto pubblico svizzero. Gratuita e senza autenticazione.

## Personalizzare

Tutto è in `index.html`. In cima allo `<script>`:

```js
const FROM = "Chiasso";   // stazione di partenza
const TO = "Bioggio";     // stazione di arrivo
const SHOW = 3;           // quanti viaggi mostrare
const REFRESH_MS = 60000; // ogni quanto aggiornare i dati (ms)
```

Per il percorso di ritorno (lavoro → casa) basta invertire `FROM` e `TO`.
