// models/TradeTransaction.js
"use strict";

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const TradeTransaction = sequelize.define(
    "TradeTransaction",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        offerEmail: {
            type: DataTypes.STRING,
            allowNull: false,
            references: { model: User, key: "email" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            validate: { isEmail: true },
        },

        accepterEmail: {
            type: DataTypes.STRING,
            allowNull: false,
            references: { model: User, key: "email" },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
            validate: { isEmail: true },
        },

        // Four possible values
        status: {
            type: DataTypes.ENUM("Offering", "Matching", "Complete", "Cancelled"),
            allowNull: false,
            defaultValue: "Offering",
        },

        // Money amounts (use DECIMAL to avoid float rounding issues)
        offerMoney: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
            validate: { min: 0 },
        },

        requestMoney: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
            validate: { min: 0 },
        },

        isOffererIDCard: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        isAccepterIDCard: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        isOffererConfirm: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        isAccepterConfirm: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        // Per-party ratings (1–10). Keep nullable so existing rows migrate cleanly.
        offererRating: {
            type: DataTypes.INTEGER, // portable across dialects
            allowNull: true,
            validate: { min: 1, max: 10 },
        },

        accepterRating: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: { min: 1, max: 10 },
        },
    },
    {
        timestamps: true,
        tableName: "TradeTransactions",
        indexes: [
            { fields: ["offerEmail"] },
            { fields: ["accepterEmail"] },
            { fields: ["status"] },
            { fields: ["offererRating"] },
            { fields: ["accepterRating"] },
        ],
        validate: {
            // parties must be different
            differentParties() {
                if (this.offerEmail === this.accepterEmail) {
                    throw new Error("offerEmail and accepterEmail must be different.");
                }
            },
            // if any rating is set, trade must be complete
            ratingsOnlyWhenComplete() {
                const hasAnyRating =
                    this.offererRating != null || this.accepterRating != null;
                if (hasAnyRating && (this.status !== "Complete" || this.status !== "Cancelled")) {
                    throw new Error(
                        "Ratings can only be set when the trade status is 'Complete'."
                    );
                }
            },
        },
    }
);

// Associations
User.hasMany(TradeTransaction, {
    foreignKey: "offerEmail",
    as: "OfferedTrades",
});
User.hasMany(TradeTransaction, {
    foreignKey: "accepterEmail",
    as: "AcceptedTrades",
});
TradeTransaction.belongsTo(User, {
    foreignKey: "offerEmail",
    as: "Offerer",
});
TradeTransaction.belongsTo(User, {
    foreignKey: "accepterEmail",
    as: "Accepter",
});

module.exports = TradeTransaction;
