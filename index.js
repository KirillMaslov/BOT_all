const TelegramApi = require('node-telegram-bot-api')

const token = '6042934250:AAGNtlwxcIiyqesnboO97O8a89JuE1RLFy4'

const bot = new TelegramApi(token, { polling: true });

let MinDep = 0;

const ButtonOptions = {
    reply_markup: JSON.stringify({
        keyboard: [
            [{ text: '👤 Профиль' }],
            [{ text: '💼 Трейдинг' }],
            [{ text: '🌟 О проекте' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    })
};

const usersActivated = new Set();

const MesButtoneOptiones = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: 'Настройки', callback_data: 'settings' }]
        ]
    })
};

const InfoButtonOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: '🔍 Инфо канал', url: 'https://t.me/+arEStT1GgsA3ZTAy' }],
            [{ text: '📈 Выплаты', url: 'https://t.me/+QuTcxK48VGIyNWMy' }],
            [{ text: '📚 Мануалы', url: 'https://t.me/+8ySjyY6GyxhjYjI6' }],
            [{ text: '📞 Чат воркеров', url: 'https://t.me/+gtcl3iHe2Ms2MjVi' }]
        ]
    })
};

const SettingsOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: 'Увеличить', callback_data: 'additional_button' }]
        ]
    })
};

bot.setMyCommands([
    { command: 'start', description: 'Запуск бота' },
]);

bot.on('message', async (msg) => {
    console.log(msg);
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!usersActivated.has(chatId) && (text === '/start')) {
        bot.sendMessage(chatId, 'Привет! Чем могу помочь?', ButtonOptions);
        // Добавляем пользователя в множество активированных пользователей
        usersActivated.add(chatId);
    } else if (usersActivated.has(chatId) && (text === '/start')) {
        // Если пользователь уже активировался, при повторном нажатии /start открываем профиль
        const Status = 'Новичек';
        const Profits = 0;
        const ProfMessage = `Ваш id [${msg.from.id}]\n\n Ваш статус: ${Status}\n\nСумма ваших профитов: ${Profits}₽`;
        return bot.sendMessage(chatId, ProfMessage, MesButtoneOptiones);
    }

    if (text === '/profile' || text === '👤 Профиль') {
        const Status = 'Новичек';
        const Profits = 0;
        const ProfMessage = `Ваш id [${msg.from.id}]\n\n Ваш статус: ${Status}\n\nСумма ваших профитов: ${Profits}₽`;
        return bot.sendMessage(chatId, ProfMessage, MesButtoneOptiones);
    }

    if (text === '/trade' || text === '💼 Трейдинг') {
        const referralId = generateReferralId(chatId);
        const referralLink = `https://t.me/BingX_wallet_bot?start=${referralId}`;
        const tradeMessage = `📊 Трейдинг  \n\n 🔐 Ваша реферальная ссылка ~ \n ${referralLink} \n\n 💳 Реквизиты с которых Вы пополняли ~ `;

        // Создаем клавиатуру для кнопки "Управление мамонтами"
        const tradeKeyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Управление мамонтами', callback_data: 'management' }]
                ]
            }
        };

        // Отправляем сообщение о трейдинге с клавиатурой "Управление мамонтами"
        return bot.sendMessage(chatId, tradeMessage, tradeKeyboard);
    }

    if (text === '/info' || text === '🌟 О проекте') {
        const infoMessage = 'Приветсвую тебя в нашей команде!';
        return bot.sendMessage(chatId, '📑 Информация «Hype team»\n' +
            '\n' +
            '🗓 Дата открытия : 05.09.2022\n' +
            '➖➖➖➖➖➖➖\n' +
            'Профитов на сумму : 12261090 ₽ \n' +
            'Профитов всего : 1300\n' +
            '➖➖➖➖➖➖➖\n' +
            '💸 Процентная ставка :\n' +
            '\n' +
            'Обычное пополнение — 75%\n' +
            'Залёт через поддержку — 60%\n' +
            'Прямой перевод — 70%\n' +
            '➖➖➖➖➖➖➖\n' +
            '👑 Команда проекта : \n' +
            '\n' +
            'ТС/ТП: @hype_rokky\n' +
            'Модератор: @\n' +
            'Наставник: @mobilizator_aye\n' +
            'Наставник: @-\n' +
            '➖➖➖➖➖➖➖\n' +
            'Состояние сервисов:\n' +
            '\n' +
            '🌕 FULL-WORK\n', InfoButtonOptions);
    }

});

bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const buttonData = callbackQuery.data;

    if (buttonData === 'settings') {
        bot.sendMessage(chatId, `Минимальный депозит: ${MinDep}`, SettingsOptions);
    } else if (buttonData === 'additional_button') {
        MinDep *= 2;
        bot.sendMessage(chatId, 'Минимальный депозит увеличен!');
    } else if (buttonData === 'management') {
        // Обработка нажатия на кнопку "Управление мамонтами"
        bot.sendMessage(chatId, 'Здесь будет функционал для управления мамонтами.');
    } else if (buttonData === 'chat_info') {
        bot.sendMessage(chatId, 'Здесь информация о проекте.');
    } else if (buttonData === 'chat_payed') {
        bot.sendMessage(chatId, 'Здесь статистика проекта.');
    } else if (buttonData === 'manuals') {
        bot.sendMessage(chatId, 'Здесь контактная информация.');
    } else if (buttonData === 'chat_workers') {
        bot.sendMessage(chatId, 'Здесь будут инструкции.');
    }

    // Отправляем ответ на нажатие кнопки
    bot.answerCallbackQuery(callbackQuery.id);
});

function generateReferralId(chatId) {
    return chatId.toString();
}



