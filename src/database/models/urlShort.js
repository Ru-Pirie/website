module.exports = (sequelize, DataTypes) => {
	const table = sequelize.define('shortener', {
		url: {
			type: DataTypes.STRING(2048),
		},
		destination: {
			type: DataTypes.STRING(4096),
		},
        clicks: {
            type: DataTypes.INTEGER,
        },
        created: {
            type: DataTypes.DATE,
        },
        lastClicked: {
            type: DataTypes.DATE,
        }
	});

	return table;
};
