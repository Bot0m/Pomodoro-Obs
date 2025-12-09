# Pomodoro OBS Widget

## 🇫🇷 Mode d'emploi

- **Installation OBS**
  1. Ouvre OBS → Sources → **+** → **Browser**.
  2. Coche **Local file** et sélectionne `index.html` dans le dossier.
  3. Taille suggérée : `900x500` (à ajuster selon ta scène).
  4. Valide puis **Interagir…** sur la source pour utiliser l’interface.

- **Contrôles**
  - ⏮ redémarre le segment en cours (focus ou pause).
  - ▶ / ⏸ démarrer / mettre en pause.
  - ⏭ passer au segment suivant (compte le cycle).
  - ⏹ reset complet (timer + cycles).
  - ⚙ affiche/masque le panneau de réglages.

- **Réglages (sauvegarde locale)**
  - Focus (minutes)
  - Short Break (minutes)
  - Long Break (minutes)
  - Cycles (entre 2 et 8, ronds sous le chrono)
  - Background color (hex, ex. `#BA4949`)
  - Text color (hex, ex. `#FFFFFF`)
  - Song alert (son en fin de segment)

- **Notes**
  - Police : Inter (chargée via Google Fonts). Si aucune connexion, la police système sera utilisée.
  - Les réglages sont stockés dans le `localStorage` d’OBS.

## 🇬🇧 Usage

- **Install in OBS**
  1. OBS → Sources → **+** → **Browser**.
  2. Check **Local file** and pick `index.html`.
  3. Suggested size: `900x500` (adjust to your scene).
  4. Confirm and use **Interact…** on the source to control it.

- **Controls**
  - ⏮ restarts the current segment (focus or break).
  - ▶ / ⏸ start / pause.
  - ⏭ skip to next segment (cycle is counted).
  - ⏹ full reset (timer + cycles).
  - ⚙ toggle the settings panel.

- **Settings (persisted locally)**
  - Focus (minutes)
  - Short Break (minutes)
  - Long Break (minutes)
  - Cycles (2–8, shown as dots under the timer)
  - Background color (hex, e.g. `#BA4949`)
  - Text color (hex, e.g. `#FFFFFF`)
  - Song alert (sound at the end of a segment)

- **Notes**
  - Font: Inter (via Google Fonts). Falls back to system if offline.
  - Settings are saved in OBS `localStorage`.
