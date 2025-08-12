module.exports = (sequelize, DataTypes) => {
  const Chat = sequelize.define("chat", {
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
    userReadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    riderReadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  });

  // Chat.associate = models => {
  //   Chat.hasMany(models.Message, { foreignKey: 'chatId', as: 'messages' });
  //   if (models.Delivery) Chat.belongsTo(models.Delivery, { foreignKey: 'deliveryId', as: 'delivery' });
  // };

  return Chat;
};
