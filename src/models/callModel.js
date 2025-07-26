module.exports = (sequelize, DataTypes) => {
  const Call = sequelize.define("call", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    callerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    calleeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    channelName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "ongoing", "ended", "failed"),
      defaultValue: "pending",
      allowNull: false,
    },
  });

  // CallSession.associate = models => {
  //   const { User } = models;
  //   CallSession.belongsTo(User, { foreignKey: 'callerId', as: 'caller' });
  //   CallSession.belongsTo(User, { foreignKey: 'calleeId', as: 'callee' });
  // };

  return Call;
};
