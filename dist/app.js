"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-misused-promises */
const express_1 = __importDefault(require("express"));
const co_1 = require("./co");
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
const port = 3000;
app.use(body_parser_1.default.json());
app.get('/', (req, res) => {
    res.json('oke');
});
app.post('/send', async (req, res) => {
    await (0, co_1.send)(req.body.message, req.body.to)
        .then(() => res.json('oke'));
});
// eslint-disable-next-line @typescript-eslint/no-floating-promises
(0, co_1.connection)()
    .then(() => {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
});
