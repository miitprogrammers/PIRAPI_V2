

const cr = require('crypto-js')

const secret = '7538782F413F4428472B4B6250655368'

const crypter = () => {
}

crypter.encryptObject = (obj) => {
    var ciphertext = cr.AES.encrypt(JSON.stringify(obj), secret).toString();
    return ciphertext
}

crypter.decryptObject = (str) => {
    var bytes = cr.AES.decrypt(str, secret);
    var decryptedData = JSON.parse(bytes.toString(cr.enc.Utf8));
    return decryptedData;
}

crypter.encryptText = (str) => {
    var ciphertext = cr.AES.encrypt(str, secret).toString();
    return ciphertext
}

crypter.decryptText = (str) => {
    var bytes = cr.AES.decrypt(str, secret);
    var originalText = bytes.toString(cr.enc.Utf8);
    return originalText
}

module.exports = crypter