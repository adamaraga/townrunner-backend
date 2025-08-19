module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define("payment", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    deliveryId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    // reference returned by Paystack
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    // amount in Naria
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // subscription period in month
    subPeriod: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("deposit", "withdraw"),
      allowNull: false,
      defaultValue: "deposit",
    },
    reason: {
      type: DataTypes.ENUM("delivery", "wallet", "subscription"),
      allowNull: false,
      defaultValue: "delivery",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
  });

  //   Payment.associate = (models) => {
  //     Payment.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  //     Payment.belongsTo(models.Delivery, { foreignKey: 'deliveryId', as: 'delivery' });
  //   };

  return Payment;
};
