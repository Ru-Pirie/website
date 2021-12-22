module.exports = (sequelize, DataTypes) => {
	const table = sequelize.define('accessLog', {
        accessTime: {
            type: DataTypes.DATE,
        },
        address: {
            type: DataTypes.STRING(4096),
        },
        ip: {
            type: DataTypes.STRING(2048),
        },
        connection: {
            type: DataTypes.STRING(2048),
        },
		type: {
			type: DataTypes.STRING(2048),
		},
		platform: {
			type: DataTypes.STRING(2048),
		},
        vendor: {
            type: DataTypes.STRING(2048),
        },
        device: {
            type: DataTypes.STRING(2048),
        },
        rawAgent: {
            type: DataTypes.STRING(2048),  
        },
        rawDevice: {
            type: DataTypes.JSON,
        }
	});

	return table;
};
