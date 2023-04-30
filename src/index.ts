import * as sqlite3 from 'sqlite3';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { SurveyQuery, b2n, jsonToSql, n2b, sqlToJson, validateQuery, validateSurvey } from './survey.model';

//init express app
const app = express();
const port = 80;

let db = new sqlite3.Database('./db/surveys.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the babytrend database.');
});

const API_KEY = "6441372439cf552ef728c331";

//filter all requests that doesn't have the API_KEY
app.use((req, res, next) => {
    if(/\/api\//.test(req.path)) {
        if (req.headers["x-apikey"] === API_KEY) {
            next();
        } else {
            res.status(401).send("Invalid API key");
        }
    } else  {
        next();
    }
});
app.use(express.static("public"));
app.use(bodyParser.json());

app.post("/api/survey", async (req, res) => {
    const data = req.body;
    if(!validateSurvey(data)) {
        res.status(400).send("Invalid survey");
        return;
    }
    
    // generate _id
    data._id = Math.random().toString(36).substring(2, 9);
    const mdl = jsonToSql(data);
    
    // save to db
    db.run(`INSERT INTO survey (_id, date, type, weight, height, poop, pee, eat, blurp, temperature, commentaire) VALUES ('${mdl._id}', ${mdl.date}, '${mdl.type}', ${mdl.weight || 'NULL'}, ${mdl.height || 'NULL'}, ${mdl.poop || 'NULL'}, ${mdl.pee || 'NULL'}, ${mdl.eat || 'NULL'}, ${mdl.blurp || 'NULL'}, ${mdl.temperature || 'NULL'}, '${mdl.commentaire}')`, function(err) {
        if (err) {
            res.status(400).send("Invalid survey");
            return console.log(err.message);
        }
        
        // send back
        res.send(sqlToJson(mdl));
        console.log(`A row has been inserted with rowid ${this.lastID} and id ${mdl._id}`);
    });
});

app.put("/api/survey/:id", async (req, res) => {
    const data = req.body;
    const id = req.params.id;
    if(!validateSurvey(data)) {
        res.status(400).send("Invalid survey");
        return;
    }

    const mdl = jsonToSql(data);
    
    // save to db
    // only save the fields that are not undefined
    const setted = []
    if (mdl.date !== undefined) setted.push(`date = ${mdl.date}`);
    if (mdl.type !== undefined) setted.push(`type = '${mdl.type}'`);
    if (mdl.weight !== undefined) setted.push(`weight = ${mdl.weight}`);
    if (mdl.height !== undefined) setted.push(`height = ${mdl.height}`);
    if (mdl.poop !== undefined) setted.push(`poop = ${mdl.poop}`);
    if (mdl.pee !== undefined) setted.push(`pee = ${mdl.pee}`);
    if (mdl.eat !== undefined) setted.push(`eat = ${mdl.eat}`);
    if (mdl.blurp !== undefined) setted.push(`blurp = ${mdl.blurp}`);
    if (mdl.temperature !== undefined) setted.push(`temperature = ${mdl.temperature}`);
    if (mdl.commentaire !== undefined) setted.push(`commentaire = '${mdl.commentaire}'`);

    db.run(`UPDATE survey SET ${setted.join(', ')} WHERE _id = '${id}'`, function(err) {
        if (err) {
            res.status(400).send("Invalid survey");
            return console.log(err.message);
        }
        // send back
        res.send(sqlToJson(mdl));
        console.log(`Row(s) updated: ${this.changes}`);
    });

});

app.delete("/api/survey/:id", async (req, res) => {
    const id = req.params.id;
    
    db.run(`DELETE FROM survey WHERE _id = '${id}'`, function(err) {
        if (err) {
            res.status(400).send("Invalid survey id");
            return console.log(err.message);
        }
        // send back
        res.send({id});
        console.log(`Row(s) deleted ${this.changes}`);
    });

});

app.get("/api/survey/:id", async (req, res) => {
    const id = req.params.id;
    
    db.get(`SELECT * FROM survey WHERE _id = '${id}'`, function(err, row) {
        if (err) {
            res.status(400).send("Invalid survey id");
            return console.log(err.message);
        }
        res.send(sqlToJson(row));
    });
});

app.get("/api/survey", async (req, res) => {
    const query: SurveyQuery = JSON.parse(req.query.q as any);
    const { max, skip, sortBy, count } = req.query;

    if (!validateQuery(query)) {
        res.status(400).send("Invalid query");
        return;
    }
    if(sortBy && !Array.isArray(JSON.parse(sortBy as any))) {
        res.status(400).send("Invalid sortBy");
        return;
    }
    if(max && isNaN(max as any)) {
        res.status(400).send("Invalid max");
        return;
    }
    if(skip && isNaN(skip as any)) {
        res.status(400).send("Invalid skip");
        return;
    }

    // generate query
    let sql = count ? `SELECT count(_id) FROM survey WHERE 1=1` : `SELECT * FROM survey WHERE 1=1`;
    if (query?.type) sql += ` AND type = '${query.type}'`;
    if (query?.dateFrom) sql += ` AND date >= ${query.dateFrom}`;
    if (query?.dateTo) sql += ` AND date <= ${query.dateTo}`;
    if (query?.minWeight) sql += ` AND weight >= ${query.minWeight}`;
    if (query?.minHeight) sql += ` AND height >= ${query.minHeight}`;
    if (query?.minTemperature) sql += ` AND temperature >= ${query.minTemperature}`;
    if (query?.blurp) sql += ` AND blurp = ${b2n(query.blurp)}`;
    if (query?.poop) sql += ` AND poop = ${b2n(query.poop)}`;
    if (query?.pee) sql += ` AND pee = ${b2n(query.pee)}`;
    if (query?.eat) sql += ` AND eat = ${b2n(query.eat)}`;
    if (sortBy) {
        const sort = JSON.parse(sortBy as any);
        for (const s of sort){
            sql += ` ORDER BY ${s.key} ${s.order}`;
        }
    }
    if (max) sql += ` LIMIT ${max}`;
    if (skip) sql += ` OFFSET ${skip}`;

    db.all(sql, function(err, rows: any) {
        if (err) {
            res.status(400).send("Invalid query");
            return console.log(err.message);
        }
        res.send(rows.map(sqlToJson));
    });
});

app.listen(port, () => {
    console.log(`BabyTrend server app listening at http://localhost:${port}`)
});