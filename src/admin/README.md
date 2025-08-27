# 🎛️ Dashboard Amministrativa Exmatta

## 📋 Panoramica

La Dashboard Amministrativa è un sistema completo per gestire le attività di Exmatta, completamente separato dalla dashboard principale con un design distintivo in colori arancioni.

## 🚀 Funzionalità

### 🔐 Autenticazione
- **Login sicuro** con username e password
- **Credenziali demo**: `admin` / `exmatta2024`
- **Sessione persistente** con localStorage
- **Logout** con pulizia completa della sessione

### 📊 Dashboard Principale
- **Statistiche in tempo reale** per corsi e prenotazioni
- **Azioni rapide** per operazioni comuni
- **Attività recenti** del sistema
- **Indicatori di stato** del sistema

### 🎸 Gestione Corsi
- **Visualizzazione richieste** di iscrizione
- **Filtri avanzati** per status e ricerca
- **Gestione stati**: In Attesa, Approvata, Rifiutata
- **Sistema anti-spam** integrato
- **Dettagli completi** per ogni richiesta
- **Azioni rapide** per approvazione/rifiuto

### 🎤 Gestione Prenotazioni Sala Prove
- **Calendario interattivo** con visualizzazione prenotazioni
- **Navigazione mensile** completa
- **Gestione prenotazioni** per data
- **Form di aggiunta** nuove prenotazioni
- **Stati prenotazioni**: Confermata, In Attesa, Cancellata
- **Gestione conflitti** e sovrapposizioni

## 🎨 Design e UX

### 🎨 Schema Colori
- **Primario**: `#FF6B35` (Arancione vivace)
- **Secondario**: `#FF8C42` (Arancione chiaro)
- **Accento**: `#E55A2B` (Arancione scuro)
- **Sfondo**: `#FFF8F0` (Crema chiaro)

### ✨ Caratteristiche UI/UX
- **Animazioni fluide** con Framer Motion
- **Design responsive** per tutti i dispositivi
- **Transizioni ottimizzate** per performance
- **Feedback visivo** per tutte le azioni
- **Accessibilità** completa con ARIA labels

## 🏗️ Architettura Tecnica

### 📁 Struttura File
```
src/admin/
├── AdminApp.jsx              # App principale admin
├── components/                # Componenti React
│   ├── AdminHeader.jsx       # Header con logo e logout
│   ├── AdminSidebar.jsx      # Menu laterale di navigazione
│   ├── Dashboard.jsx         # Dashboard principale
│   ├── CorsiManager.jsx      # Gestione iscrizioni corsi
│   ├── PrenotazioniManager.jsx # Gestione sala prove
│   └── Login.jsx             # Form di autenticazione
├── styles/
│   └── admin.css             # Stili CSS dedicati
└── utils/
    └── auth.js               # Gestione autenticazione
```

### 🔧 Tecnologie Utilizzate
- **React 18** con Hooks moderni
- **Framer Motion** per animazioni
- **CSS Modules** per stili isolati
- **LocalStorage** per persistenza sessione
- **Responsive Design** con CSS Grid/Flexbox

## 📱 Responsive Design

### 🖥️ Desktop (1024px+)
- Layout a 3 colonne completo
- Sidebar fissa a sinistra
- Header sticky con controlli completi

### 📱 Tablet (768px - 1023px)
- Sidebar ridimensionata
- Layout adattivo per schermi medi
- Controlli ottimizzati per touch

### 📱 Mobile (fino a 767px)
- Layout a colonna singola
- Sidebar convertita in menu orizzontale
- Controlli touch-friendly
- Modali ottimizzati per mobile

## 🔒 Sicurezza

### 🛡️ Autenticazione
- **Validazione lato client** per credenziali
- **Gestione sessioni** sicura
- **Logout automatico** su chiusura browser
- **Protezione route** per utenti non autenticati

### 🚫 Anti-Spam (Corsi)
- **Sistema di flag** per richieste sospette
- **Gestione stati** per richieste problematiche
- **Filtri avanzati** per identificazione spam
- **Azioni rapide** per gestione spam

## 🚀 Utilizzo

### 🔑 Accesso
1. Clicca sul pulsante **"Admin"** nell'header della dashboard principale
2. Inserisci le credenziali:
   - **Username**: `admin`
   - **Password**: `exmatta2024`
3. Clicca **"Accedi"**

### 🎯 Navigazione
- **Dashboard**: Panoramica generale del sistema
- **Gestione Corsi**: Gestisci richieste iscrizione
- **Sala Prove**: Gestisci prenotazioni sala prove

### 📊 Gestione Corsi
1. **Visualizza** tutte le richieste
2. **Filtra** per status o cerca per nome/strumento
3. **Gestisci** ogni richiesta con azioni rapide
4. **Segna spam** per richieste sospette
5. **Approva/Rifiuta** richieste valide

### 🎤 Gestione Prenotazioni
1. **Naviga** nel calendario mensile
2. **Seleziona** una data per vedere le prenotazioni
3. **Aggiungi** nuove prenotazioni
4. **Gestisci** stati e conflitti
5. **Elimina** prenotazioni non necessarie

## 🔮 Sviluppi Futuri

### 📈 Funzionalità Pianificate
- **Sistema email** integrato per notifiche
- **Backup automatico** del database
- **Report e statistiche** avanzate
- **Gestione utenti** multipli
- **API REST** per integrazioni esterne
- **Sistema notifiche** push

### 🛠️ Miglioramenti Tecnici
- **Backend Node.js** con database SQLite
- **Autenticazione JWT** avanzata
- **Rate limiting** per protezione API
- **Logging completo** delle attività
- **Backup cloud** automatico

## 🐛 Risoluzione Problemi

### ❌ Problemi Comuni
- **Login non funziona**: Verifica credenziali demo
- **Stili non caricati**: Controlla import CSS admin
- **Componenti non renderizzati**: Verifica import React
- **Responsive non funziona**: Controlla media queries

### 🔧 Debug
- **Console browser** per errori JavaScript
- **Network tab** per problemi di caricamento
- **React DevTools** per debug componenti
- **LocalStorage** per verifica sessione

## 📞 Supporto

Per supporto tecnico o segnalazione bug:
- **Email**: info@exmatta.it
- **Dashboard**: Sezione "Segnala Bug" nella home

---

**Versione**: 1.0.0  
**Ultimo aggiornamento**: Agosto 2024  
**Sviluppato da**: AI Assistant per Exmatta
