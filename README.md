# Pendolare SBB — Chiasso ⇄ Bioggio

Due web app che mostrano i **3 treni imminenti** del percorso casa-lavoro, con dati in tempo reale del trasporto pubblico svizzero (SBB / FLP). Pensate per essere aggiunte alla home dell'iPhone come due icone separate.

## Le due app

- **Andata** — Chiasso → Bioggio Molinazzo (verso il lavoro): https://ricknewere.github.io/pendolare-sbb/andata/
- **Ritorno** — Bioggio Molinazzo → Chiasso (verso casa): https://ricknewere.github.io/pendolare-sbb/ritorno/

Pagina di scelta: https://ricknewere.github.io/pendolare-sbb/

Le due app condividono lo stesso codice (`style.css` e `app.js`): cambia solo la direzione. Icone distinte: freccia **rossa a destra** per l'andata, **blu a sinistra** per il ritorno.

## Installazione su iPhone

Per ciascuna app, sull'iPhone:
1. Apri l'URL in **Safari**.
2. Tocca **Condividi** → **Aggiungi a Home**.
3. Ripeti con l'altro URL: avrai **due icone separate** sulla home.

## Cosa mostra

Per ognuno dei 3 treni imminenti, una **timeline porta a porta** con l'orario di ogni passaggio:
- **Esci di casa / dal lavoro**: orario in cui uscire, calcolato togliendo i minuti a piedi fino alla stazione.
- **Ogni tratta con il suo orario di partenza**, incluso il **treno intermedio da Lugano** (la coincidenza `S60`/`RE80`): così sai a che ora parte anche il secondo treno.
- **Arrivo** alla stazione di destinazione.
- **Arrivo a destinazione** (lavoro / casa): orario di arrivo del treno più i minuti a piedi finali.
- Conto alla rovescia grande: **"min prima di uscire"** (usa l'orario reale, ritardi inclusi; diventa "esci adesso" a zero).

Tempi a piedi impostati:
- **Andata**: 7 min per arrivare in stazione (Chiasso) + 10 min dalla stazione (Bioggio Molinazzo) al lavoro.
- **Ritorno**: il contrario, 10 min alla stazione (Bioggio Molinazzo) + 7 min dalla stazione (Chiasso) a casa.

**Ritardi**: ogni tratta mostra l'orario reale in giallo con i minuti (`+n′`) se in ritardo, altrimenti "in orario". Se il binario reale cambia rispetto all'orario, lo segnala come "(cambiato)".

Si aggiorna da sola: dati ogni 60 secondi, orologio e conto alla rovescia ogni secondo.

## Dati e ritardi

Fonte: [transport.opendata.ch](https://transport.opendata.ch), l'API ufficiale dei dati aperti del trasporto pubblico svizzero (gratuita, senza chiave). Il ritardo viene letto dal campo `delay` di ogni fermata e, in mancanza, calcolato dalla differenza tra orario di orario e orario previsto (`prognosis`). Nota: la disponibilità del dato in tempo reale dipende dalla fonte SBB e può non essere sempre presente.

## Struttura

```
index.html            pagina di scelta (andata / ritorno)
style.css             stile condiviso
app.js                logica condivisa (fetch, ritardi, rendering)
andata/index.html     app andata  (imposta from=Chiasso, to=Bioggio)
andata/manifest.webmanifest
ritorno/index.html    app ritorno (imposta from=Bioggio, to=Chiasso)
ritorno/manifest.webmanifest
icon-andata-*.png     icone andata (rosse)
icon-ritorno-*.png    icone ritorno (blu)
.github/workflows/deploy.yml   deploy automatico su GitHub Pages
```

## Personalizzare

Stazioni e tempi a piedi sono impostati in fondo a ogni `index.html`:

```js
window.APP_CONFIG = {
  from: "Chiasso", to: "Bioggio Molinazzo", dir: "andata",
  walkBefore: 7, walkAfter: 10, beforeLabel: "Esci di casa", afterLabel: "Al lavoro",
};
```

Ogni push su `main` ripubblica il sito tramite GitHub Actions.
