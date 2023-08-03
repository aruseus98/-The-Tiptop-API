const express = require('express')
require('dotenv').config();
const { swaggerUi, specs } = require('./docs/swagger');


const app = express();


// Intégrer Swagger UI à votre application
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


const PORT = process.env.PORT || 4000;


app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });