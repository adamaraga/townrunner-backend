module.exports = (sequelize, DataTypes) => {
  const Delivery = sequelize.define("delivery", {
    // Primary key UUID
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    riderUserId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    distance: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    // Main route
    originAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originLat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    originLng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    destinationAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    destinationLat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    destinationLng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    destinationOtp: {
      type: DataTypes.STRING(4),
      allowNull: false,
    },

    // Optional stops
    stopAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stopLat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    stopLng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    stopOtp: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    stop2Address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stop2Lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    stop2Lng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    stop2Otp: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    // Duration in minutes
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Fare or delivery fee
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    paymentStatus: {
      type: DataTypes.ENUM("pending", "paid", "failed"),
      defaultValue: "pending",
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "requested",
        "accepted",
        "in_transit",
        "completed",
        "cancelled"
      ),
      defaultValue: "requested",
      allowNull: false,
    },
    intransitStatus: {
      type: DataTypes.ENUM("toPickup", "toStop1", "toStop2", "toDropOff"),
      allowNull: true,
    },
    scheduleStatus: {
      type: DataTypes.ENUM("unscheduled", "scheduled", "ongoing", "done"),
      defaultValue: "unscheduled",
      allowNull: false,
    },
    scheduleDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  //   // Associations (assuming User and Driver models are defined)
  //   Delivery.associate = (models) => {
  //     Delivery.belongsTo(models.User, {
  //       foreignKey: 'userId',
  //       as: 'customer',
  //     });
  //     Delivery.belongsTo(models.Driver, {
  //       foreignKey: 'driverId',
  //       as: 'driver',
  //     });
  //   };

  return Delivery;
};
