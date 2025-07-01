module.exports = (sequelize, DataTypes) => {
  const Confirmation = sequelize.define("confirmation", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    // userId: {
    //   type: DataTypes.UUID,
    //   allowNull: false,
    // },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channel: {
      type: DataTypes.ENUM("sms", "whatsapp"),
      allowNull: false,
      defaultValue: "sms",
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return Confirmation;
};
