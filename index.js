const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors')
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const serviceAccount = require("./volunteer-network-f60dc-firebase-adminsdk-q8xoz-4a8557d21d.json");
// initialize App
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});
// Connect info
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.as6ok.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
// use app
const app = express()
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors())
// create Connection
client.connect(err => {
    const projectsCollection = client.db("volunteerNetwork").collection("projects");
    const usersCollection = client.db("volunteerNetwork").collection("userData");
    // Add event in the home page
    app.post('/addProject', (req, res) => {
        const project = req.body
        projectsCollection.insertOne(project)
            .then(result => {
                res.send('successful')
            })
    })
    // Show event in the home page
    app.get('/getProject', (req, res) => {
        projectsCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })
    // Get volunteer list in admin panel
    app.get('/getVolunteer', (req, res) => {
        usersCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })
    // Remove volunteer from list
    app.delete('/deleteItem/:id', (req, res) => {
        usersCollection.deleteOne({
                _id: ObjectId(req.params.id)
            })
            .then(result => {
                if(result.deletedCount > 0){
                    console.log(result)
                }
            })
    })
    // Add volunteer project for user
    app.post('/addInfo', (req, res) => {
        const userInfo = req.body
        usersCollection.insertOne(userInfo)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })
    // Show volunteer project for user
    app.get('/user', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    let tokenEmail = decodedToken.email;
                    usersCollection.find({
                            email: tokenEmail
                        })
                        .toArray((err, documents) => {
                            res.send(documents)
                        })
                }).catch((error) => {
                    res.sendStatus(401);
                });
        } else {
            res.sendStatus(401);
        }
    })
    // Remove volunteer project from user
    app.delete('/deleteData/:id', (req, res) => {
        usersCollection.deleteOne({
                _id: ObjectId(req.params.id)
            })
            .then(result => {
                // if(result.deletedCount > 0){
                    console.log(result)
                // }
            })
    })

});

app.listen(process.env.PORT || 5000);