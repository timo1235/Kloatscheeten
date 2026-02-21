# Kloatscheeten Tracker App

**Datum:** 2026-02-21
**Status:** Brainstorm

## Was wir bauen

Eine mobile-optimierte PWA zum Live-Tracking von Kloatscheeten-Spielen. Mehrere Spieler können auf ihren eigenen Handys den aktuellen Spielstand verfolgen. Die App wird selbst-gehostet auf einer Synology NAS (Docker, Port 11000).

### Kernfunktionen

1. **Spiel erstellen** - Ein Spieler erstellt ein neues Spiel, legt Teams und Spieler fest
2. **Per Link beitreten** - Link wird per WhatsApp geteilt, jeder der ihn oeffnet sieht das Spiel
3. **Wuerfe tracken** - Zaehler pro Team, wer gerade dran ist wird angezeigt
4. **Werfer-Reihenfolge** - App zeigt an welcher Spieler als naechstes wirft
5. **Live-Sync** - Alle Handys sehen Updates in Echtzeit via WebSocket

## Warum dieser Ansatz

### PWA statt native App
- Kein App Store noetig, jeder oeffnet einfach eine URL
- Funktioniert auf iOS und Android
- Kann als "App" zum Homescreen hinzugefuegt werden
- Offline-faehig mit Service Workers

### Eigener Server + WebSocket statt Cloud-Dienst
- Laeuft auf der eigenen Synology NAS
- Keine externen Abhaengigkeiten oder Kosten
- Volle Kontrolle ueber die Daten
- SQLite fuer Persistenz - simpel, kein DB-Server noetig
- WebSocket (Socket.io) fuer Echtzeit-Updates

### Wuerfe zaehlen statt Schoett-System
- Einfacher zu tracken und zu verstehen
- Passt zur Hobby-Variante
- Team mit weniger Wuerfen ueber die Strecke gewinnt

## Kloatscheeten-Regeln (Hobby-Variante)

Fuer die App relevant:

- **2 Teams**, jeweils 4-6 Spieler
- Teams werfen **abwechselnd**, das zurueckliegende Team wirft zuerst
- Jeder Werfer setzt dort an, wo der eigene Kloat liegen blieb
- Spieler werfen in **fester Reihenfolge** (1, 2, 3, ... und dann wieder von vorne)
- **Gewinner**: Team mit weniger Wuerfen ueber die gesamte Strecke
- Verlaesst der Kloat den Weg, wird auf Hoehe des Abgangs weitergeworfen

## Schluesselentscheidungen

1. **Wertung**: Wuerfe zaehlen (nicht Schoett-Punkte)
2. **Sync**: Jeder auf eigenem Handy, Echtzeit via WebSocket
3. **Hosting**: Docker auf Synology NAS, Port 11000
4. **Beitritt**: Einfacher Link (per WhatsApp teilbar)
5. **Tech**: PWA (Web-App) + eigener Bun/Node Server + SQLite
6. **Offline**: App muss mit lueckenhaftem Empfang umgehen koennen

## Tech Stack

- **Frontend**: Vite + Vue 3 als PWA
- **Backend**: Bun oder Node.js Server
- **Realtime**: Socket.io (WebSocket mit Fallback)
- **Datenbank**: SQLite (via better-sqlite3 oder bun:sqlite)
- **Deployment**: Docker Container auf Synology (Port 11000)

## Spielablauf in der App

```
1. Spieler oeffnet App -> "Neues Spiel erstellen"
2. Gibt Teamnamen ein, fuegt Spieler hinzu (Name pro Team)
3. Bekommt einen Link -> teilt ihn per WhatsApp
4. Andere oeffnen den Link -> sehen das Spiel
5. Spiel startet:
   - Anzeige: Team A: 0 Wuerfe | Team B: 0 Wuerfe
   - Anzeige: "Naechster Werfer: [Name] (Team A)"
   - Button: "Wurf!" (nur vom Ersteller bedienbar - ein Handy steuert alles)
   - Nach Klick: Zaehler +1, naechster Spieler wird angezeigt
6. Am Ende: Ergebnis-Screen mit Zusammenfassung
```

## Geklaerte Fragen

1. **Wer bedient die App?** Ein Spieler (der Ersteller) bedient alles. Die anderen sehen den Live-Stand auf ihren Handys, aber nur als Zuschauer.
2. **Frontend-Framework**: Vue 3
3. **Spiel-Archiv**: Nein - nur das aktuelle Spiel zaehlt, kein Archiv noetig.
4. **Wertung**: Einfaches Wuerfe-Zaehlen
5. **Teamgroesse**: 4-6 Spieler pro Team
6. **Beitritt**: Link per WhatsApp teilen
