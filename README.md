# Pendolare SBB — Chiasso ⇄ Bioggio

Due web app che mostrano i **3 treni imminenti** del percorso casa-lavoro, con dati in tempo reale del trasporto pubblico svizzero (SBB / FLP). Pensate per essere aggiunte alla home dell'iPhone come due icone separate.

## Le due app

- **Andata** — Chiasso → Bioggio (verso il lavoro): https://ricknewere.github.io/pendolare-sbb/andata/
- **Ritorno** — Bioggio → Chiasso (verso casa): https://ricknewere.github.io/pendolare-sbb/ritorno/

Pagina di scelta: https://ricknewere.github.io/pendolare-sbb/

Le due app condividono lo stesso codice (`style.css` e `app.js`): cambia solo la direzione. Icone distinte: freccia **rossa a destra** per l'andata, **blu a sinistra** per il ritorno.

## Installazione su iPhone

Per ciascuna app, sull'iPhone:
1. Apri l'URL in **Safari**.
2. Tocca **Condividi** → **Aggiungi a Home**.
3. Ripeti con l'altro URL: avrai **due icone separate** sulla home.

## Cosa mostra

Per ognuno dei 3 treni imminenti:
- Orario di partenza e conto alla rovescia ("min alla partenza").
- **Ritardi**: se il treno è in ritardo, l'orario di orario compare barrato con accanto l'orario reale in giallo e i minuti (`+n′ ritardo`); il conto alla rovescia usa l'orario reale. Se non c'è ritardo mostra "in orario".
- **Binario** di partenza; se il binario reale cambia rispetto all'orario, lo segnala come "(cambiato)".
- Le linee del percorso (es. `RE80` SBB → cambio a Lugano → `S60` FLP) e la durata.
- Orario di arrivo (in giallo con i minuti se in ritardo).

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

Le stazioni sono impostate in fondo a ogni `index.html`:

```js
window.APP_CONFIG = { from: "Chiasso", to: "Bioggio", dir: "andata" };
```

Ogni push su `main` ripubblica il sito tramite GitHub Actions.
