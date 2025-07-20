module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define("message", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    chatId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  //  Message.associate = models => {
  //   Message.belongsTo(models.Chat, { foreignKey: 'chatId', as: 'chat' });
  //   Message.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
  // };

  return Message;
};
