"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path = __importStar(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const express_busboy_1 = __importDefault(require("express-busboy"));
const app = (0, express_1.default)();
const port = 3001;
const temp = os_1.default.tmpdir(); //chemin de la racine du dossier
app.use(express_1.default.static('frontend'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const regex = /[^A-Za-z0-9]/g;
express_busboy_1.default.extend(app, {
    upload: true,
    path: temp,
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
app.get('/api/drive', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tempReadDir = yield fs_1.default.promises.readdir(temp, { withFileTypes: true }); // read le temp en affichan tout sans disctinction (dossier ou ficher)
    const dataRead = tempReadDir.map(x => {
        if (x.isDirectory()) { //grace a readdir je peut appeler les methodes isdirectory et .size
            return {
                name: x.name,
                isFolder: x.isDirectory()
            };
        }
        else {
            return {
                name: x.name,
                size: fs_1.default.statSync(path.join(temp, x.name)).size,
                isFolder: x.isDirectory()
            };
        }
    });
    res.status(201).send(dataRead);
}));
app.get('/api/drive/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const paramRequest = req.params[0];
    if (fs_1.default.lstatSync(path.join(temp, paramRequest)).isDirectory()) {
        const newPath = yield fs_1.default.promises.readdir(path.join(temp, paramRequest), { withFileTypes: true });
        const test = newPath.map(array => {
            if (array.isDirectory()) { //grace a readdir je peut appeler les methodes isdirectory et .size
                return {
                    name: array.name,
                    isFolder: array.isDirectory()
                };
            }
            else {
                let size = fs_1.default.statSync(path.join(temp, paramRequest, array.name)).size;
                return {
                    size: size,
                    name: array.name,
                    isFolder: array.isDirectory()
                };
            }
        });
        res.status(200).send(test);
    }
    else {
        res.send(fs_1.default.readFileSync(path.join(temp, paramRequest)));
    }
}));
app.post('/api/drive', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const newQuery = req.query.name;
    if (regex.test(newQuery)) {
        res.status(400).send("Only alphanumeric characters please! ");
    }
    else {
        const newFolder = (path.join(temp, req.query.name));
        if (fs_1.default.existsSync(newFolder)) {
            res.send('<h1>Given Directory already exists !!<h1');
        }
        else {
            fs_1.default.mkdir(newFolder, { recursive: true }, (error) => {
                if (error) {
                    res.send("Directory not created, error");
                }
                else {
                    res.status(201).send('<h1>Directory successfully created</h1>');
                }
            });
        }
    }
}));
app.post('/api/drive/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const newParams = req.params[0];
    const newFolder = (path.join(temp, newParams, req.query.name));
    if (!regex.test(newFolder)) {
        res.status(400).send("Only alphanumeric characters please! ");
    }
    else if (fs_1.default.existsSync(newFolder)) {
        res.send('<h1>Given Directory already exists !!</h1>');
    }
    else {
        fs_1.default.mkdir(newFolder, { recursive: true }, (error) => {
            if (error) {
                res.send("Directory not created, error");
            }
            else {
                res.status(201).send('<h1>Directory successfully created</h1>');
            }
        });
    }
}));
app.delete('/api/drive/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const deleteParams = req.params[0];
    const deleteQuery = (path.join(temp, deleteParams));
    if (fs_1.default.existsSync(deleteQuery)) {
        fs_1.default.rmSync(deleteQuery, { recursive: true });
        return res.status(200).send("file deleted");
    }
    else {
        res.status(400).send('<h1>le fichier n\'existe pas</h1>');
    }
}));
app.put('/api/drive', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.setHeader('Content-Type', 'multipart/form-data');
    const nameFile = req.files.file.filename;
    if (!fs_1.default.existsSync(path.join(temp, nameFile))) {
        if (nameFile) {
            fs_1.default.copyFileSync(req.files.file.file, temp + "/" + nameFile);
            res.status(201).send(nameFile);
        }
        else {
            res.status(400).send('<h1>the upload failed</h1>');
        }
    }
    else {
        res.status(400).send("file already exist!");
    }
}));
app.put('/api/drive/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.setHeader('Content-Type', 'multipart/form-data');
    const currentDirectory = req.params[0];
    const nameFilesRecursive = req.files.file.filename;
    if (nameFilesRecursive) {
        fs_1.default.copyFileSync(req.files.file.file, temp + "/" + currentDirectory + "/" + nameFilesRecursive);
        res.status(201).send('<h1>the file is successfully created</h1>');
    }
    else {
        res.status(400).send('<h1>the upload failed</h1>');
    }
}));
app.all('*', (req, res) => {
    res.status(404).send('<h1>404! Page not found</h1>');
});
