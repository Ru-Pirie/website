module.exports = (sequelize, DataTypes) => {
	const table = sequelize.define('example', {
		name: {
			type: DataTypes.STRING(2048),
			allowNull: false,
		},
		value: {
			type: DataTypes.STRING(2048),
		},
	});

	return table;
};
