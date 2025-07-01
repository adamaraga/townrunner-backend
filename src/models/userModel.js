module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Must be an EMAIL",
        },
      },
    },
    role: {
      type: DataTypes.ENUM("user", "rider", "admin"),
      allowNull: false,
      defaultValue: "user",
    },
    image: {
      type: DataTypes.STRING,
    },
    phone: {
      type: DataTypes.STRING,
    },
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true, // null for users who signed up via email/password
    },
    referralCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    referralCodeInvite: {
      type: DataTypes.STRING,
    },
    subStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    subExpiry: {
      type: DataTypes.DATE,
    },
    subAmount: {
      type: DataTypes.STRING,
    },
    subPeriod: {
      type: DataTypes.STRING,
    },
    notificationPush: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notificationEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notificationInApp: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });

  return User;
};
