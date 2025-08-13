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
      allowNull: false,
      unique: true,
    },
    walletBal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
      allowNull: true,
    },
    subStatus: {
      type: DataTypes.ENUM("inactive", "active", "past_due"),
      defaultValue: "inactive",
    },
    subExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    subAmount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subPeriod: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subAuthorizationCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notificationPush: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    notificationPushToken: {
      type: DataTypes.STRING,
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
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    ratingNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });

  return User;
};
