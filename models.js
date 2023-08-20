const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./db');

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
    chatId: {type: DataTypes.STRING, unique: true},
    success: {type: DataTypes.BOOLEAN, defaultValue: true},
    status: { type: DataTypes.BOOLEAN, defaultValue: false},
    balance: {type: DataTypes.INTEGER, defaultValue: 5000},
    verif: {type: DataTypes.BOOLEAN, defaultValue: false},
    deals: {type: DataTypes.INTEGER, defaultValue: 0},
    goodDeals: {type: DataTypes.INTEGER, defaultValue: 0},
    badDeals: {type: DataTypes.INTEGER, defaultValue: 0},
    registrationDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    worker: { type: DataTypes.STRING, defaultValue: ''},
    mamonts: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: []},
    minDeposit: { type: DataTypes.INTEGER, defaultValue: 1000},
    username: { type: DataTypes.STRING, defaultValue: ''},
    vivod: { type: DataTypes.INTEGER, defaultValue: 0},
    vivodSuccess: { type: DataTypes.BOOLEAN, defaultValue: true},
    isBlocked: { type: DataTypes.BOOLEAN, defaultValue: false},
    depositCard: { type: DataTypes.STRING, defaultValue: ''},
    depositQiwi: { type: DataTypes.STRING, defaultValue: ''},
    isWorker: { type: DataTypes.BOOLEAN, defaultValue: false},
});

module.exports = User;