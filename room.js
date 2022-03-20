export class Room {
    constructor(name, password) {
        this.name = name
        this.password = password
        this.users = new Set();
        this.texts = new Map();
    }
    updateText(name, value) {
        this.texts.set(name, value);
    }
    setTexts(texts) {
        for (let t of texts) {
            this.texts.set(t.name, t.value);
        }
    }
    getTexts() {
        return this.texts;
    }
    getText(name) {
        return this.texts.get(name);
    }
    hasText(name) {
        return this.texts.has(name);
    }
    checkPassword(p) {
        return this.password == p
    }
    addUser(id, password) {
        if (this.password != password) {
            return false;
        }
        this.users.add(id);
        return true
    }
    removeUser(id) {
        this.users.delete(id);
    }
    getUsers() {
        return Array.from(this.users);
    }
    hasUser(id) {
        return this.users.has(id);
    }
}
