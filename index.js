const express = require('express');
const rpcMethods = require('./routes/api');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/BTCmessage/api', rpcMethods);

const port = process.env.PORT || 4455;

app.listen(port, () => console.log(`Server running on port ${port}`));
