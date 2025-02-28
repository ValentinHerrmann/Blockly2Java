const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8082;

app.use(bodyParser.text({ type: 'text/xml' }));
app.use(bodyParser.text({ type: 'text/java' }));

app.listen(PORT, () => {
    console.log("Server Listening on PORT: ", PORT);
});

app.get("/status", (request, response) => {
    const status = {
        "Status": "Running"
    };
    response.send(status);
});

app.post('/api', (req, res) => {
    const contentType = req.headers['content-type'];
    const code = req.body;

    if (contentType === 'text/xml') {
        console.log('Received XML code:', code);
    } else if (contentType === 'text/java') {
        console.log('Received Java code:', code);
    } else {
        return res.status(400).send('Unsupported content type');
    }

    res.status(200).send('Code received');
});