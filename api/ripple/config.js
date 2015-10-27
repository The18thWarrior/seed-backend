var hosts = 'api.ripple.com';
var walletAddress = '';
var walletSecret = '';

function getMasterWalletInfo() {
	var master = {
		address: walletAddress,
		secret: walletSecret
	};

	return master;
}

exports.hosts = hosts;
exports.getMasterWalletInfo = getMasterWalletInfo;
