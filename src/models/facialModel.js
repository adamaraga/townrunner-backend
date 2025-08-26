module.exports = (sequelize, DataTypes) => {
  const Facial = sequelize.define("facial", {
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
      unique: true,
    },
    faceId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    collectionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return Facial;
};
