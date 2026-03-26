// Mock API Service - имитация бэкенда с задержкой

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Хранилище данных в памяти (можно заменить на localStorage)
let users = [];
let games = [
    {
        id: '1',
        title: 'Вечерний футбол в парке',
        date: '2026-01-20',
        time: '18:00',
        location: 'Центральный парк, поле №2',
        maxPlayers: 14,
        currentPlayers: 8,
        organizer: 'Алексей К.',
        description: 'Дружеская игра 7 на 7. Приветствуются игроки любого уровня!',
        status: 'open'
    },
    {
        id: '2',
        title: 'Турнир выходного дня',
        date: '2026-01-25',
        time: '10:00',
        location: 'Стадион "Олимп"',
        maxPlayers: 22,
        currentPlayers: 18,
        organizer: 'Спортклуб "Динамо"',
        description: 'Мини-турнир с призами. Формат 5 на 5.',
        status: 'open'
    },
    {
        id: '3',
        title: 'Тренировка для новичков',
        date: '2026-01-22',
        time: '16:00',
        location: 'Школа №15, спортплощадка',
        maxPlayers: 16,
        currentPlayers: 16,
        organizer: 'Тренер Михаил',
        description: 'Базовые навыки и небольшая игра. Идеально для начинающих.',
        status: 'full'
    }
];

let currentUser = null;

// Регистрация
export const register = async (userData) => {
    await delay(1500);

    // Проверка существующего пользователя
    const exists = users.find(u => u.email === userData.email);
    if (exists) {
        throw new Error('Пользователь с таким email уже существует');
    }

    const newUser = {
        id: String(Date.now()),
        ...userData,
        createdAt: new Date().toISOString(),
        profile: null
    };

    users.push(newUser);
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));

    return { success: true, user: newUser };
};

// Обновление профиля
export const updateProfile = async (profileData) => {
    await delay(1000);

    if (!currentUser) {
        throw new Error('Пользователь не авторизован');
    }

    currentUser.profile = profileData;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    return { success: true, user: currentUser };
};

// Получение текущего пользователя
export const getCurrentUser = () => {
    if (currentUser) return currentUser;

    const saved = localStorage.getItem('currentUser');
    if (saved) {
        currentUser = JSON.parse(saved);
        return currentUser;
    }

    return null;
};

// Выход
export const logout = () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
};

// Получение списка игр
export const getGames = async (filters = {}) => {
    await delay(800);

    let result = [...games];

    if (filters.status) {
        result = result.filter(g => g.status === filters.status);
    }

    if (filters.date) {
        result = result.filter(g => g.date === filters.date);
    }

    return { success: true, games: result };
};

// Создание игры
export const createGame = async (gameData) => {
    await delay(1200);

    const newGame = {
        id: String(Date.now()),
        ...gameData,
        currentPlayers: 1,
        organizer: currentUser?.name || 'Аноним',
        status: 'open',
        createdAt: new Date().toISOString()
    };

    games.unshift(newGame);

    return { success: true, game: newGame };
};

// Запись на игру
export const joinGame = async (gameId) => {
    await delay(1000);

    const game = games.find(g => g.id === gameId);
    if (!game) {
        throw new Error('Игра не найдена');
    }

    if (game.currentPlayers >= game.maxPlayers) {
        throw new Error('Все места заняты');
    }

    game.currentPlayers += 1;

    if (game.currentPlayers >= game.maxPlayers) {
        game.status = 'full';
    }

    return { success: true, game };
};

// Получение игры по ID
export const getGameById = async (gameId) => {
    await delay(500);

    const game = games.find(g => g.id === gameId);
    if (!game) {
        throw new Error('Игра не найдена');
    }

    return { success: true, game };
};

export default {
    register,
    updateProfile,
    getCurrentUser,
    logout,
    getGames,
    createGame,
    joinGame,
    getGameById
};
