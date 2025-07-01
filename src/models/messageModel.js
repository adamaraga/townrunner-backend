module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define("message", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT("medium"),
      allowNull: false,
    },
  });

  return Message;
};
