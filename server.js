const express = require('express');
const app = express();
const port = 3001;
const os = require('os');
const fs = require("fs");
const temp = os.tmpdir(); //chemin de la racine du dossier
app.use(express.static('frontend'));
app.use(express.json());
app.use(express.urlencoded({extended : true}));
const path = require('node:path');
const regex = /[^A-Za-z0-9]/g;
const Busboy = require('express-busboy');
Busboy.extend(app);

Busboy.extend(app, {
    upload:true,
    path: temp,
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

app.get('/api/drive', async (req, res) => {
    const tempReadDir = await fs.promises.readdir(temp, { withFileTypes : true }); // read le temp en affichan tout sans disctinction (dossier ou ficher)
     const dataRead = tempReadDir.map(x=> { //il attend que la promesse soit tenu
         if(x.isDirectory()){ //grace a readdir je peut appeler les methodes isdirectory et .size
             return {
                 name : x.name,
                 isFolder : x.isDirectory()
             };
         }
         else{
            return {
                name : x.name
                ,size: fs.statSync(path.join(temp, x.name)).size ,
                isFolder: x.isDirectory()
            };
         }
     });
    res.status(201).send(dataRead);
})

app.get('/api/drive/*',async (req, res) => {
    const paramRequest = req.params[0];
    if(fs.lstatSync(path.join(temp,paramRequest)).isDirectory()){
        const newPath = await fs.promises.readdir(path.join(temp, paramRequest), {withFileTypes: true});
        const test = newPath.map(array => {
            if (array.isDirectory()) { //grace a readdir je peut appeler les methodes isdirectory et .size
                return {
                    name: array.name,
                    isFolder: array.isDirectory()
                }
            } else {
                return {
                    name: array.name
                    , size: fs.statSync(path.join(temp, paramRequest, array.name)).size,
                    isFolder: array.isDirectory()
                }
            }

        });
        res.status(200).send(test);
    } else{
        res.send(fs.readFileSync(path.join(temp, paramRequest)));
    }
});

app.post('/api/drive', async (req, res)=>{
    const newQuery = req.query.name;
    if(regex.test(newQuery)){
     res.status(400).send("Only alphanumeric characters please! ");
    } else{
        const newFolder = (path.join(temp, req.query.name));
        if (fs.existsSync(newFolder)){
            res.send('<h1>Given Directory already exists !!<h1');
        } else{
            fs.mkdir(newFolder, {recursive: true},(error) =>{
                if(error){
                    res.send("Directory not created, error");
                }else{
                    res.status(201).send('<h1>Directory successfully created</h1>');
                }
            });
        }
    }
});

app.post('/api/drive/*', async (req, res)=>{
    const newParams = req.params[0];
    const newFolder = (path.join(temp, newParams, req.query.name));
    if(!regex.test(newFolder)){
        res.status(400).send("Only alphanumeric characters please! ");
    } else if(fs.existsSync(newFolder)){
            res.send('<h1>Given Directory already exists !!</h1>');
    } else{
        fs.mkdir(newFolder, {recursive: true},(error) =>
        {
            if(error){
            res.send("Directory not created, error");
        }else{
            res.status(201).send('<h1>Directory successfully created</h1>');
        }
        });
    }
});

app.delete('/api/drive/*', async(req, res) =>{
    const deleteParams = req.params[0];
    const deleteQuery = (path.join(temp, deleteParams));
    if(fs.existsSync(deleteQuery)){
        fs.rmSync(deleteQuery, {recursive : true});
        return res.status(200).send("file deleted");
    }else{
        res.status(400).send('<h1>le fichier n\'existe pas</h1>');
    }
});

app.put('/api/drive/:folder', async (req, res) =>{
    res.setHeader('Content-Type', 'multipart/form-data');

    const test = req.files.file.filename;
    if(test){
        fs.copyFileSync(req.files.file.file, temp + test);
        res.status(201).send('<h1>the file is successfully uploaded</h1>');
    } else{
        res.status(400).send('<h1>the upload failed</h1>');
    }
   // const fileName = req.files.file.filename;
    //console.log(fileName);

    /*if (!regex.test(fileName)) {
        res.status(400).send('Le nom de fichier doit être alphanumérique');
        return;
    }

    // Vérifie que le fichier a bien été uploadé
    if (!req.files || !req.files.file) {
        res.status(400).send('Aucun fichier n\'a été uploadé');
        return;
    }

    const file = req.files.file;

    // Vérifie que la taille du fichier est inférieure à 10 Mo
    if (file.size > 10 * 1024 * 1024) {
        res.status(400).send('Le fichier est trop volumineux (maximum 10 Mo)');
        return;
    }

    const filePath = path.join(temp, fileName);

    // Écrit le contenu du fichier dans le chemin spécifié
    file.mv(filePath, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erreur lors de l\'écriture du fichier');
        } else {
            res.status(201).send('Fichier uploadé avec succès');
        }
    });*/
});

/*app.all('*', (req, res) => {
    res.status(404).send('<h1>404! Page not found</h1>');
});*/