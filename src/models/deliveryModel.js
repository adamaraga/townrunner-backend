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
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Duration in minutes
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    pickupOtp: {
      type: DataTypes.STRING(4),
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

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    // Fare or delivery fee
    riderPay: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    riderLat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    riderLng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },

    paymentStatus: {
      type: DataTypes.ENUM("pending", "paid", "failed"),
      defaultValue: "pending",
      allowNull: false,
    },

    paymentReference: {
      type: DataTypes.STRING,
      allowNull: true,
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
    cancelledReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    intransitStatus: {
      type: DataTypes.ENUM(
        "toPickup",
        "atPickup",
        "toStop1",
        "atStop1",
        "toStop2",
        "atStop2",
        "toDropOff",
        "atDropOff"
      ),
      allowNull: true,
      defaultValue: "toPickup",
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
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.0,
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
