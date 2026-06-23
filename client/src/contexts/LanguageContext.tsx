import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'es';

export const translations = {
  en: {
    // Navigation & Header
    home: 'Home',
    language: 'Language',
    english: 'English',
    spanish: 'Spanish',
    
    // Home Page
    title: 'VAMPIRE HIGH',
    subtitle: 'A social deduction game where blood and betrayal lines the hallways of high school.',
    hostGame: 'Host a Game',
    joinGame: 'Join a Game',
    gameInfo: '4-10 players · 3 minute rounds · One vampire among you',
    
    // Lobby
    waitingRoom: 'Waiting Room',
    shareCode: 'Share the code to summon your classmates',
    gameCode: 'Game Code',
    tapCodeToCopy: 'Tap code to copy',
    scanToJoin: 'Scan to join on your phone',
    copyJoinLink: 'Copy join link',
    players: 'Players',
    needMore: 'Need 3 more',
    needMorePlayers: 'Need 3 more players',
    you: 'You',
    waitingForPlayers: 'Waiting for players...',
    playerCount: 'Players',
    startGame: 'Start Game',
    minimumPlayers: 'Minimum 4 players required',
    maximumPlayers: 'Maximum 10 players',
    joinLobby: 'Join Game',
    enterCode: 'Enter game code',
    enterName: 'Enter your name',
    join: 'Join',
    invalidCode: 'Invalid game code',
    
    // Gameplay
    round: 'Round',
    discussion: 'Discussion',
    voting: 'Voting',
    roleReveal: 'Your Role',
    ability: 'Ability',
    vampire: 'Vampire',
    eliminated: 'Eliminated',
    alive: 'Alive',
    
    // Abilities
    abilityTitle: 'Ability',
    abilityUsed: 'Ability used',
    abilityAvailable: 'Ability available',
    useAbility: 'Use Ability',
    
    // Voting
    vote: 'Vote',
    voteFor: 'Vote for',
    votingTime: 'Voting Time',
    votes: 'Votes',
    eliminate: 'Eliminate',
    
    // Results
    gameOver: 'Game Over',
    vampireWins: 'Vampire Wins!',
    highschoolWins: 'The High School Wins!',
    finalRoles: 'Final roles and status',
    
    // Rules
    rules: 'Rules',
    roleReference: 'Role Reference',
    
    // Common
    back: 'Back',
    next: 'Next',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  es: {
    // Navigation & Header
    home: 'Inicio',
    language: 'Idioma',
    english: 'Inglés',
    spanish: 'Español',
    
    // Home Page
    title: 'VAMPIRE HIGH',
    subtitle: 'Un juego de deducción social donde la sangre y la traición recorren los pasillos de la escuela secundaria.',
    hostGame: 'Crear Juego',
    joinGame: 'Unirse a Juego',
    gameInfo: '4-10 jugadores · Rondas de 3 minutos · Un vampiro entre ustedes',
    
    // Lobby
    waitingRoom: 'Sala de Espera',
    shareCode: 'Comparte el código para convocar a tus compañeros',
    gameCode: 'Código del Juego',
    tapCodeToCopy: 'Toca el código para copiar',
    scanToJoin: 'Escanea para unirte en tu teléfono',
    copyJoinLink: 'Copiar enlace de unión',
    players: 'Jugadores',
    needMore: 'Necesita 3 más',
    needMorePlayers: 'Necesita 3 jugadores más',
    you: 'Tú',
    waitingForPlayers: 'Esperando jugadores...',
    playerCount: 'Jugadores',
    startGame: 'Iniciar Juego',
    minimumPlayers: 'Se requieren mínimo 4 jugadores',
    maximumPlayers: 'Máximo 10 jugadores',
    joinLobby: 'Unirse al Juego',
    enterCode: 'Ingrese el código del juego',
    enterName: 'Ingrese su nombre',
    join: 'Unirse',
    invalidCode: 'Código de juego inválido',
    
    // Gameplay
    round: 'Ronda',
    discussion: 'Discusión',
    voting: 'Votación',
    roleReveal: 'Tu Rol',
    ability: 'Habilidad',
    vampire: 'Vampiro',
    eliminated: 'Eliminado',
    alive: 'Vivo',
    
    // Abilities
    abilityTitle: 'Habilidad',
    abilityUsed: 'Habilidad usada',
    abilityAvailable: 'Habilidad disponible',
    useAbility: 'Usar Habilidad',
    
    // Voting
    vote: 'Votar',
    voteFor: 'Votar por',
    votingTime: 'Tiempo de Votación',
    votes: 'Votos',
    eliminate: 'Eliminar',
    
    // Results
    gameOver: 'Juego Terminado',
    vampireWins: '¡El Vampiro Gana!',
    highschoolWins: '¡La Escuela Gana!',
    finalRoles: 'Roles finales y estado',
    
    // Rules
    rules: 'Reglas',
    roleReference: 'Referencia de Roles',
    
    // Common
    back: 'Atrás',
    next: 'Siguiente',
    close: 'Cerrar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null;
    if (saved && (saved === 'en' || saved === 'es')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
