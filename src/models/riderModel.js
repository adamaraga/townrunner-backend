module.exports = (sequelize, DataTypes) => {
  const Rider = sequelize.define("rider", {
    // Primary key UUID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    idNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    idFrontImg: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    idBackImg: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    vehicleBrand: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plateNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Insurance documents
    insuranceExpiry: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    insuranceImg: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Vehicle & road-worthiness documents
    vehicleImg: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roadWorthinessImg: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Driver's license documents
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    licenseExpiry: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    licenseFrontImg: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    licenseBackImg: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    selfieWithLicense: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    status: {
      type: DataTypes.ENUM("pending", "active", "suspended"),
      allowNull: false,
      defaultValue: "pending",
    },
  });

  //   Rider.associate = (models) => {
  //     Rider.belongsTo(models.User, {
  //       foreignKey: 'userId',
  //       as: 'user',
  //     });
  //   };

  return Rider;
};
