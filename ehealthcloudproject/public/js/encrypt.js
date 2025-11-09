// encrypt.js

// Encrypt a string with a passphrase
function encryptNotes(plainText, passphrase) {
    return CryptoJS.AES.encrypt(plainText, passphrase).toString();
}

// Decrypt a string with a passphrase
function decryptNotes(cipherText, passphrase) {
    const bytes = CryptoJS.AES.decrypt(cipherText, passphrase);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// Example usage in a form before submission
function encryptBeforeSubmit() {
    const notesField = document.getElementById('notes');
    const encryptedField = document.getElementById('notesEncrypted');
    const passphrase = 'demoKey123'; // For demo purposes; can be dynamic in real projects

    if(notesField && encryptedField) {
        encryptedField.value = encryptNotes(notesField.value, passphrase);
    }
}
